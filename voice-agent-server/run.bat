@echo off
echo ========================================
echo   INKsight Voice Agent Server
echo ========================================
echo.

cd /d "%~dp0"

REM Check for Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH.
    echo Please install Python 3.10+ from https://www.python.org
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt --quiet

REM Check for .env
if not exist ".env" (
    echo.
    echo WARNING: .env file not found!
    echo Copy .env.example to .env and add your GEMINI_API_KEY.
    echo.
    copy .env.example .env >nul 2>&1
)

echo.
echo Starting server on http://localhost:8000
echo Press Ctrl+C to stop.
echo.
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
