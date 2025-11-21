@echo off
chcp 65001 >nul
title 推送到 GitHub - 小七AI選股系統 v2.0

echo.
echo ========================================
echo   小七AI選股系統 v2.0
echo   推送到 GitHub
echo ========================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0push-to-github.ps1"

pause

