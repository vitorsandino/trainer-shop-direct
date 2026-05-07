#!/usr/bin/env bash
# ============================================================
# RESET COMPLETO + reinstalação limpa
# - remove Nginx (config + certs)
# - remove certificados Let's Encrypt
# - para Apache se estiver rodando
# - reinstala Nginx + Certbot
# - reaplica config do app + emite SSL novo
#
# Uso:
#   sudo bash deploy/reset-and-reinstall.sh
# Variáveis (já com defaults pro seu caso):
#   DOMAIN=pandexstore.com.br
#   APP_NAME=trainer-shop-direct
#   PORT=3000
# ============================================================
set -euo pipefail

DOMAIN="${DOMAIN:-pandexstore.com.br}"
APP_NAME="${APP_NAME:-trainer-shop-direct}"
PORT="${PORT:-3000}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"

echo "==> Parando serviços que podem estar na porta 80/443"
systemctl stop nginx 2>/dev/null || true
systemctl stop apache2 2>/dev/null || true
systemctl disable apache2 2>/dev/null || true

echo "==> Removendo Nginx (config + dados)"
apt purge -y nginx nginx-common nginx-full nginx-core 2>/dev/null || true
apt autoremove -y
rm -rf /etc/nginx
rm -rf /var/log/nginx
rm -rf /var/lib/nginx

echo "==> Removendo certificados Let's Encrypt antigos"
# remove todos os certificados existentes
if command -v certbot >/dev/null 2>&1; then
  for cert in $(certbot certificates 2>/dev/null | awk '/Certificate Name:/ {print $3}'); do
    echo "  - removendo cert: $cert"
    certbot delete --cert-name "$cert" --non-interactive || true
  done
fi
# limpa diretórios
rm -rf /etc/letsencrypt
rm -rf /var/lib/letsencrypt
rm -rf /var/log/letsencrypt

echo "==> Reinstalando Nginx + Certbot"
apt update
apt install -y nginx certbot python3-certbot-nginx

echo "==> Verificando se a app está rodando na porta ${PORT}"
if ! ss -tln | grep -q ":${PORT} "; then
  echo "AVISO: nada escutando em 127.0.0.1:${PORT}."
  echo "  Verifique:  pm2 status && pm2 logs ${APP_NAME}"
fi

echo "==> Escrevendo novo Nginx site para ${DOMAIN}"
rm -f /etc/nginx/sites-enabled/default
cat > /etc/nginx/sites-available/${APP_NAME} <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

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

echo "==> Testando e iniciando Nginx"
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "==> Liberando firewall"
ufw allow OpenSSH 2>/dev/null || true
ufw allow 'Nginx Full' 2>/dev/null || true
yes | ufw enable 2>/dev/null || true

echo "==> Emitindo novo certificado Let's Encrypt p/ ${DOMAIN} e www.${DOMAIN}"
certbot --nginx \
  -d "${DOMAIN}" -d "www.${DOMAIN}" \
  --non-interactive --agree-tos -m "${EMAIL}" --redirect \
  || echo "AVISO: certbot falhou. Verifique se o DNS A de ${DOMAIN} e www aponta pra este servidor."

echo ""
echo "==================================================="
echo " RESET concluído."
echo " Site:        https://${DOMAIN}"
echo " Nginx:       systemctl status nginx"
echo " App PM2:     pm2 status && pm2 logs ${APP_NAME}"
echo " Renew SSL:   certbot renew --dry-run"
echo "==================================================="
