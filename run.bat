@echo off
REM DevMeDoAnDrOiD
title Thanaweya Amma 2026 Results System - DevMeDoAnDrOiD

echo ========================================================
echo   Thanaweya Amma 2026 Ultra Search System
echo   Developer: DevMeDoAnDrOiD
echo ========================================================
echo.

if not exist ntega.db (
    echo [!] Database ntega.db not found. Building database from Excel file...
    python prepare_database.py
    if errorlevel 1 (
        echo [X] Error preparing database. Please check Python and dependencies.
        pause
        exit /b 1
    )
)

echo [+] Starting Web Server...
start http://localhost:8000
python server.py

pause
REM Copyright (c) 2026 MeDoAnDrOiD. All Rights Reserved.
