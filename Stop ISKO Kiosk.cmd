@echo off
setlocal
start "" /b powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0Launch-ISKO-Kiosk.ps1" -Stop
exit /b
