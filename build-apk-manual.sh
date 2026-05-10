#!/bin/bash
# XOLERIC APK Builder - Manual (no Gradle needed)
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SDK_DIR="$PROJECT_DIR/android/sdk"
APK_DIR="$PROJECT_DIR/apk"
BUILD_DIR="/tmp/xol-apk-build"
KEYSTORE="$PROJECT_DIR/android/debug.keystore"
ANDROID_JAR="$SDK_DIR/platforms/android-34/android.jar"

echo "=== XOLERIC APK Builder (Manual) ==="
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/classes" "$BUILD_DIR/dex" "$BUILD_DIR/apk/unsigned" "$APK_DIR"

# 1. Copy assets
echo "[1/6] Copying web assets..."
ASSETS_DIR="$BUILD_DIR/apk/unsigned/assets"
mkdir -p "$ASSETS_DIR"
cp "$PROJECT_DIR/index.html" "$ASSETS_DIR/index.html"

# 2. Generate debug keystore
echo "[2/6] Setting up debug keystore..."
if [ ! -f "$KEYSTORE" ]; then
    keytool -genkey -v -keystore "$KEYSTORE" -alias androiddebugkey \
        -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass android -keypass android \
        -dname "CN=Android Debug,O=Android,C=US" 2>&1
fi

# 3. Compile Java sources
echo "[3/6] Compiling Java sources..."
JAVA_SRC="$PROJECT_DIR/android/app/src/main/java"
cat > /tmp/CompileAndroid.java << 'JAVAEOF'
import javax.tools.*;
import java.io.*;
import java.util.*;

public class CompileAndroid {
    public static void main(String[] args) throws Exception {
        String srcDir = args[0], outDir = args[1], cp = args[2];
        List<String> sources = new ArrayList<>();
        findSources(new File(srcDir), sources);
        System.out.println("Files: " + sources.size());
        for (String s : sources) System.out.println("  " + s);
        
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) { System.out.println("NO_COMPILER"); System.exit(1); }
        
        List<String> opts = new ArrayList<>();
        opts.add("-d"); opts.add(outDir);
        opts.add("-classpath"); opts.add(cp);
        opts.add("-source"); opts.add("8");
        opts.add("-target"); opts.add("8");
        opts.addAll(sources);
        
        int r = compiler.run(null, null, null, opts.toArray(new String[0]));
        System.out.println("Result: " + (r == 0 ? "OK" : "FAIL"));
        if (r != 0) System.exit(r);
    }
    static void findSources(File d, List<String> r) {
        for (File f : d.listFiles()) {
            if (f.isDirectory()) findSources(f, r);
            else if (f.getName().endsWith(".java")) r.add(f.getAbsolutePath());
        }
    }
}
JAVAEOF
/usr/bin/java /tmp/CompileAndroid.java "$JAVA_SRC" "$BUILD_DIR/classes" "$ANDROID_JAR" 2>&1

# 4. Convert to DEX
echo "[4/6] Converting to DEX..."
find "$BUILD_DIR/classes" -name "*.class" > /tmp/classes.txt
"$SDK_DIR/build-tools/34.0.0/d8" \
    --lib "$ANDROID_JAR" \
    --min-api 21 \
    --output "$BUILD_DIR/dex" \
    --release \
    $(cat /tmp/classes.txt) 2>&1

# 5. Build APK
echo "[5/6] Building APK..."
MANIFEST="$PROJECT_DIR/android/app/src/main/AndroidManifest.xml"
UNSIGNED="$BUILD_DIR/apk/unsigned"

# Create minimal resources
mkdir -p "$UNSIGNED/res/values"
cat > "$UNSIGNED/res/values/strings.xml" << 'XML'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">XOLERIC</string>
</resources>
XML

# Package using aapt2
cd "$BUILD_DIR/apk"
"$SDK_DIR/build-tools/34.0.0/aapt2" compile \
    --dir "$UNSIGNED/res" \
    -o compiled-res.zip 2>&1

"$SDK_DIR/build-tools/34.0.0/aapt2" link \
    --manifest "$MANIFEST" \
    -I "$ANDROID_JAR" \
    --min-sdk-version 21 \
    --target-sdk-version 34 \
    -o unsigned.apk \
    compiled-res.zip \
    --auto-add-overlay 2>&1

# Extract and add assets + dex
cd unsigned
unzip -qo ../unsigned.apk 2>/dev/null || true
cp "$BUILD_DIR/dex/classes.dex" . 2>/dev/null || true
cp -r "$ASSETS_DIR" . 2>/dev/null || true

# Repackage
zip -qr ../unsigned-repack.apk . 2>&1
cd ..

# Zipalign
"$SDK_DIR/build-tools/34.0.0/zipalign" -f -p 4 unsigned-repack.apk aligned.apk 2>&1

# Sign
echo "[6/6] Signing APK..."
"$SDK_DIR/build-tools/34.0.0/apksigner" sign \
    --ks "$KEYSTORE" \
    --ks-pass pass:android \
    --key-pass pass:android \
    --out "$APK_DIR/XOLERIC-v2.0.0.apk" \
    aligned.apk 2>&1

if [ -f "$APK_DIR/XOLERIC-v2.0.0.apk" ]; then
    echo ""
    echo "✅ APK created!"
    ls -lh "$APK_DIR/XOLERIC-v2.0.0.apk"
else
    echo ""
    echo "❌ Failed"
fi
