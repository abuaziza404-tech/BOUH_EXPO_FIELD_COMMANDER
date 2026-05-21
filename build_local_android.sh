#!/usr/bin/env bash
set -euo pipefail
npm ci
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
echo "APK: android/app/build/outputs/apk/release/app-release.apk"
