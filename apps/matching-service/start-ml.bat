@echo off
setlocal
echo Starting KOVARI ML Server on Port 8001...

:: Get the directory where this script is located
set SCRIPT_DIR=%~dp0

:: Navigate to the ML datasets folder relative to the script
cd /d "%SCRIPT_DIR%..\..\packages\api\src\ai\datasets"

:: Use python -m to bypass PATH issues with uvicorn
python -m uvicorn ml_server_fastapi:app --port 8001

pause
