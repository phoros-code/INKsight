@echo off
echo Starting Voice Agent...
call "%~dp0venv\Scripts\activate.bat"
python live_agent.py
