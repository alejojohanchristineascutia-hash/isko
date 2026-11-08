@echo off
setlocal
start "" /b powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0Launch-ISKO.ps1"
exit /b
