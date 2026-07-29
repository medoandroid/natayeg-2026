# DevMeDoAnDrOiD
import sqlite3
import pandas as pd
import os
import time

excel_path = r"c:\Users\MEDOANDROID\Desktop\ntega\نتيجة ثانوية عامة نظام حديث.xlsx"
db_path = r"c:\Users\MEDOANDROID\Desktop\ntega\ntega.db"

if os.path.exists(db_path):
    os.remove(db_path)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE students (
    seating_no INTEGER PRIMARY KEY,
    arabic_name TEXT,
    total_degree REAL,
    student_case_desc TEXT
);
""")

df = pd.read_excel(excel_path)
df.to_sql('students', conn, if_exists='append', index=False)
conn.commit()

cursor.execute("""
CREATE VIRTUAL TABLE students_fts USING fts5(
    arabic_name,
    content='students',
    content_rowid='seating_no'
);
""")

cursor.execute("""
INSERT INTO students_fts(rowid, arabic_name)
SELECT seating_no, arabic_name FROM students;
""")
conn.commit()

cursor.execute("CREATE INDEX IF NOT EXISTS idx_arabic_name ON students(arabic_name);")
conn.commit()

cursor.execute("VACUUM;")
conn.commit()

cursor.execute("SELECT COUNT(*) FROM students;")
db_rows = cursor.fetchone()[0]
assert db_rows == df.shape[0], "Row count validation failed!"

conn.close()
# Copyright (c) 2026 MeDoAnDrOiD. All Rights Reserved.
