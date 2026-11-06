@echo off
chcp 65001 >nul
cd /d "%~dp0"

:: 如果同目录下存在独立的 EldenCompass.exe，优先静默启动
if exist "%~dp0EldenCompass.exe" (
    start "" "%~dp0EldenCompass.exe"
    exit
)

:: 备用：使用 pythonw 静默启动 main.py
start "" pythonw "%~dp0main.py"
exit
