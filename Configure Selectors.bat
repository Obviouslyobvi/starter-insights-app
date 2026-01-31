@echo off
title PFAC Pro Selector Helper
echo ===============================================
echo    PFAC Pro Selector Helper
echo ===============================================
echo.
echo This tool helps you configure the correct selectors
echo for your specific page layout.
echo.

cd /d "%~dp0"

node scraper/selectorHelper.js

echo.
pause
