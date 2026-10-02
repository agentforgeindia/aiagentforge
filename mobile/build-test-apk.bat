@echo off
rem ============================================================
rem  AgentForge Android app - build a TEST APK on this PC
rem  Double-click this file. It needs Node.js and Android Studio
rem  (for its Java + Android SDK). First run downloads build tools
rem  and can take 10-20 minutes.
rem  Everything is written to build-log.txt next to this file.
rem  Result: AgentForge-test.apk in this folder.
rem ============================================================
setlocal EnableExtensions
cd /d "%~dp0"
set "LOG=%~dp0build-log.txt"
echo AgentForge test APK build - %DATE% %TIME% > "%LOG%"

rem --- Java: use Android Studio's bundled JDK when JAVA_HOME is not set
if defined JAVA_HOME goto java_done
if exist "%ProgramFiles%\Android\Android Studio\jbr\bin\java.exe" set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
if defined JAVA_HOME goto java_done
if exist "%LOCALAPPDATA%\Programs\Android Studio\jbr\bin\java.exe" set "JAVA_HOME=%LOCALAPPDATA%\Programs\Android Studio\jbr"
:java_done
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"

rem --- Android SDK: default Android Studio location when not set
if defined ANDROID_HOME goto sdk_done
if exist "%LOCALAPPDATA%\Android\Sdk" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
:sdk_done

echo JAVA_HOME=%JAVA_HOME%>> "%LOG%"
echo ANDROID_HOME=%ANDROID_HOME%>> "%LOG%"
echo --- node>> "%LOG%"
call node -v >> "%LOG%" 2>&1
echo --- java>> "%LOG%"
java -version >> "%LOG%" 2>&1

if not defined ANDROID_HOME (
  echo STEP FAILED: Android SDK not found>> "%LOG%"
  echo Android SDK nahi mila. Android Studio ek baar khol kar SDK install hone do, phir dobara chalao.
  goto failed
)

echo [1/3] Installing app tools (npm ci) ...
echo === STEP 1: npm ci>> "%LOG%"
call npm ci >> "%LOG%" 2>&1
if errorlevel 1 (
  echo STEP FAILED: npm ci>> "%LOG%"
  goto failed
)

echo [2/3] Preparing Android project (cap sync) ...
echo === STEP 2: cap sync>> "%LOG%"
call npx cap sync android >> "%LOG%" 2>&1
if errorlevel 1 (
  echo STEP FAILED: cap sync>> "%LOG%"
  goto failed
)

echo [3/3] Building the APK (first time is slow) ...
echo === STEP 3: gradlew assembleDebug>> "%LOG%"
cd /d "%~dp0android"
call gradlew.bat assembleDebug --console=plain >> "%LOG%" 2>&1
if errorlevel 1 (
  echo STEP FAILED: gradle assembleDebug>> "%LOG%"
  goto failed
)
cd /d "%~dp0"

copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "AgentForge-test.apk" >> "%LOG%" 2>&1
if errorlevel 1 (
  echo STEP FAILED: copy apk>> "%LOG%"
  goto failed
)

echo BUILD OK>> "%LOG%"
echo.
echo Ho gaya. APK yahan hai: %~dp0AgentForge-test.apk
echo.
pause
exit /b 0

:failed
echo.
echo Build poora nahi hua. Details: %LOG%
echo.
pause
exit /b 1
