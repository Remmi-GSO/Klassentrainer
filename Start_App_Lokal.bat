@echo off
chcp 65001 > nul
title Klassen-Trainer (Lokaler Server)

echo ========================================================
echo   KLASSEN-TRAINER - LOKALER TEST-SERVER
echo ========================================================
echo.
echo Der Server wird gestartet...
echo Deine Standard-Webseite (z. B. Chrome / Edge) wird gleich geöffnet.
echo.
echo Drücke STRG + C im Fenster, um den Server zu beenden.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$port = 8080;" ^
  "$dir = $PSScriptRoot;" ^
  "if (-not $dir) { $dir = (Get-Location).Path };" ^
  "$listener = New-Object System.Net.HttpListener;" ^
  "$listener.Prefixes.Add(\"http://localhost:$port/\");" ^
  "try { $listener.Start() } catch { Write-Host 'Port 8080 belegt, versuche 8081...'; $port = 8081; $listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add(\"http://localhost:$port/\"); $listener.Start() };" ^
  "Start-Process \"http://localhost:$port/index.html\";" ^
  "Write-Host \"Server läuft unter: http://localhost:$port/\";" ^
  "while ($listener.IsListening) {" ^
  "  $context = $listener.GetContext();" ^
  "  $path = $context.Request.Url.LocalPath.TrimStart('/');" ^
  "  if ([string]::IsNullOrEmpty($path)) { $path = 'index.html' };" ^
  "  $localPath = Join-Path $dir $path;" ^
  "  if (Test-Path $localPath -PathType Leaf) {" ^
  "    $bytes = [System.IO.File]::ReadAllBytes($localPath);" ^
  "    $ext = [System.IO.Path]::GetExtension($localPath).ToLower();" ^
  "    $mime = switch ($ext) {" ^
  "      '.html' { 'text/html; charset=utf-8' }" ^
  "      '.css'  { 'text/css; charset=utf-8' }" ^
  "      '.js'   { 'application/javascript; charset=utf-8' }" ^
  "      '.json' { 'application/json; charset=utf-8' }" ^
  "      '.svg'  { 'image/svg+xml' }" ^
  "      '.webp' { 'image/webp' }" ^
  "      '.png'  { 'image/png' }" ^
  "      '.jpg'  { 'image/jpeg' }" ^
  "      '.webm' { 'audio/webm' }" ^
  "      '.mp3'  { 'audio/mpeg' }" ^
  "      '.wav'  { 'audio/wav' }" ^
  "      '.m4a'  { 'audio/mp4' }" ^
  "      '.ogg'  { 'audio/ogg' }" ^
  "      default { 'application/octet-stream' }" ^
  "    };" ^
  "    $context.Response.ContentType = $mime;" ^
  "    $context.Response.Headers.Add(\"Cache-Control\", \"no-cache, no-store, must-revalidate\");" ^
  "    $context.Response.Headers.Add(\"Pragma\", \"no-cache\");" ^
  "    $context.Response.Headers.Add(\"Expires\", \"0\");" ^
  "    $context.Response.ContentLength64 = $bytes.Length;" ^
  "    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length);" ^
  "  } else {" ^
  "    $context.Response.StatusCode = 404;" ^
  "  };" ^
  "  $context.Response.OutputStream.Close();" ^
  "}"
