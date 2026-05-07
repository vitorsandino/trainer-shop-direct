#!/usr/bin/env bash
# Atualiza a aplicação a partir do GitHub
set -euo pipefail
APP_NAME="${APP_NAME:-app}"
APP_DIR="/var/www/${APP_NAME}"

cd "${APP_DIR}"
git pull --ff-only
bun install
bun run build
pm2 restart "${APP_NAME}"
echo "Atualizado com sucesso."
