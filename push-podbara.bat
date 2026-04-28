@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo === Push Podbara ===
echo.
git status --short
echo.

git diff --quiet HEAD --
if errorlevel 1 (
    set /p MSG="Unesi commit poruku: "
    git add .
    git commit -m "!MSG!"
    if errorlevel 1 (
        echo.
        echo GRESKA: commit nije prosao.
        pause
        exit /b 1
    )
)

echo.
echo Push na GitHub...
git push

if errorlevel 1 (
    echo.
    echo GRESKA: push nije prosao. Vidi poruku iznad.
    pause
    exit /b 1
)

echo.
echo === GOTOVO ===
echo Sajt: https://imicunovic83.github.io/Podbara/
echo (auto-update za 1-2 min, koristi Ctrl+Shift+R u browseru)
echo.
pause
