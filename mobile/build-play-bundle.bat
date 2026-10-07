@echo off
rem ============================================================
rem  AgentForge Android app - build the PLAY STORE bundle (.aab)
rem  Double-click this file. It needs Node.js and Android Studio.
rem
rem  First run: asks you to choose a password and creates the
rem  upload key  android\upload-keystore.jks  (plus
rem  android\keystore.properties). KEEP A COPY of both files and
rem  the password somewhere safe - every later update of the app
rem  must be signed with the same key. They are never sent to git.
rem
rem  Log: build-log.txt        Result: AgentForge-play.aab
rem  Upload the .aab in Play Console - Test and release.
rem ============================================================
setlocal EnableExtensions
cd /d "%~dp0"
set "LOG=%~dp0build-log.txt"
echo AgentForge Play bundle build - %DATE% %TIME% > "%LOG%"

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

if not defined ANDROID_HOME (
  echo STEP FAILED: Android SDK not found>> "%LOG%"
  echo Android SDK nahi mila. Android Studio ek baar khol kar SDK install hone do, phir dobara chalao.
  goto failed
)

rem --- Upload key: created once, reused for every later build
if exist "android\keystore.properties" goto key_done
if exist "android\upload-keystore.jks" (
  echo STEP FAILED: upload-keystore.jks exists but keystore.properties is missing>> "%LOG%"
  echo android\upload-keystore.jks hai par android\keystore.properties nahi mili.
  echo keystore.properties wapas rakhiye ^(backup se^), phir dobara chalaiye.
  goto failed
)
echo.
echo Pehli baar: app ki upload key banegi.
echo Ek password chuniye: kam se kam 6 akshar, sirf A-Z a-z 0-9.
echo Ise likh kar rakh lijiye, aage har update mein yahi key lagegi.
echo.
set "KSPASS="
set /p "KSPASS=Password: "
if not defined KSPASS (
  echo STEP FAILED: no password entered>> "%LOG%"
  echo Password khali tha.
  goto failed
)
echo %KSPASS%| findstr /r "^[A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9]*$" >nul
if errorlevel 1 (
  echo STEP FAILED: password not accepted>> "%LOG%"
  echo Password mein sirf A-Z a-z 0-9 ho aur kam se kam 6 akshar. Dobara chalaiye.
  goto failed
)
echo === STEP 0: create upload key>> "%LOG%"
keytool -genkeypair -keystore "android\upload-keystore.jks" -alias upload -keyalg RSA -keysize 2048 -validity 10000 -storepass %KSPASS% -keypass %KSPASS% -dname "CN=AgentForge AI, O=AgentForge AI, C=IN" >> "%LOG%" 2>&1
if errorlevel 1 (
  echo STEP FAILED: keytool>> "%LOG%"
  goto failed
)
(
  echo storeFile=upload-keystore.jks
  echo storePassword=%KSPASS%
  echo keyAlias=upload
  echo keyPassword=%KSPASS%
)> "android\keystore.properties"
set "KSPASS="
echo Upload key ban gayi: android\upload-keystore.jks
echo.
:key_done

rem --- Version code: Play Store wants a higher number for every upload.
rem     Date + hour (yyMMddHH) always goes up; two builds in the same hour share a number.
set "VC="
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyMMddHH"') do set "VC=%%i"
if not defined VC (
  echo STEP FAILED: could not work out a version code>> "%LOG%"
  goto failed
)
echo versionCode=%VC%>> "%LOG%"

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

echo [3/3] Building the Play Store bundle (version %VC%) ...
echo === STEP 3: gradlew bundleRelease>> "%LOG%"
cd /d "%~dp0android"
call gradlew.bat bundleRelease -PafVersionCode=%VC% --console=plain >> "%LOG%" 2>&1
if errorlevel 1 (
  echo STEP FAILED: gradle bundleRelease>> "%LOG%"
  goto failed
)
cd /d "%~dp0"

copy /Y "android\app\build\outputs\bundle\release\app-release.aab" "AgentForge-play.aab" >> "%LOG%" 2>&1
if errorlevel 1 (
  echo STEP FAILED: copy aab>> "%LOG%"
  goto failed
)

echo BUNDLE OK versionCode=%VC%>> "%LOG%"
echo.
echo Ho gaya. Play Store bundle yahan hai: %~dp0AgentForge-play.aab
echo Version code: %VC%
echo.
echo Yaad rakhiye: android\upload-keystore.jks aur android\keystore.properties
echo ki ek copy kisi safe jagah rakh lijiye.
echo.
pause
exit /b 0

:failed
cd /d "%~dp0"
echo.
echo Bundle nahi bana. Details: %LOG%
echo.
pause
exit /b 1
