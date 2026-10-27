#!/usr/bin/env bash
set -euo pipefail
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/tmp/android-sdk}}"
export ANDROID_HOME="$SDK"
export PATH="$SDK/cmdline-tools/latest/bin:$SDK/platform-tools:$SDK/emulator:$PATH"

yes | sdkmanager --licenses >/dev/null 2>&1 || true
sdkmanager \
  "platform-tools" \
  "emulator" \
  "platforms;android-35" \
  "system-images;android-35;google_apis;x86_64"

AVD_NAME="${POF_AVD_NAME:-pof_api35_x86_64}"
if ! avdmanager list avd | grep -q "Name: ${AVD_NAME}"; then
  echo "no" | avdmanager create avd \
    -n "$AVD_NAME" \
    -k "system-images;android-35;google_apis;x86_64" \
    -d "pixel_6" \
    --force
fi

echo "AVD ready: $AVD_NAME"
