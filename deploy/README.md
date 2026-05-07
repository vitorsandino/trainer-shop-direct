# Deploy em Debian 12 — trainer-shop-direct

Repo: https://github.com/vitorsandino/trainer-shop-direct

## Pré-requisitos
- VPS Debian 12 com acesso root/sudo
- Domínio com DNS A apontando para o IP do servidor (pra HTTPS funcionar)

## Instalação (one-shot)

Como o repo é público, dá pra baixar o script direto:

```bash
ssh root@SEU_IP
curl -fsSL https://raw.githubusercontent.com/vitorsandino/trainer-shop-direct/main/deploy/install-debian12.sh -o install.sh
chmod +x install.sh

sudo DOMAIN="meusite.com.br" bash install.sh
```

Ou, se preferir clonar via `gh` (precisa do GitHub CLI já autenticado):

```bash
sudo apt install -y gh
gh auth login
gh repo clone vitorsandino/trainer-shop-direct /tmp/trainer-shop-direct
sudo DOMAIN="meusite.com.br" bash /tmp/trainer-shop-direct/deploy/install-debian12.sh
```

Variáveis opcionais:
- `REPO_URL` (default `https://github.com/vitorsandino/trainer-shop-direct.git`)
- `APP_NAME` (default `trainer-shop-direct`)
- `PORT` (default `3000`)

## O que o script faz
1. Atualiza Debian + instala curl, git, nginx, ufw, certbot
2. Instala Node 20 LTS + Bun + PM2
3. Clona/atualiza o repo em `/var/www/trainer-shop-direct`
4. `bun install` + `bun run build`
5. Sobe a app com PM2 (auto-restart no boot)
6. Configura Nginx como reverse proxy na porta 80
7. Abre firewall (SSH + HTTP/HTTPS)
8. Emite certificado SSL Let's Encrypt e força HTTPS

## Atualizar depois de novos commits

```bash
sudo bash /var/www/trainer-shop-direct/deploy/update.sh
```

## Comandos úteis

```bash
pm2 status
pm2 logs trainer-shop-direct
pm2 restart trainer-shop-direct
nginx -t && systemctl reload nginx
certbot renew --dry-run
```

## Importante: limitação atual

A app guarda **tudo em localStorage do navegador** (usuários, pedidos, carrinho, financeiro).
Cada cliente vê apenas os próprios dados, e o admin só vê pedidos feitos no **mesmo navegador** dele.

Pra ter pedidos compartilhados entre clientes e admin de verdade, é preciso migrar pra um banco (recomendo ativar o Lovable Cloud).
