#!/bin/bash
# XOLERIC APK Builder v2 - Professional
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SDK_DIR="$PROJECT_DIR/android/sdk"
APK_DIR="$PROJECT_DIR/apk"
BUILD_DIR="/tmp/xol-apk-build"
KEYSTORE="$PROJECT_DIR/android/release.keystore"
ANDROID_JAR="$SDK_DIR/platforms/android-34/android.jar"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/classes" "$BUILD_DIR/dex" "$BUILD_DIR/apk/unsigned"
mkdir -p "$BUILD_DIR/apk/unsigned/res/values"
mkdir -p "$BUILD_DIR/apk/unsigned/res/mipmap-hdpi"
mkdir -p "$BUILD_DIR/apk/unsigned/res/mipmap-xhdpi"
mkdir -p "$BUILD_DIR/apk/unsigned/res/mipmap-xxhdpi"
mkdir -p "$APK_DIR"

echo "=== XOLERIC APK Builder v2 ==="

# 1. Assets
echo "[1/6] Web assets..."
ASSETS_DIR="$BUILD_DIR/apk/unsigned/assets"
mkdir -p "$ASSETS_DIR"
cp "$PROJECT_DIR/index.html" "$ASSETS_DIR/index.html"
echo "  -> index.html ($(wc -c < "$ASSETS_DIR/index.html") bytes)"

# 2. Generate icon
echo "[2/6] Generating launcher icon..."
cat > /tmp/genicon.py << 'PYEOF'
import struct, zlib, os

def create_png(w, h, r, g, b, shape='rounded'):
    """Create a minimal PNG with a colored rounded rect."""
    def make_chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    
    # Build pixel data (BGRA)
    raw = b''
    for y in range(h):
        raw += b'\x00'  # filter byte
        for x in range(w):
            # Simple rounded rect shape
            cx, cy = w/2, h/2
            rx, ry = w/2-1, h/2-1
            dx, dy = abs(x-cx), abs(y-cy)
            in_rect = dx <= rx and dy <= ry
            # Corner rounding
            corner_r = min(w, h) // 5
            if dx > rx - corner_r and dy > ry - corner_r:
                cx2, cy2 = rx - corner_r, ry - corner_r
                in_rect = (dx - cx2)**2 + (dy - cy2)**2 <= corner_r**2
            
            if in_rect:
                raw += struct.pack('BBBB', b, g, r, 255)
            else:
                raw += struct.pack('BBBB', 0, 0, 0, 0)
    
    raw_len = len(raw)
    compressed = zlib.compress(raw)
    
    png = b'\x89PNG\r\n\x1a\n'
    png += make_chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    png += make_chunk(b'IDAT', compressed)
    png += make_chunk(b'IEND', b'')
    return png

sizes = {'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144}
for name, size in sizes.items():
    png_data = create_png(size, size, 99, 102, 241)
    path = f'/tmp/xol-apk-build/apk/unsigned/res/mipmap-{name}/ic_launcher.png'
    with open(path, 'wb') as f:
        f.write(png_data)
    print(f'  -> icon {name} ({size}x{size})')
PYEOF
python3 /tmp/genicon.py

# 3. Keystore
echo "[3/6] Keystore..."
if [ ! -f "$KEYSTORE" ]; then
    keytool -genkey -v -keystore "$KEYSTORE" -alias xol \
        -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass xol123 -keypass xol123 \
        -dname "CN=XOLERIC,OU=Android,O=XOLERIC,C=UZ" 2>&1
    echo "  -> Created: $KEYSTORE"
fi

# 4. Compile Java (using ECJ for maximum compatibility)
echo "[4/6] Compiling with ECJ..."
JAVA_SRC="$PROJECT_DIR/android/app/src/main/java"
find "$JAVA_SRC" -name "*.java" > /tmp/java_sources.txt
java -jar /tmp/ecj.jar \
    -d "$BUILD_DIR/classes" \
    -classpath "$ANDROID_JAR" \
    -source 1.8 -target 1.8 \
    @/tmp/java_sources.txt 2>&1 | tail -5
echo "  -> OK"

# 5. DEX
echo "[5/6] DEX..."
find "$BUILD_DIR/classes" -name "*.class" > /tmp/classes.txt
"$SDK_DIR/build-tools/34.0.0/d8" \
    --lib "$ANDROID_JAR" \
    --min-api 21 \
    --output "$BUILD_DIR/dex" \
    --release \
    $(cat /tmp/classes.txt) 2>&1
echo "  -> classes.dex created"

# 6. Build & Sign APK
echo "[6/6] Building & signing APK..."
MANIFEST="$PROJECT_DIR/android/app/src/main/AndroidManifest.xml"
U="$BUILD_DIR/apk/unsigned"

# strings.xml
cat > "$U/res/values/strings.xml" << 'XML'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">XOLERIC</string>
</resources>
XML

cd "$BUILD_DIR/apk"

# Compile resources
"$SDK_DIR/build-tools/34.0.0/aapt2" compile \
    --dir "$U/res" -o compiled-res.zip 2>&1

# Link
"$SDK_DIR/build-tools/34.0.0/aapt2" link \
    --manifest "$MANIFEST" \
    -I "$ANDROID_JAR" \
    --min-sdk-version 21 \
    --target-sdk-version 34 \
    --version-code 2 \
    --version-name "2.0.0" \
    -o unsigned.apk \
    compiled-res.zip \
    --auto-add-overlay 2>&1

# Unzip + add dex + assets
cd unsigned
unzip -qo ../unsigned.apk 2>/dev/null || true
cp "$BUILD_DIR/dex/classes.dex" . 2>/dev/null || true
cp -r "$ASSETS_DIR" . 2>/dev/null || true
zip -qr ../unsigned-repack.apk . 2>&1
cd ..

# Align
"$SDK_DIR/build-tools/34.0.0/zipalign" -f -p 4 unsigned-repack.apk aligned.apk 2>&1

# Sign
"$SDK_DIR/build-tools/34.0.0/apksigner" sign \
    --ks "$KEYSTORE" \
    --ks-pass pass:xol123 \
    --key-pass pass:xol123 \
    --out "$APK_DIR/XOLERIC-v2.0.0.apk" \
    aligned.apk 2>&1

# Verify
"$SDK_DIR/build-tools/34.0.0/apksigner" verify "$APK_DIR/XOLERIC-v2.0.0.apk" 2>&1 && echo "  -> Signed APK verified"

echo ""
echo "✅ APK: $APK_DIR/XOLERIC-v2.0.0.apk"
ls -lh "$APK_DIR/XOLERIC-v2.0.0.apk"
