# بوح التضاريس | منظومة ابوعزيزه  
# BOUH Terrain | Abu Aziza System — BOUH GOLD PRO ULTRA V12.5

المطور: أحمد أبو عزيزه  
الأجهزة المستهدفة: iPhone 12 Pro Max, Samsung Galaxy A12  
Framework: React Native + Expo SDK 51 + Expo Prebuild  
خرائط: Mapbox/MapLibre style over `@rnmapbox/maps` native + MapLibre GL Web  
Offline packages: MBTiles / GeoPackage / SQLite spectral sidecar / Terrain-RGB tiles

## 1) التشغيل المحلي

```bash
npm install
npx expo prebuild --platform android --clean
npx expo run:android
```

## 2) بناء APK عبر EAS

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

## 3) بناء APK عبر GitHub Actions

ادفع المشروع إلى GitHub ثم افتح:

```text
Actions → BOUH Android APK → Run workflow
```

Artifact:

```text
BOUH-GOLD-PRO-ULTRA-V12-5-release-apk
```

## 4) نشر PWA على Netlify في 5 دقائق

```bash
npm ci
npx expo export --platform web
```

ثم ارفع مجلد:

```text
dist/
```

أو اربط GitHub بـ Netlify. `netlify.toml` جاهز.

## 5) استيراد بيانات MBTiles

من داخل التطبيق:

```text
DATA → IMPORT MBTILES / GPKG / SQLITE PACKAGE
```

الملفات تُحفظ في:

```text
FileSystem.documentDirectory/BOUH_DATA_PACKAGES/
```

## 6) جدول spectral_pixels المطلوب داخل Sidecar SQLite/MBTiles

لتفعيل التحليل الطيفي الرقمي الكامل عند النقر:

```sql
create table spectral_pixels(
  lat real,
  lon real,
  b2 real,
  b4 real,
  b6 real,
  b7 real,
  aster_silica real,
  lineament_density real,
  shear_intersection real
);
create index idx_spectral_lat_lon on spectral_pixels(lat, lon);
```

المعادلات داخل التطبيق:

```text
Clay Index = B6 / B7
Iron Oxide = B4 / B2
Silica = aster_silica
Target Confidence = weighted numeric model
```

## 7) Terrain-RGB

```bash
pip install rasterio mercantile pillow numpy
python scripts/srtm_to_terrain_rgb.py --dem SRTM.tif --out tiles/terrain_rgb --minzoom 5 --maxzoom 14
```

معادلة القراءة:

```text
elevation = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
```

## 8) ONNX model

```bash
pip install onnx
python scripts/generate_dummy_onnx.py
```

ينتج:

```text
assets/models/bouh_target_confidence_v12_5.onnx
```

## 9) أمان الإرسال

لا يوجد SMTP key داخل الكود.  
يتم حفظ REST endpoint وpassword في SecureStore فقط.  
أي هدف أعلى من threshold يمكن تشفيره AES-256-CBC/PBKDF2-SHA256 قبل إرساله.

## 10) البيانات المدمجة

داخل `src/data/`:

```text
targets.json  → Arbaat Rich Targets
boxes.json    → Rich Target Boxes
klemm.json    → Klemm/KCL coordinate layer
studies.json  → CSL study priors
analogs.json  → AbuAziza GPZ field analogs
```
