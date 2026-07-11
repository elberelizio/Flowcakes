# Deploy backend + base de dados na VPS Hostinger (Ubuntu 24.04)

IP da VPS: `76.13.1.215` (ajustar se mudar).

## 0. Pré-requisito: subdomínio grátis (DuckDNS)

1. Criar conta em https://www.duckdns.org (login com Google/GitHub).
2. Criar um subdomínio, ex.: `flowcakes-api` → aponta para `76.13.1.215`.
3. Anotar o **token** DuckDNS (aparece no topo da página).
4. Ficará com algo como `flowcakes-api.duckdns.org`.

Na VPS, manter o IP sempre actualizado no DuckDNS (cron):

```bash
mkdir -p ~/duckdns
cat > ~/duckdns/duck.sh <<'EOF'
echo url="https://www.duckdns.org/update?domains=flowcakes-api&token=SEU_TOKEN_AQUI&ip=" | curl -k -o ~/duckdns/duck.log -K -
EOF
chmod 700 ~/duckdns/duck.sh
( crontab -l 2>/dev/null; echo "*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1" ) | crontab -
~/duckdns/duck.sh
```

## 1. Preparar a VPS

```bash
ssh root@76.13.1.215

apt update && apt upgrade -y
apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx git python3-pip ufw

systemctl enable --now docker

# firewall
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

## 2. Levar o código para a VPS

```bash
git clone https://gitlab.com/guilhermemabilanee/chef-control-sistema-de-gestao-de-doces-e-salgados.git /opt/chefcontrol
cd /opt/chefcontrol/infra
cp db.env.example db.env
cp backend.env.example backend.env
nano db.env       # preencher senha forte do Postgres
nano backend.env  # DB_PASSWORD = mesma senha do db.env; colar credenciais Twilio do Railway
```

## 3. Subir os containers (Postgres + backend)

```bash
cd /opt/chefcontrol/infra
docker compose up -d --build
docker compose logs -f backend   # confirmar arranque sem erros, Ctrl+C para sair
```

A app cria as tabelas automaticamente (`ddl-auto: update`), mas para trazer os **dados reais** do Supabase, seguir o passo 4.

## 4. Migrar dados do Supabase para a VPS

Correr **na própria VPS** (evita expor a porta 5432 do Postgres à internet):

```bash
cd /opt/chefcontrol/backend
pip3 install psycopg2-binary

cat > supabase.vps.env <<'EOF'
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8081
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chefcontrol2025
DB_USER=chefcontrol
DB_PASSWORD=MESMA_SENHA_DO_db.env
DATABASE_JDBC_URL=jdbc:postgresql://localhost:5432/chefcontrol2025
EOF

# supabase.local.env já existe no repo com as credenciais do Supabase actual
python3 scripts/migrate_supabase.py schema --target supabase.vps.env
python3 scripts/migrate_supabase.py data --source supabase.local.env --target supabase.vps.env
python3 scripts/migrate_supabase.py verify --source supabase.local.env --target supabase.vps.env
```

Se `verify` bater certo, reiniciar o backend para garantir que está a ler os dados novos:

```bash
cd /opt/chefcontrol/infra
docker compose restart backend
curl http://127.0.0.1:8081/api/public/health
```

## 5. Nginx + HTTPS (Let's Encrypt)

```bash
cp /opt/chefcontrol/infra/nginx/chefcontrol-api.conf /etc/nginx/sites-available/chefcontrol-api
sed -i 's/api.SEUSUBDOMINIO.duckdns.org/flowcakes-api.duckdns.org/' /etc/nginx/sites-available/chefcontrol-api
ln -s /etc/nginx/sites-available/chefcontrol-api /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

certbot --nginx -d flowcakes-api.duckdns.org
```

Testar: `https://flowcakes-api.duckdns.org/api/public/health`

## 6. Apontar o frontend (Vercel) para o novo backend

No painel do Vercel do projecto `bolo-gest` (ou via `npx vercel env`):

- Actualizar `CHEFCONTROL_API_BACKEND_ORIGIN` = `https://flowcakes-api.duckdns.org`
- Fazer redeploy (Vercel → Deployments → Redeploy), para regenerar `vercel.json`/`api-url.deploy.ts`.

Confirmar em `https://flowcakes.vercel.app` que login/dados funcionam.

## 7. Desligar o Railway

Só depois de confirmar que tudo funciona na VPS por alguns dias — assim tens fallback caso algo corra mal.

## Manutenção

- **Deploy de uma nova versão do backend**: `cd /opt/chefcontrol && git pull && cd infra && docker compose up -d --build`
- **Backups do Postgres**: `docker exec -t infra-db-1 pg_dump -U chefcontrol chefcontrol2025 > backup-$(date +%F).sql` (agendar via cron, guardar fora da VPS)
- **Renovação SSL**: automática via certbot (cron/systemd timer já instalado por padrão)
