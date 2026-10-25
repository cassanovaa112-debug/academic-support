@echo off
REM Jalankan Academic Support Service (Windows): dobel-klik file ini.
REM Pertama kali: membuat virtualenv, memasang dependensi, dan mengisi data demo.
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python belum terpasang. Unduh dari https://www.python.org/downloads/ lalu jalankan ulang.
  pause
  exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo [1/2] Membuat virtual environment...
  python -m venv .venv || goto :error
)

echo [2/2] Memeriksa dependensi...
".venv\Scripts\python.exe" -m pip install -q -r requirements.txt || goto :error

REM buka browser setelah server sempat menyala
start "" /b cmd /c "timeout /t 3 >nul & start "" http://127.0.0.1:5000"
".venv\Scripts\python.exe" run.py --demo %*
pause
exit /b 0

:error
echo Terjadi kesalahan saat persiapan. Lihat pesan di atas.
pause
exit /b 1
