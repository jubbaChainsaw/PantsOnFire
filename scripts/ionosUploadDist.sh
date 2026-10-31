#!/usr/bin/env bash
# Upload Vite dist/ to IONOS via SFTP (lftp mirror). Used by deploy-ionos-web.yml.
set -euo pipefail

: "${SFTP_HOST:?SFTP_HOST required}"
: "${SFTP_USER:?SFTP_USER required}"
: "${REMOTE_DIR:?REMOTE_DIR required}"

REMOTE="${REMOTE_DIR:-/}"
REMOTE="${REMOTE%/}"
if [ -z "$REMOTE" ]; then REMOTE="/"; fi
PORT="${SFTP_PORT:-22}"

WRAPPER="${RUNNER_TEMP:-/tmp}/sftp-ssh-wrap.sh"
LFTP_USER=()

if [ -n "${SFTP_PASS:-}" ]; then
  LFTP_USER=(-u "${SFTP_USER},${SFTP_PASS}")
  if ! command -v sshpass >/dev/null 2>&1; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq sshpass
  fi
  export SSHPASS="$SFTP_PASS"
  {
    echo '#!/bin/sh'
    echo "exec sshpass -e ssh -a -x -o StrictHostKeyChecking=accept-new -p ${PORT} -o PreferredAuthentications=password -o PubkeyAuthentication=no \"\$@\""
  } > "$WRAPPER"
elif [ -n "${SFTP_KEY:-}" ]; then
  mkdir -p ~/.ssh
  umask 077
  printf '%s\n' "$SFTP_KEY" > ~/.ssh/ionos_deploy_key
  chmod 600 ~/.ssh/ionos_deploy_key
  LFTP_USER=(-u "${SFTP_USER}")
  {
    echo '#!/bin/sh'
    echo "exec ssh -a -x -o StrictHostKeyChecking=accept-new -p ${PORT} -i \"\$HOME/.ssh/ionos_deploy_key\"" '"$@"'
  } > "$WRAPPER"
else
  echo "::error::Missing IONOS_SFTP_PASSWORD or IONOS_SFTP_KEY" >&2
  exit 1
fi

chmod +x "$WRAPPER"
CONNECT="${WRAPPER}"

if ! command -v lftp >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq lftp openssh-client
fi

lftp "${LFTP_USER[@]}" -e "
  set cmd:fail-exit yes;
  set sftp:connect-program \"${CONNECT}\";
  set net:max-retries 3;
  set net:timeout 120;
  open sftp://${SFTP_HOST}:${PORT};
  lcd dist;
  cd \"${REMOTE}\";
  mirror --reverse --verbose --parallel=4;
  bye
"

echo "Upload complete (SFTP mirror to ${REMOTE})"
