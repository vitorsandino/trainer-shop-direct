#!/usr/bin/env bash
# Atualiza a aplicação a partir do GitHub
set -euo pipefail
APP_NAME="${APP_NAME:-trainer-shop-direct}"
APP_DIR="/var/www/${APP_NAME}"

cd "${APP_DIR}"
git pull --ff-only
bun install
bun run build
# garante miniflare presente/compatível com o build atual
[ -d "${APP_DIR}/node_modules/miniflare" ] || npm install --no-save --prefix "${APP_DIR}" miniflare@^4
pm2 restart "${APP_NAME}" --update-env
echo "Atualizado com sucesso."
