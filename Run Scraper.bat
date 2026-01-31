@echo off
title PFAC Pro Contact Scraper
echo ===============================================
echo       PFAC Pro Contact Scraper
echo ===============================================
echo.

cd /d "%~dp0"

echo Starting scraper...
echo.
echo The browser will open automatically.
echo If you need to log in, do so and wait for results to appear.
echo The scraper will then run automatically through all pages.
echo.
echo Output will be saved to: contacts_export.csv
echo.

node scraper/contactScraperConfigurable.js

echo.
echo ===============================================
echo Press any key to close this window...
pause >nul
