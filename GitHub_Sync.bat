@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================================
echo   Klassen-Trainer - Automatisches GitHub-Update (Push)
echo   Repository: https://github.com/Remmi-GSO/Klassentrainer
echo ========================================================
echo.

REM 1. Ordner als sicheres Verzeichnis fuer beide Windows-Benutzer freigeben
git config --global --add safe.directory "D:/Vibe Coding/Lernen_Namen" 2>nul
git config --global --add safe.directory "*" 2>nul

REM 2. Status pruefen & eventuelle neue Aenderungen vormerken
git -c safe.directory="D:/Vibe Coding/Lernen_Namen" add -A
git -c safe.directory="D:/Vibe Coding/Lernen_Namen" status -s
echo.

REM 3. Falls noch unveröffentlichte lokale Aenderungen da sind, committen
git -c safe.directory="D:/Vibe Coding/Lernen_Namen" -c user.name="Peter Remmertz" -c user.email="p.remmertz@gso.schule.koeln" commit -m "Update Klassen-Trainer v11.5" >nul 2>&1

REM 4. Aenderungen an GitHub senden
echo Sende Aenderungen an GitHub (main)...
git -c safe.directory="D:/Vibe Coding/Lernen_Namen" push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo [ERFOLG] Alle Dateien wurden erfolgreich auf GitHub aktualisiert!
    echo ========================================================
) else (
    echo [FEHLER] Push konnte nicht abgeschlossen werden.
)
echo.
pause
