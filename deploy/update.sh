#!/usr/bin/env bash
# Atualiza app: pull + build + reinicia o Worker via PM2 + reaplica nginx/SSL
set -euo pipefail
APP_NAME="${APP_NAME:-trainer-shop-direct}"
APP_DIR="/var/www/${APP_NAME}"
PORT="${PORT:-3000}"
DOMAIN="${DOMAIN:-pandexstore.com.br}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"

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

echo "==> Reaplicando config Nginx (HTTP + redirect www -> raiz)"
cat > /etc/nginx/sites-available/${APP_NAME} <<NGINX
# Redireciona www -> domínio raiz
server {
    listen 80;
    listen [::]:80;
    server_name www.${DOMAIN};
    return 301 https://${DOMAIN}\$request_uri;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${DOMAIN};

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/${APP_NAME}
nginx -t && systemctl reload nginx

echo "==> Reaplicando SSL (raiz + www se DNS apontar)"
if certbot --nginx \
     -d "${DOMAIN}" -d "www.${DOMAIN}" \
     --expand --redirect --non-interactive --agree-tos -m "${EMAIL}"; then
  echo "✅ SSL com www OK"
else
  echo "AVISO: www falhou (provavelmente DNS). Aplicando só o raiz..."
  certbot --nginx -d "${DOMAIN}" \
    --redirect --non-interactive --agree-tos -m "${EMAIL}" || true
fi

nginx -t && systemctl reload nginx
echo "✅ Atualizado: https://${DOMAIN}"
