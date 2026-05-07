# Deploy em Debian 12

## Pré-requisitos
- VPS Debian 12 com acesso root/sudo
- Domínio com DNS A apontando para o IP do servidor (pra HTTPS funcionar)
- Repo público no GitHub (ou configure SSH key se for privado)

## Instalação (one-shot)

```bash
ssh root@SEU_IP
curl -fsSL https://raw.githubusercontent.com/SEU_USUARIO/SEU_REPO/main/deploy/install-debian12.sh -o install.sh
chmod +x install.sh

sudo REPO_URL="https://github.com/SEU_USUARIO/SEU_REPO.git" \
     DOMAIN="meusite.com.br" \
     APP_NAME="trainer-shop" \
     bash install.sh
```

O script faz:
1. Atualiza Debian + instala curl, git, nginx, ufw, certbot
2. Instala Node 20 LTS + Bun + PM2
3. Clona/atualiza o repo em `/var/www/<APP_NAME>`
4. `bun install` + `bun run build`
5. Sobe a app com PM2 (auto-restart no boot)
6. Configura Nginx como reverse proxy na porta 80
7. Abre firewall (SSH + HTTP/HTTPS)
8. Emite certificado SSL Let's Encrypt e força HTTPS

## Atualizar depois de novos commits

```bash
sudo APP_NAME="trainer-shop" bash /var/www/trainer-shop/deploy/update.sh
```

Ou manualmente:
```bash
cd /var/www/trainer-shop
git pull
bun install
bun run build
pm2 restart trainer-shop
```

## Comandos úteis

```bash
pm2 status                # status da app
pm2 logs trainer-shop     # ver logs
pm2 restart trainer-shop  # reiniciar
nginx -t && systemctl reload nginx
certbot renew --dry-run   # testar renovação SSL
```

## Repo privado?

Configure deploy key:
```bash
ssh-keygen -t ed25519 -C "deploy@servidor" -f /root/.ssh/id_ed25519 -N ""
cat /root/.ssh/id_ed25519.pub   # cole em GitHub > repo > Settings > Deploy keys
# E use REPO_URL="git@github.com:USUARIO/REPO.git"
```

## Importante: limitação atual

A app guarda **tudo em localStorage do navegador** (usuários, pedidos, carrinho, financeiro).
Cada cliente vê apenas os próprios dados, e o admin só vê pedidos feitos no **mesmo navegador** dele.

Pra ter pedidos compartilhados entre clientes e admin de verdade, é preciso migrar pra um banco de dados (recomendo ativar o Lovable Cloud ou subir um Postgres no próprio Debian).
