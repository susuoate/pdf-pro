@echo off
title PDF PRO BY Oatdh - Dev Server
echo ========================================================
echo   Starting PDF PRO BY Oatdh Local Web Server...
echo ========================================================
cd /d "%~dp0"
start http://localhost:5173/
npm.cmd run dev -- --host --port 5173
pause
