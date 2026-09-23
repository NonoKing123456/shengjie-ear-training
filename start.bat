@echo off
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:4173/"
  py -m http.server 4173 -d dist
) else (
  start "" "%~dp0dist\index.html"
)
