#!/usr/bin/env bash
# ============================================================
# RESET TOTAL + reinstalação simples (SOMENTE estático via Nginx)
#
# O que faz:
#   1. Para e remove Apache, Nginx, PM2 (qualquer processo na 80/443/3000)
#   2. Apaga TODA configuração antiga do Nginx e do Let's Encrypt
#   3. Reinstala Nginx + Certbot limpos
#   4. Faz git pull + build (gera dist/client estático)
#   5. Configura Nginx servindo APENAS arquivos estáticos (sem proxy)
#   6. Emite SSL novo via certbot --nginx
#
# Uso:
#   sudo bash deploy/reset-and-reinstall.sh
# ============================================================
set -euo pipefail

DOMAIN="${DOMAIN:-pandexstore.com.br}"
APP_NAME="${APP_NAME:-trainer-shop-direct}"
APP_DIR="/var/www/${APP_NAME}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"

echo "==> [1/7] Matando qualquer processo nas portas 80/443/3000"
systemctl stop nginx 2>/dev/null || true
systemctl stop apache2 2>/dev/null || true
systemctl disable apache2 2>/dev/null || true
apt purge -y apache2 apache2-bin apache2-data apache2-utils 2>/dev/null || true

# mata PM2 se existir (não usamos mais)
if command -v pm2 >/dev/null 2>&1; then
  pm2 delete all 2>/dev/null || true
  pm2 kill 2>/dev/null || true
fi

# qualquer processo node sobrando
pkill -9 -f "node" 2>/dev/null || true

echo "==> [2/7] Removendo Nginx e configurações antigas"
apt purge -y nginx nginx-common nginx-full nginx-core 2>/dev/null || true
apt autoremove -y
rm -rf /etc/nginx /var/log/nginx /var/lib/nginx

echo "==> [3/7] Removendo certificados Let's Encrypt antigos"
if command -v certbot >/dev/null 2>&1; then
  for cert in $(certbot certificates 2>/dev/null | awk '/Certificate Name:/ {print $3}'); do
    certbot delete --cert-name "$cert" --non-interactive || true
  done
fi
rm -rf /etc/letsencrypt /var/lib/letsencrypt /var/log/letsencrypt

echo "==> [4/7] Reinstalando Nginx + Certbot"
apt update
apt install -y nginx certbot python3-certbot-nginx curl git

echo "==> [5/7] Atualizando código e fazendo build"
if [ ! -d "${APP_DIR}/.git" ]; then
  echo "ERRO: ${APP_DIR} não existe ou não é um repo git."
  echo "  Clone primeiro:  git clone <repo> ${APP_DIR}"
  exit 1
fi

cd "${APP_DIR}"

# garante bun
if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash
  ln -sf /root/.bun/bin/bun /usr/local/bin/bun
fi

git pull --ff-only || git fetch --all && git reset --hard origin/HEAD
bun install
bun run build

if [ ! -d "${APP_DIR}/dist/client" ]; then
  echo "ERRO: build não gerou ${APP_DIR}/dist/client"
  ls -la "${APP_DIR}/dist" 2>/dev/null || true
  exit 1
fi

# permissão pro nginx ler
chown -R www-data:www-data "${APP_DIR}/dist"
chmod -R a+rX "${APP_DIR}/dist"
# nginx precisa atravessar /var/www/${APP_NAME}
chmod a+x /var/www "${APP_DIR}" || true

echo "==> [6/7] Escrevendo Nginx site (estático puro, SEM proxy)"
rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default

cat > /etc/nginx/sites-available/${APP_NAME} <<NGINX
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${DOMAIN} www.${DOMAIN};

    root ${APP_DIR}/dist/client;
    index index.html;

    client_max_body_size 25m;

    # cache longo para assets versionados
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/${APP_NAME}

nginx -t
systemctl enable nginx
systemctl restart nginx

# firewall: libera 80/443 (não derruba SSH)
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH 2>/dev/null || true
  ufw allow 'Nginx Full' 2>/dev/null || true
fi

echo "==> [7/7] Emitindo certificado SSL para ${DOMAIN} e www.${DOMAIN}"
certbot --nginx \
  -d "${DOMAIN}" -d "www.${DOMAIN}" \
  --non-interactive --agree-tos -m "${EMAIL}" --redirect \
  || echo "AVISO: certbot falhou. Confirme que o DNS A de ${DOMAIN} e www aponta para este servidor e rode novamente:
  certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --agree-tos -m ${EMAIL} --redirect"

echo ""
echo "==================================================="
echo " ✅ Pronto. Acesse: https://${DOMAIN}"
echo "    Logs nginx:  tail -f /var/log/nginx/error.log"
echo "    Atualizar:   sudo bash ${APP_DIR}/deploy/update.sh"
echo "==================================================="
