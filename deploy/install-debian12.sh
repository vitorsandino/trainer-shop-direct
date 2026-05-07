#!/usr/bin/env bash
# ============================================================
# Instalação automática em Debian 12 (root ou sudo)
# Uso:
#   sudo REPO_URL="https://github.com/SEU_USUARIO/SEU_REPO.git" \
#        DOMAIN="meusite.com.br" \
#        APP_NAME="trainer-shop" \
#        bash install-debian12.sh
# ============================================================
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/vitorsandino/trainer-shop-direct.git}"
DOMAIN="${DOMAIN:?defina DOMAIN=seudominio.com (ex: DOMAIN=meusite.com.br)}"
APP_NAME="${APP_NAME:-trainer-shop-direct}"
APP_DIR="/var/www/${APP_NAME}"
PORT="${PORT:-3000}"
NODE_MAJOR="20"

echo "==> Atualizando sistema"
apt update && apt upgrade -y
apt install -y curl git nginx ufw ca-certificates gnupg unzip

echo "==> Instalando Node.js ${NODE_MAJOR} LTS"
if ! command -v node >/dev/null || [ "$(node -v | cut -dv -f2 | cut -d. -f1)" != "${NODE_MAJOR}" ]; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
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

echo "==> Instalando dependências"
bun install

echo "==> Build"
bun run build

echo "==> Build (Cloudflare Worker output em dist/)"
bun run build

if [ ! -d "${APP_DIR}/dist/client" ]; then
  echo "ERRO: build não gerou dist/client"
  ls -la "${APP_DIR}/dist" 2>/dev/null || true
  exit 1
fi

echo "==> Desativando processo PM2 antigo (se existir)"
pm2 delete "${APP_NAME}" >/dev/null 2>&1 || true

echo "==> Configurando Nginx"
cat > /etc/nginx/sites-available/${APP_NAME} <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};
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
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "==> Firewall"
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
yes | ufw enable || true

echo "==> HTTPS (Let's Encrypt)"
apt install -y certbot python3-certbot-nginx
certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "admin@${DOMAIN}" --redirect || \
  echo "AVISO: certbot falhou (DNS apontando pro servidor?). Rode manualmente depois."

echo ""
echo "==================================================="
echo " OK! App rodando em: http://${DOMAIN}"
echo " Nginx:        systemctl status nginx"
echo " Atualizar:    cd ${APP_DIR} && sudo bash deploy/update.sh"
echo "==================================================="
