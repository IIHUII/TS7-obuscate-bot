@echo off
echo Trying to close bot on port 4000...

:: البحث عن البروسيس الي يستخدم البورت 4000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
    echo Found process using port 4000: PID %%a
    taskkill /PID %%a /F
    echo Process %%a terminated.
    goto end
)

echo No process found using port 4000.
:end
pause
