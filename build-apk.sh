#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ANDROID_DIR="$PROJECT_DIR/android"
APK_DIR="$PROJECT_DIR/apk"
SDK_DIR="$ANDROID_DIR/sdk"

echo "=== XOLERIC APK Builder ==="
echo ""

mkdir -p "$ANDROID_DIR/app/src/main/assets"
mkdir -p "$APK_DIR"

echo "[1/5] Syncing web assets..."
cp "$PROJECT_DIR/index.html" "$ANDROID_DIR/app/src/main/assets/index.html"
echo "  -> index.html copied"

if [ ! -d "$SDK_DIR/platforms/android-34" ]; then
    echo "[2/5] Downloading Android SDK..."
    mkdir -p "$SDK_DIR"
    cd /tmp
    curl -#L "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip" -o cmdline-tools.zip 2>&1
    unzip -q cmdline-tools.zip -d "$SDK_DIR" 2>/dev/null
    mkdir -p "$SDK_DIR/cmdline-tools/latest"
    if [ -d "$SDK_DIR/cmdline-tools/bin" ]; then
        mv "$SDK_DIR/cmdline-tools/"* "$SDK_DIR/cmdline-tools/latest/" 2>/dev/null || true
    fi
    rm -f cmdline-tools.zip
    
    yes | "$SDK_DIR/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$SDK_DIR" --licenses >/dev/null 2>&1 || true
    "$SDK_DIR/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$SDK_DIR" "platforms;android-34" "build-tools;34.0.0" 2>&1 | tail -5
    cd "$PROJECT_DIR"
fi

export ANDROID_HOME="$SDK_DIR"
export ANDROID_SDK_ROOT="$SDK_DIR"
export PATH="$SDK_DIR/build-tools/34.0.0:$SDK_DIR/platform-tools:$PATH"

# Download gradle wrapper jar
if [ ! -f "$ANDROID_DIR/gradlew" ]; then
    echo "[3/5] Setting up Gradle..."
    mkdir -p "$ANDROID_DIR/gradle/wrapper"
    cat > "$ANDROID_DIR/gradlew" << 'SCRIPT'
#!/bin/sh
DIR="$(cd "$(dirname "$0")" && pwd)"
JAR="$DIR/gradle/wrapper/gradle-wrapper.jar"
if [ ! -f "$JAR" ]; then
    echo "Downloading gradle-wrapper.jar..."
    curl -sL "https://repo1.maven.org/maven2/org/gradle/gradle-wrapper/8.5/gradle-wrapper-8.5.jar" -o "$JAR"
fi
exec java -jar "$JAR" "$@"
SCRIPT
    chmod +x "$ANDROID_DIR/gradlew"
fi

echo "[4/5] Building APK..."
cd "$ANDROID_DIR"
./gradlew assembleRelease --no-daemon 2>&1 | tail -30

echo "[5/5] Copying APK..."
if [ -f "$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk" ]; then
    cp "$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk" "$APK_DIR/XOLERIC-v2.0.0.apk"
    echo "  -> ✅ APK created: $APK_DIR/XOLERIC-v2.0.0.apk"
    ls -lh "$APK_DIR/XOLERIC-v2.0.0.apk"
else
    echo "  -> Release APK not found, checking for debug..."
    if ls "$ANDROID_DIR/app/build/outputs/apk/debug/"*.apk 1>/dev/null 2>&1; then
        cp "$ANDROID_DIR/app/build/outputs/apk/debug/"*.apk "$APK_DIR/XOLERIC-v2.0.0.apk"
        echo "  -> ✅ APK created (debug): $APK_DIR/XOLERIC-v2.0.0.apk"
    else
        echo "  -> ❌ APK build failed"
    fi
fi

echo ""
echo "Done!"
