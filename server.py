# DevMeDoAnDrOiD
import os
import json
import sqlite3
import time
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler, ThreadingHTTPServer

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ntega.db")
PORT = 8000

STATS_CACHE = None

def get_stats():
    global STATS_CACHE
    if STATS_CACHE is not None:
        return STATS_CACHE

    if not os.path.exists(DB_PATH):
        return {"total_students": 0, "passed_students": 0, "pass_rate": 0, "max_degree": 320}

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM students;")
    total = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM students WHERE student_case_desc LIKE '%ناجح%';")
    passed = cursor.fetchone()[0]

    cursor.execute("SELECT MAX(total_degree) FROM students;")
    max_deg = cursor.fetchone()[0] or 320

    conn.close()

    pass_rate = round((passed / total * 100), 1) if total > 0 else 0

    STATS_CACHE = {
        "total_students": total,
        "passed_students": passed,
        "pass_rate": pass_rate,
        "max_degree": max_deg
    }
    return STATS_CACHE

class NtegaRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query_params = urllib.parse.parse_qs(parsed.query)

        if path == "/api/search":
            self.handle_api_search(query_params)
        elif path == "/api/stats":
            self.handle_api_stats()
        else:
            self.handle_static_files(path)

    def handle_api_stats(self):
        stats = get_stats()
        self.send_json_response(stats)

    def handle_api_search(self, query_params):
        q = query_params.get('q', [''])[0].strip()
        filter_type = query_params.get('filter', ['all'])[0].strip()
        limit = min(int(query_params.get('limit', [50])[0]), 200)
        offset = max(int(query_params.get('offset', [0])[0]), 0)

        start_time = time.time()

        if not os.path.exists(DB_PATH):
            self.send_json_response({"error": "Database file not found", "results": [], "time_ms": 0}, status=500)
            return

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        filter_clause = ""
        params = []

        if filter_type == "pass":
            filter_clause = " AND student_case_desc LIKE '%ناجح%'"
        elif filter_type == "second":
            filter_clause = " AND student_case_desc LIKE '%دور ثان%'"
        elif filter_type == "top":
            filter_clause = " AND total_degree >= 288"

        stats = get_stats()
        max_score = stats.get("max_degree", 320) or 320

        try:
            if not q:
                where = f"WHERE 1=1 {filter_clause}"
                sql = f"SELECT seating_no, arabic_name, total_degree, student_case_desc FROM students {where} ORDER BY total_degree DESC LIMIT ? OFFSET ?"
                params.extend([limit, offset])
                cursor.execute(sql, params)
                rows = cursor.fetchall()
            elif q.isdigit():
                where = f"WHERE seating_no LIKE ? {filter_clause}"
                sql = f"SELECT seating_no, arabic_name, total_degree, student_case_desc FROM students {where} LIMIT ? OFFSET ?"
                params.extend([q + '%', limit, offset])
                cursor.execute(sql, params)
                rows = cursor.fetchall()
            else:
                words = [w for w in q.split() if w]
                fts_query = " AND ".join([f'"{w}"*' for w in words])
                
                try:
                    where = f"WHERE f.arabic_name MATCH ? {filter_clause.replace('student_case_desc', 's.student_case_desc').replace('total_degree', 's.total_degree')}"
                    sql = f"""
                        SELECT s.seating_no, s.arabic_name, s.total_degree, s.student_case_desc
                        FROM students_fts f
                        JOIN students s ON s.seating_no = f.rowid
                        {where}
                        LIMIT ? OFFSET ?
                    """
                    params.extend([fts_query, limit, offset])
                    cursor.execute(sql, params)
                    rows = cursor.fetchall()
                except sqlite3.OperationalError:
                    where = f"WHERE arabic_name LIKE ? {filter_clause}"
                    sql = f"SELECT seating_no, arabic_name, total_degree, student_case_desc FROM students {where} LIMIT ? OFFSET ?"
                    params.extend(['%' + q + '%', limit, offset])
                    cursor.execute(sql, params)
                    rows = cursor.fetchall()

            results = []
            for r in rows:
                item = dict(r)
                degree = item.get('total_degree', 0)
                item['percentage'] = round((degree / max_score) * 100, 2) if max_score > 0 else 0
                results.append(item)

        except Exception as e:
            self.send_json_response({"error": str(e), "results": [], "time_ms": 0}, status=500)
            conn.close()
            return

        conn.close()
        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        self.send_json_response({
            "results": results,
            "count": len(results),
            "time_ms": elapsed_ms
        })

    def handle_static_files(self, path):
        if path == "/" or path == "":
            file_name = "index.html"
        else:
            file_name = path.lstrip("/")

        base_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.normpath(os.path.join(base_dir, file_name))

        if not file_path.startswith(base_dir) or not os.path.exists(file_path) or os.path.isdir(file_path):
            self.send_response(404)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write("404 Not Found".encode('utf-8'))
            return

        ext = os.path.splitext(file_path)[1].lower()
        mime_types = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon"
        }
        content_type = mime_types.get(ext, "application/octet-stream")

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()

        with open(file_path, "rb") as f:
            self.wfile.write(f.read())

    def send_json_response(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass

def run_server():
    server_address = ('', PORT)
    httpd = ThreadingHTTPServer(server_address, NtegaRequestHandler)
    print(f"Server starting on port {PORT}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()

if __name__ == "__main__":
    run_server()

# Copyright (c) 2026 MeDoAnDrOiD. All Rights Reserved.
