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

echo "==> Instalando PM2"
npm install -g pm2

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

# Detecta entry do TanStack Start
ENTRY=""
for cand in ".output/server/index.mjs" ".output/server/server.mjs" "dist/server/index.mjs"; do
  [ -f "${APP_DIR}/${cand}" ] && ENTRY="${APP_DIR}/${cand}" && break
done
if [ -z "${ENTRY}" ]; then
  echo "ERRO: build não gerou entry server. Conteúdo de .output/server:"
  ls -la "${APP_DIR}/.output/server" 2>/dev/null || true
  exit 1
fi
echo "==> Entry detectado: ${ENTRY}"

echo "==> Subindo com PM2"
pm2 delete "${APP_NAME}" >/dev/null 2>&1 || true
PORT="${PORT}" HOST="127.0.0.1" pm2 start "${ENTRY}" --name "${APP_NAME}" \
  --update-env --time
pm2 save
pm2 startup systemd -u root --hp /root | tail -n 1 | bash || true

echo "==> Configurando Nginx"
cat > /etc/nginx/sites-available/${APP_NAME} <<NGINX
server {
    listen 80;
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
echo " PM2 status:   pm2 status"
echo " Logs:         pm2 logs ${APP_NAME}"
echo " Atualizar:    cd ${APP_DIR} && git pull && bun install && bun run build && pm2 restart ${APP_NAME}"
echo "==================================================="
