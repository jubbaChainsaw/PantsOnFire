#!/usr/bin/env bash
# Fail CI if release classpath resolves Play Billing Library below 8.0.0.
set -euo pipefail
MIN_MAJOR=8
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/android"
./gradlew :app:dependencies --configuration releaseRuntimeClasspath --no-daemon -q 2>/dev/null | tee /tmp/pof-release-runtime-deps.txt
mapfile -t versions < <(rg -o 'com\.android\.billingclient:billing:([0-9.]+)' /tmp/pof-release-runtime-deps.txt -r '$1' | sort -u)
if [ "${#versions[@]}" -eq 0 ]; then
  echo "::error::No com.android.billingclient:billing dependency found on releaseRuntimeClasspath"
  exit 1
fi
echo "Resolved billing library version(s): ${versions[*]}"
for ver in "${versions[@]}"; do
  major="${ver%%.*}"
  if [ "$major" -lt "$MIN_MAJOR" ]; then
    echo "::error::Play Billing Library $ver is below minimum $MIN_MAJOR.0.0 (Play Console requirement)"
    exit 1
  fi
done
echo "Play Billing Library meets minimum $MIN_MAJOR.0.0"
