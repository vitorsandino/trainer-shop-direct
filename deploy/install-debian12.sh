#!/usr/bin/env bash
# Instalação inicial em Debian 12.
# Para um servidor já configurado, prefira usar reset-and-reinstall.sh.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/vitorsandino/trainer-shop-direct.git}"
DOMAIN="${DOMAIN:?defina DOMAIN=seudominio.com}"
APP_NAME="${APP_NAME:-trainer-shop-direct}"
APP_DIR="/var/www/${APP_NAME}"

apt update && apt install -y git curl
if [ ! -d "${APP_DIR}/.git" ]; then
  rm -rf "${APP_DIR}"
  git clone "${REPO_URL}" "${APP_DIR}"
fi

DOMAIN="${DOMAIN}" APP_NAME="${APP_NAME}" bash "${APP_DIR}/deploy/reset-and-reinstall.sh"
