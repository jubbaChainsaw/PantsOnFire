#!/usr/bin/env bash
# Upload Vite dist/ to IONOS via SFTP (OpenSSH sftp + sshpass or key). Used by deploy-ionos-web.yml.
set -euo pipefail

: "${SFTP_HOST:?SFTP_HOST required}"
: "${SFTP_USER:?SFTP_USER required}"
: "${REMOTE_DIR:?REMOTE_DIR required}"

REMOTE="${REMOTE_DIR:-/}"
if [ "${REMOTE}" != "/" ]; then
  REMOTE="${REMOTE%/}"
fi
PORT="${SFTP_PORT:-22}"
DIST_DIR="$(cd dist && pwd)"

if [ ! -d "$DIST_DIR" ] || [ ! -f "$DIST_DIR/index.html" ]; then
  echo "::error::dist/ is missing or incomplete (expected index.html)" >&2
  exit 1
fi

SFTP_BATCH="$(mktemp)"
cleanup() { rm -f "$SFTP_BATCH"; }
trap cleanup EXIT

{
  echo "cd ${REMOTE}"
  echo "lcd ${DIST_DIR}"
  echo "put -r ."
} > "$SFTP_BATCH"

SFTP_ARGS=(-oBatchMode=no -o StrictHostKeyChecking=accept-new -P "$PORT" -b "$SFTP_BATCH")

if [ -n "${SFTP_PASS:-}" ]; then
  if ! command -v sshpass >/dev/null 2>&1; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq sshpass openssh-client
  fi
  export SSHPASS="$SFTP_PASS"
  sshpass -e sftp "${SFTP_ARGS[@]}" "${SFTP_USER}@${SFTP_HOST}"
elif [ -n "${SFTP_KEY:-}" ]; then
  mkdir -p ~/.ssh
  umask 077
  KEY_FILE="${HOME}/.ssh/ionos_deploy_key"
  printf '%s\n' "$SFTP_KEY" > "$KEY_FILE"
  chmod 600 "$KEY_FILE"
  sftp -i "$KEY_FILE" "${SFTP_ARGS[@]}" "${SFTP_USER}@${SFTP_HOST}"
else
  echo "::error::Missing IONOS_SFTP_PASSWORD or IONOS_SFTP_KEY" >&2
  exit 1
fi

echo "Upload complete (SFTP put -r to ${REMOTE})"
