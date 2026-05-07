#!/usr/bin/env bash
# Atualiza a aplicação (build estático servido pelo Nginx)
set -euo pipefail
APP_NAME="${APP_NAME:-trainer-shop-direct}"
APP_DIR="/var/www/${APP_NAME}"

cd "${APP_DIR}"
git pull --ff-only
bun install
bun run build

if [ ! -d "${APP_DIR}/dist/client" ]; then
  echo "ERRO: build não gerou dist/client"
  exit 1
fi

chown -R www-data:www-data "${APP_DIR}/dist"
chmod -R a+rX "${APP_DIR}/dist"

# garante que não há PM2/node legados ocupando porta
if command -v pm2 >/dev/null 2>&1; then
  pm2 delete all 2>/dev/null || true
fi

nginx -t && systemctl reload nginx
echo "✅ Atualizado."
