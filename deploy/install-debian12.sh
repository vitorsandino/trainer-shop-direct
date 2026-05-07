#!/usr/bin/env bash
# ============================================================
# Instalação inicial em Debian 12 — SOMENTE estático via Nginx
# (sem Node em produção, sem PM2, sem Miniflare)
#
# Uso:
#   sudo REPO_URL="https://github.com/USER/REPO.git" \
#        DOMAIN="meusite.com.br" \
#        bash install-debian12.sh
# ============================================================
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/vitorsandino/trainer-shop-direct.git}"
DOMAIN="${DOMAIN:?defina DOMAIN=seudominio.com}"
APP_NAME="${APP_NAME:-trainer-shop-direct}"
APP_DIR="/var/www/${APP_NAME}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"

echo "==> Atualizando sistema"
apt update && apt upgrade -y
apt install -y curl git nginx certbot python3-certbot-nginx ca-certificates gnupg unzip ufw

echo "==> Instalando Node.js 20 (necessário só para o build)"
if ! command -v node >/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

echo "==> Instalando Bun"
if ! command -v bun >/dev/null; then
  curl -fsSL https://bun.sh/install | bash
  ln -sf /root/.bun/bin/bun /usr/local/bin/bun
fi

echo "==> Clonando / atualizando repo"
if [ -d "${APP_DIR}/.git" ]; then
  git -C "${APP_DIR}" fetch --all
  git -C "${APP_DIR}" reset --hard origin/HEAD
else
  rm -rf "${APP_DIR}"
  git clone "${REPO_URL}" "${APP_DIR}"
fi

cd "${APP_DIR}"
bun install
bun run build

if [ ! -d "${APP_DIR}/dist/client" ]; then
  echo "ERRO: build não gerou dist/client"
  exit 1
fi

chown -R www-data:www-data "${APP_DIR}/dist"
chmod -R a+rX "${APP_DIR}/dist"

echo "==> Configurando Nginx (estático puro)"
rm -f /etc/nginx/sites-enabled/default
cat > /etc/nginx/sites-available/${APP_NAME} <<NGINX
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${DOMAIN} www.${DOMAIN};

    root ${APP_DIR}/dist/client;
    index index.html;

    client_max_body_size 25m;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/${APP_NAME}
nginx -t && systemctl restart nginx

echo "==> Firewall"
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
yes | ufw enable || true

echo "==> Emitindo SSL"
certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" \
  --non-interactive --agree-tos -m "${EMAIL}" --redirect \
  || echo "AVISO: certbot falhou. Verifique DNS e rode manualmente."

echo ""
echo "==================================================="
echo " ✅ App: https://${DOMAIN}"
echo " Atualizar:  sudo bash ${APP_DIR}/deploy/update.sh"
echo "==================================================="
