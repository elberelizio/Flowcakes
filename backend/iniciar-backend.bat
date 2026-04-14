@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

set "SERVER_PORT=8081"
set "DB_PASSWORD=admin"

if defined JAVA_HOME if exist "%JAVA_HOME%\bin\java.exe" goto java_ok
set "JAVA_HOME="

if exist "%~dp0java\bin\java.exe" (
  for %%p in ("%~dp0java") do set "JAVA_HOME=%%~fp"
  goto java_ok
)
if exist "%~dp0..\java\bin\java.exe" (
  for %%p in ("%~dp0..\java") do set "JAVA_HOME=%%~fp"
  goto java_ok
)

where java >nul 2>&1
if errorlevel 1 (
  echo ERRO: Java nao encontrado. Defina JAVA_HOME ou instale JDK 17+.
  exit /b 1
)
for /f "delims=" %%J in ('where java 2^>nul') do (
  set "JBIN=%%~dpJ"
  set "JBIN=!JBIN:~0,-1!"
  for %%p in ("!JBIN!\..") do set "JAVA_HOME=%%~fp"
  goto java_from_path
)
:java_from_path
if not defined JAVA_HOME (
  echo ERRO: Nao foi possivel determinar JAVA_HOME a partir do PATH.
  exit /b 1
)
if not exist "%JAVA_HOME%\bin\java.exe" (
  echo ERRO: JAVA_HOME invalido: %JAVA_HOME%
  exit /b 1
)

:java_ok
echo Java: %JAVA_HOME%
echo A iniciar backend na porta %SERVER_PORT%...
call "%~dp0mvnw.cmd" spring-boot:run %*
exit /b %ERRORLEVEL%
