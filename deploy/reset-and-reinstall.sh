#!/usr/bin/env bash
# ============================================================
# RESET TOTAL + reinstalação simples
#
# Arquitetura final:
#   Internet -> Nginx (80/443, SSL) -> Node/Miniflare (127.0.0.1:3000)
#   - Nginx faz proxy_pass e SSL (certbot)
#   - PM2 mantém o Worker (dist/server) rodando via Miniflare
#   - Miniflare serve também os assets de dist/client
#
# Uso:
#   sudo bash deploy/reset-and-reinstall.sh
# ============================================================
set -euo pipefail

DOMAIN="${DOMAIN:-pandexstore.com.br}"
APP_NAME="${APP_NAME:-trainer-shop-direct}"
APP_DIR="/var/www/${APP_NAME}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"
PORT="${PORT:-3000}"

echo "==> [1/8] Parando tudo nas portas 80/443/${PORT}"
systemctl stop nginx 2>/dev/null || true
systemctl stop apache2 2>/dev/null || true
systemctl disable apache2 2>/dev/null || true
apt purge -y apache2 apache2-bin apache2-data apache2-utils 2>/dev/null || true

if command -v pm2 >/dev/null 2>&1; then
  pm2 delete all 2>/dev/null || true
  pm2 kill 2>/dev/null || true
fi
pkill -9 -f "node" 2>/dev/null || true
pkill -9 -f "workerd" 2>/dev/null || true

echo "==> [2/8] Removendo Nginx + configs antigas"
apt purge -y nginx nginx-common nginx-full nginx-core 2>/dev/null || true
apt autoremove -y
rm -rf /etc/nginx /var/log/nginx /var/lib/nginx

echo "==> [3/8] Removendo certificados Let's Encrypt antigos"
if command -v certbot >/dev/null 2>&1; then
  for cert in $(certbot certificates 2>/dev/null | awk '/Certificate Name:/ {print $3}'); do
    certbot delete --cert-name "$cert" --non-interactive || true
  done
fi
rm -rf /etc/letsencrypt /var/lib/letsencrypt /var/log/letsencrypt

echo "==> [4/8] Instalando Nginx, Certbot, Node 20, Bun, PM2"
apt update
apt install -y nginx certbot python3-certbot-nginx curl git ca-certificates

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash
  ln -sf /root/.bun/bin/bun /usr/local/bin/bun
fi
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

echo "==> [5/8] Atualizando código e fazendo build"
if [ ! -d "${APP_DIR}/.git" ]; then
  echo "ERRO: ${APP_DIR} não é um repo git. Clone primeiro."
  exit 1
fi
cd "${APP_DIR}"
git fetch --all
git reset --hard origin/HEAD
bun install
# instala runtimes do servidor fora do package.json (produção)
npm install --no-save --prefix "${APP_DIR}" miniflare@^4 wrangler@^4
bun run build

if [ ! -f "${APP_DIR}/dist/server/index.js" ]; then
  echo "ERRO: build não gerou dist/server/index.js"
  exit 1
fi

echo "==> [6/8] Iniciando Worker via PM2 em 127.0.0.1:${PORT}"
pm2 delete "${APP_NAME}" >/dev/null 2>&1 || true
PORT=${PORT} HOST=127.0.0.1 pm2 start "${APP_DIR}/deploy/server.mjs" \
  --name "${APP_NAME}" \
  --interpreter node \
  --update-env
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null || true

# espera subir
echo "   aguardando porta ${PORT}…"
for i in $(seq 1 30); do
  if ss -tln | grep -q "127.0.0.1:${PORT} "; then break; fi
  sleep 1
done
if ! ss -tln | grep -q "127.0.0.1:${PORT} "; then
  echo "AVISO: app não subiu em ${PORT}. Veja logs: pm2 logs ${APP_NAME}"
fi

echo "==> [7/8] Configurando Nginx (proxy reverso)"
rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default
cat > /etc/nginx/sites-available/${APP_NAME} <<NGINX
# Redireciona www -> domínio raiz (HTTP e HTTPS)
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
nginx -t
systemctl enable nginx
systemctl restart nginx

if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH 2>/dev/null || true
  ufw allow 'Nginx Full' 2>/dev/null || true
fi

echo "==> [8/8] Emitindo SSL para ${DOMAIN}"
certbot --nginx \
  -d "${DOMAIN}" \
  --non-interactive --agree-tos -m "${EMAIL}" --redirect \
  || echo "AVISO: certbot falhou. Confirme DNS e rode:
  certbot --nginx -d ${DOMAIN} --agree-tos -m ${EMAIL} --redirect"

echo ""
echo "==================================================="
echo " ✅ Pronto: https://${DOMAIN}"
echo " Logs app:    pm2 logs ${APP_NAME}"
echo " Logs nginx:  tail -f /var/log/nginx/error.log"
echo " Atualizar:   sudo bash ${APP_DIR}/deploy/update.sh"
echo "==================================================="
