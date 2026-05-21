# BOUH EAS BUILD FIX

سبب الفشل الظاهر في الصورة:
EAS وصل إلى خطوة Install dependencies ثم فشل عند:
yarn install --production false

هذا يعني أن المشكلة قبل تجميع APK، وغالباً من package.json / lock files / تعارض Yarn أو dependency version.

طريقة الإصلاح السريعة:

1) في GitHub افتح مشروع التطبيق.
2) احذف هذه الملفات إن وجدت:
   - yarn.lock
   - package-lock.json
   - node_modules
   - .yarn
3) ارفع/استبدل الملفات الخمسة الموجودة في هذه الحزمة في جذر المشروع:
   - package.json
   - eas.json
   - app.json
   - .npmrc
   - .yarnrc.yml
4) شغّل build جديد من EAS:
   profile: apk
   platform: android

مهم:
- لا تضع eas-cli داخل dependencies.
- لا تستخدم expo/latest و react/latest و react-native/latest داخل package.json.
- لا تضع ملفات ضخمة جداً داخل assets إذا فشل البناء بسبب الحجم؛ ضعها لاحقاً داخل:
  assets/offline/tiles/main_package.mbtiles
  assets/offline/kmz/
  assets/offline/data/
