@echo off
chcp 65001 >nul
title 打包艾尔登法环探索罗盘为独立EXE
cd /d "%~dp0"

echo ========================================================
echo   正在使用 PyInstaller 将罗盘打包为独立无需CMD的EXE程序
echo ========================================================
echo.

pyinstaller --noconsole --onefile --name "EldenCompass" ^
  --icon "app.ico" ^
  --add-data "static;static" ^
  --add-data "data;data" ^
  main.py --clean -y

if %errorlevel% equ 0 (
    copy /y "dist\EldenCompass.exe" "法环探索罗盘.exe" >nul
    copy /y "dist\EldenCompass.exe" "EldenCompass.exe" >nul
    echo.
    echo ========================================================
    echo 打包成功！独立可执行文件位于:
    echo   1. 法环探索罗盘.exe (根目录下)
    echo   2. dist\EldenCompass.exe
    echo ========================================================
) else (
    echo.
    echo [提示] 打包过程遇到异常，请直接使用 start_compass.pyw 或 start.bat 无黑框运行。
)

pause
