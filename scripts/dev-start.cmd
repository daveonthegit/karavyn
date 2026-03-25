@echo off
rem -NoExit keeps the window open after the script finishes so output is not lost
powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0dev-start.ps1"
