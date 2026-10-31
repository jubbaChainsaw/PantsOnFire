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

sudo apt-get update
sudo apt-get install -y lftp openssh-client

if [ -n "${SFTP_KEY:-}" ]; then
  mkdir -p ~/.ssh
  umask 077
  printf '%s\n' "$SFTP_KEY" > ~/.ssh/ionos_deploy_key
  chmod 600 ~/.ssh/ionos_deploy_key
  printf '%s\n' '#!/bin/sh' \
    "exec ssh -a -x -o StrictHostKeyChecking=accept-new -p ${PORT} -i \"\$HOME/.ssh/ionos_deploy_key\" \"\$@\"" > "$WRAPPER"
elif [ -n "${SFTP_PASS:-}" ]; then
  sudo apt-get install -y sshpass
  export SSHPASS="$SFTP_PASS"
  printf '%s\n' '#!/bin/sh' \
    "exec sshpass -e ssh -a -x -o StrictHostKeyChecking=accept-new -p ${PORT} -o PreferredAuthentications=password -o PubkeyAuthentication=no \"\$@\"" > "$WRAPPER"
else
  echo "::error::Missing IONOS_SFTP_PASSWORD or IONOS_SFTP_KEY" >&2
  exit 1
fi

chmod +x "$WRAPPER"
LFTP_OPEN="open sftp://${SFTP_USER}@${SFTP_HOST}"

lftp -e "
  set cmd:fail-exit yes;
  set sftp:connect-program \"${WRAPPER}\";
  set net:max-retries 2;
  set net:timeout 120;
  ${LFTP_OPEN};
  lcd dist;
  cd \"${REMOTE}\";
  mirror --reverse --verbose --parallel=4;
  bye
"

echo "Upload complete (SFTP mirror to ${REMOTE})"
