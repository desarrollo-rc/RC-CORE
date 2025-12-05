@echo off
TITLE Lanzador Sistema RC Repuesto Center

:: --- CONFIGURACIÓN EXACTA ---
SET "PROYECTO_DIR=C:\Proyectos\RC-CORE"

echo ========================================
echo   INICIANDO SISTEMA RC REPUESTO CENTER
echo ========================================

:: --- 1. LIMPIEZA PREVIA ---
echo.
echo [1/4] Asegurando puertos libres...
:: Cierra procesos en puerto 5000 (Flask) y 5173 (Vite)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

:: --- 2. INICIAR BACKEND (Python) ---
echo.
echo [2/4] Arrancando Servidor Backend...
cd /d "%PROYECTO_DIR%\backend"
:: Abre ventana minimizada. Asume que el venv se llama "venv"
start "RC-Backend" /min cmd /k "call venv\Scripts\activate && flask run"

:: --- 3. INICIAR FRONTEND (PNPM) ---
echo.
echo [3/4] Arrancando Interfaz Visual (pnpm)...
cd /d "%PROYECTO_DIR%\frontend"
:: Abre ventana minimizada ejecutando pnpm
start "RC-Frontend" /min cmd /k "pnpm dev"

:: --- 4. ABRIR NAVEGADOR ---
echo.
echo [4/4] Abriendo Google Chrome...
timeout /t 5 >nul
start http://localhost:5173

echo.
echo ========================================
echo   LISTO! EL SISTEMA ESTA CORRIENDO.
echo   Se han abierto dos ventanas minimizadas.
echo ========================================
timeout /t 5