@echo off
title PFAC Pro Contact Scraper - Setup
echo ===============================================
echo    PFAC Pro Contact Scraper - First Time Setup
echo ===============================================
echo.

cd /d "%~dp0"

echo Installing Playwright browser...
echo This may take a few minutes on first run.
echo.

call npx playwright install chromium

echo.
echo ===============================================
echo    Setup Complete!
echo ===============================================
echo.
echo You can now run "Run Scraper.bat" to start scraping.
echo.
pause
