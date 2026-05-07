#!/usr/bin/env bash
# Atualiza a aplicação a partir do GitHub
set -euo pipefail
APP_NAME="${APP_NAME:-trainer-shop-direct}"
APP_DIR="/var/www/${APP_NAME}"

cd "${APP_DIR}"
git pull --ff-only
bun install
bun run build
pm2 delete "${APP_NAME}" >/dev/null 2>&1 || true
nginx -t
systemctl reload nginx
echo "Atualizado com sucesso."
