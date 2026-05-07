#!/usr/bin/env bash
# Atualiza app: pull + build + reinicia o Worker via PM2
set -euo pipefail
APP_NAME="${APP_NAME:-trainer-shop-direct}"
APP_DIR="/var/www/${APP_NAME}"
PORT="${PORT:-3000}"

cd "${APP_DIR}"
git pull --ff-only
bun install
npm install --no-save --prefix "${APP_DIR}" miniflare@^4 wrangler@^4
bun run build

if [ ! -f "${APP_DIR}/dist/server/index.js" ]; then
  echo "ERRO: build não gerou dist/server/index.js"
  exit 1
fi

pm2 delete "${APP_NAME}" >/dev/null 2>&1 || true
PORT=${PORT} HOST=127.0.0.1 pm2 start "${APP_DIR}/deploy/server.mjs" \
  --name "${APP_NAME}" --interpreter node --update-env
pm2 save

nginx -t && systemctl reload nginx
echo "✅ Atualizado."
