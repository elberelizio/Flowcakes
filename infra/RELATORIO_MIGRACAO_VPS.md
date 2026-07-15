# Relatório — Migração do backend + base de dados para a VPS Hostinger

Este relatório descreve, passo a passo e por ordem cronológica, tudo o que foi feito
para tirar o backend e a base de dados do Railway/Supabase e colocá-los a correr
numa VPS própria, mantendo o frontend no Vercel.

## 0. Situação de partida

| Componente | Onde estava | Onde ficou |
|---|---|---|
| Frontend (Angular — pasta `bolo-gest/`) | Vercel (`flowcakes.vercel.app`) | Mantido no Vercel |
| Backend (Spring Boot — pasta `backend/`) | Railway | **Movido para a VPS** |
| Base de dados (Postgres) | Supabase | **Movida para a VPS** (Postgres em Docker) |

**Objectivo:** reduzir a dependência de serviços pagos/terceiros (Railway, Supabase),
ganhar controlo total sobre o backend e a base de dados, sem perder a
apresentação profissional do frontend (manter `flowcakes.vercel.app`) nem pagar
por um domínio novo.

VPS usada: Hostinger, Ubuntu 24.04 LTS, IP `76.13.1.215`.

---

## Fase 1 — Preparar a infraestrutura como código (no computador do utilizador)

**Objectivo:** ter ficheiros prontos e reutilizáveis para instalar o backend e a
base de dados na VPS via Docker, em vez de instalar tudo manualmente.

Pasta nova criada na raiz do projecto: **`infra/`**

| Ficheiro | Para que serve |
|---|---|
| `backend/Dockerfile` | Receita para construir a imagem Docker do backend Spring Boot (build em duas fases: compila com Maven, depois corre só com o `.jar` numa imagem Java leve) |
| `infra/docker-compose.yml` | Define os dois containers da VPS: `db` (Postgres 16) e `backend` (a imagem construída pelo Dockerfile) |
| `infra/db.env.example` | Modelo das variáveis da base de dados (nome, utilizador, senha) — copiado para `db.env` na VPS, nunca commitado |
| `infra/backend.env.example` | Modelo das variáveis do backend (ligação à BD, CORS, Twilio) — copiado para `backend.env` na VPS, nunca commitado |
| `infra/nginx/chefcontrol-api.conf` | Configuração do Nginx que recebe pedidos HTTPS e reencaminha para o backend |
| `infra/DEPLOY_VPS.md` | Guião (runbook) com todos os comandos, passo a passo |

Tudo isto foi criado localmente e depois enviado para o GitLab (`git push`), para a
VPS conseguir obtê-lo via `git clone`/`git pull`.

---

## Fase 2 — Preparar o servidor (VPS)

**Objectivo:** instalar as ferramentas necessárias para correr containers Docker e
servir tráfego HTTPS.

Ligação: `ssh root@76.13.1.215`

1. `apt update && apt upgrade -y` — actualizar o sistema.
2. Instalação do Docker a partir do **repositório oficial da Docker** (o pacote
   `docker-compose-plugin` não existe nos repositórios normais do Ubuntu — foi
   preciso adicionar `download.docker.com` como fonte extra):
   ```
   apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   systemctl enable --now docker
   ```
3. `nginx`, `certbot`, `git`, `python3-pip` — já vinham pré-instalados neste
   template da Hostinger (não foi preciso instalar).
4. Firewall (`ufw`): abertas as portas `22` (SSH), `80` (HTTP) e `443` (HTTPS).

---

## Fase 3 — Domínio grátis com HTTPS (DuckDNS)

**Objectivo:** o backend precisa de um endereço público com certificado SSL
válido. Um IP puro (`http://76.13.1.215`) não permite gerar certificado HTTPS e
parece pouco profissional. Como não há orçamento para comprar um domínio, usou-se
o **DuckDNS** (serviço gratuito de subdomínio dinâmico).

1. Criado o subdomínio `flowcakes-api.duckdns.org`, apontado para o IP da VPS.
2. Na VPS, criado um script (`~/duckdns/duck.sh`) e uma tarefa `cron` a correr a
   cada 5 minutos, que actualiza automaticamente o IP associado ao subdomínio —
   assim, mesmo que o IP da VPS mude no futuro, o subdomínio continua a apontar
   para o sítio certo sem intervenção manual.

---

## Fase 4 — Trazer o código para a VPS

**Objectivo:** ter uma cópia do repositório na VPS, na pasta `/opt/chefcontrol`.

1. `git clone https://gitlab.com/.../chef-control-....git /opt/chefcontrol`
   — o repositório é privado, por isso foi necessário criar um **Personal Access
   Token** no GitLab (só com scope `read_repository`) para autenticar, já que o
   GitLab não aceita mais a senha normal da conta para operações Git.
2. **Contratempo encontrado:** os ficheiros da Fase 1 (`infra/`, `Dockerfile`,
   etc.) só existiam na branch local `Elber` do computador do utilizador — ainda
   não tinham sido enviados (`git push`) para o GitLab. Foi preciso:
   - Enviar a branch `Elber` para `origin/Elber` no GitLab.
   - Na VPS, fazer `git checkout Elber`.
   - Como a VPS tinha clonado a branch **antes** desse envio, foi preciso um
     `git fetch origin && git merge origin/Elber` extra para trazer os
     commits novos.

---

## Fase 5 — Configurar as credenciais na VPS

**Objectivo:** dar ao backend e à base de dados as variáveis de que precisam,
sem guardar segredos no repositório Git.

Dentro de `/opt/chefcontrol/infra/`:

```
cp db.env.example db.env           # senha da base de dados Postgres
cp backend.env.example backend.env # liga o backend à base de dados + CORS
```

Estes dois ficheiros (`db.env`, `backend.env`) existem **só na VPS**, nunca no
Git — exactamente como o `.env` do backend no computador local.

---

## Fase 6 — Subir os containers (Postgres + backend)

**Objectivo:** ter o backend e a base de dados a correr dentro de Docker.

```
cd /opt/chefcontrol/infra
docker compose up -d --build
```

**Contratempo encontrado:** a porta `5432` (porta padrão do Postgres) já estava a
ser usada por um Postgres **nativo**, pré-instalado pela Hostinger neste template
de VPS. Solução: mudar a porta que o container Postgres expõe no anfitrião de
`5432` para `5433` (`infra/docker-compose.yml`) — isto não afecta nada, porque o
backend fala com a base de dados pelo nome interno do container (`db`), não por
esta porta externa.

Depois de corrigido, os dois containers arrancaram com sucesso:
- `infra-db-1` — Postgres 16, acessível só dentro da VPS em `127.0.0.1:5433`.
- `infra-backend-1` — Spring Boot, acessível só dentro da VPS em
  `127.0.0.1:8081`.

Confirmação: `curl http://127.0.0.1:8081/api/public/health` respondeu
correctamente — mas a base de dados estava **vazia** (Hibernate tinha criado
tabelas automaticamente, sem dados).

---

## Fase 7 — Migrar os dados reais do Supabase

**Objectivo:** copiar os dados reais (utilizadores, encomendas, licenças, etc.)
do Supabase para o novo Postgres da VPS, sem perder nada.

Ferramenta usada: `backend/scripts/migrate_supabase.py` (script Python já
existente no projecto, criado originalmente para migrar entre projectos
Supabase — reaproveitado aqui para migrar para a VPS).

1. **Contratempo:** este script e o ficheiro `backend/supabase.local.env`
   (credenciais do Supabase actual) nunca tinham sido commitados ao Git —
   ficaram sempre só no computador local. Foram copiados manualmente para a VPS
   via `scp`, directamente do PC do utilizador (evitando colar senhas no chat ou
   no histórico de comandos da VPS):
   ```powershell
   scp "...\backend\supabase.local.env" root@76.13.1.215:/opt/chefcontrol/backend/
   scp "...\backend\scripts\migrate_supabase.py" root@76.13.1.215:/opt/chefcontrol/backend/scripts/
   ```
2. Criado um ambiente Python isolado (`venv`) na VPS e instalado
   `psycopg2-binary`.
3. Criado `backend/supabase.vps.env` na VPS, com as credenciais de ligação ao
   novo Postgres (dentro do Docker, acessível via `127.0.0.1:5433`).
4. **Contratempo — bug no script:** ao correr `migrate_supabase.py schema`, a
   ligação via `psql` falhava a autenticar. Causa: o script construía o comando
   `psql` passando `host=...`, `port=...`, `dbname=...` como **argumentos
   separados**, em vez de uma única string de ligação — o `psql` interpretava mal
   os parâmetros (chegou a tentar autenticar com o utilizador `"port=5433"`).
   **Corrigido** no ficheiro `backend/scripts/migrate_supabase.py`
   (commit `abcf91d`), juntando tudo numa única string de ligação.
5. **Contratempo — SSL:** o Postgres da VPS (dentro do Docker) não tem SSL
   configurado, mas o script pedia `sslmode=require` por omissão. Corrigido
   adicionando `DB_SSLMODE=disable` no `supabase.vps.env` (seguro, porque esta
   base de dados só é acessível dentro da própria VPS, nunca pela internet).
6. **Contratempo — schema incompatível:** como o backend já tinha arrancado
   antes (Fase 6) e criado tabelas sozinho (Hibernate `ddl-auto: update`), essas
   tabelas tinham uma estrutura ligeiramente diferente da esperada pelos scripts
   SQL de migração — deu erro a inserir o utilizador administrador por omissão.
   Solução: apagar o schema todo (`DROP SCHEMA public CASCADE; CREATE SCHEMA
   public;`) e voltar a aplicar os scripts SQL do zero — seguro, porque a base
   ainda não tinha nenhum dado real.
7. **Contratempo — extensão em falta:** o Supabase já vem com a extensão
   `pgcrypto` activada por omissão; um Postgres normal não. Uma das migrações
   usa `gen_random_bytes(...)`, que depende dela. Corrigido com
   `CREATE EXTENSION IF NOT EXISTS pgcrypto;`.
8. Com estes três problemas resolvidos, o esquema (39 migrações, `01` a `39`)
   aplicou-se com sucesso:
   ```
   python scripts/migrate_supabase.py schema --target supabase.vps.env
   ```
9. Cópia dos dados reais:
   ```
   python scripts/migrate_supabase.py data --source supabase.local.env --target supabase.vps.env
   ```
   Resultado: **299 linhas copiadas**, em 13 tabelas com dados (utilizadores,
   licenças, encomendas, retiradas, logs de acesso, notificações do sistema,
   sugestões, eventos de segurança, definições da plataforma, investimentos e
   sugestões de tesouraria, actividade de utilizadores, mensagens de contacto).
10. Verificação final — contagem de linhas comparada entre Supabase (origem) e
    VPS (destino), tabela a tabela:
    ```
    python scripts/migrate_supabase.py verify --source supabase.local.env --target supabase.vps.env
    ```
    Resultado: **todas as contagens coincidiram**, sem excepção.
11. `docker compose start backend` — reiniciado o backend, para ele passar a
    usar a base de dados agora populada. `curl` ao `/api/public/health`
    confirmou que continuava a responder bem.

---

## Fase 8 — Nginx + certificado HTTPS

**Objectivo:** expor o backend publicamente em `https://flowcakes-api.duckdns.org`,
com tráfego encriptado, em vez de expor a porta `8081` directamente.

1. Copiado o ficheiro modelo `infra/nginx/chefcontrol-api.conf` para
   `/etc/nginx/sites-available/chefcontrol-api`, com o subdomínio real
   (`flowcakes-api.duckdns.org`) substituído no lugar do placeholder.
2. Activado com um link simbólico em `/etc/nginx/sites-enabled/`.
3. `nginx -t` — configuração válida.
4. `certbot --nginx -d flowcakes-api.duckdns.org` — o Certbot:
   - Gerou e instalou automaticamente um certificado SSL grátis (Let's Encrypt).
   - Configurou o Nginx para servir HTTPS nesse subdomínio.
   - Agendou a renovação automática do certificado (expira em 2026-10-13, mas
     renova-se sozinho antes disso).
5. Confirmado no browser: `https://flowcakes-api.duckdns.org/api/public/health`
   responde correctamente, com HTTPS válido.

---

## Fase 9 — Apontar o frontend (Vercel) para o novo backend

**Objectivo:** fazer o site em produção (`flowcakes.vercel.app`) deixar de falar
com o Railway e passar a falar com o backend da VPS.

1. Actualizada a variável de ambiente `CHEFCONTROL_API_BACKEND_ORIGIN` no painel
   do Vercel (ambiente "Production"), de
   `https://chef-control-api-production.up.railway.app` para
   `https://flowcakes-api.duckdns.org`.
2. Redeploy via `npx vercel --prod`.
3. **Contratempo:** mesmo depois do redeploy, os pedidos a `/api/*` continuavam a
   ser reencaminhados para o Railway (confirmado pelos cabeçalhos
   `X-Railway-Edge` na resposta). Causa: o ficheiro `bolo-gest/vercel.json` (que
   define o `rewrite` `/api/* → destino`) tinha sido gerado e commitado
   anteriormente com o valor do Railway "gravado" no próprio ficheiro. O
   encaminhamento (`rewrites`) do Vercel é lido a partir do `vercel.json`
   presente no código enviado — só a variável de ambiente definida no painel,
   sem o ficheiro correcto no código, não foi suficiente para mudar o
   comportamento em produção.
4. **Solução:** correr o gerador (`scripts/generate-deploy-config.mjs`)
   **localmente**, com a variável de ambiente correcta, antes do deploy — isto
   escreve o valor certo directamente nos ficheiros
   `bolo-gest/vercel.json` e `bolo-gest/src/app/core/config/api-url.deploy.ts`,
   que passam a ir corrigidos no próprio deploy.
5. Novo `npx vercel --prod` — confirmado com `curl`:
   `https://flowcakes.vercel.app/api/public/health` responde `200 OK`
   directamente do `chef-control-backend`, sem qualquer vestígio do Railway.
6. Ficheiros corrigidos (`vercel.json`, `api-url.deploy.ts`) commitados e
   enviados para o GitLab, para não se perder este ajuste em deploys futuros.

---

## Resultado final

| Item | Estado |
|---|---|
| Frontend | `https://flowcakes.vercel.app` — sem alterações de hospedagem, continua no Vercel |
| Backend | Container Docker na VPS, atrás de Nginx + HTTPS, em `https://flowcakes-api.duckdns.org` |
| Base de dados | Postgres em Docker na VPS, com os 299 registos reais migrados e verificados |
| Ligação frontend → backend | Confirmada a funcionar em produção |
| Railway | Ainda ligado como rede de segurança — recomenda-se desligar só depois de confirmar estabilidade por uns dias |
| Supabase | Pode ser desligado quando o Railway também for, já não é usado |

## Ficheiros/pastas mais importantes criados ou tocados nesta migração

```
backend/
  Dockerfile                       ← novo — receita da imagem do backend
  scripts/migrate_supabase.py      ← corrigido (bug no comando psql)

infra/                             ← pasta nova, infraestrutura da VPS
  docker-compose.yml               ← define os containers db + backend
  db.env.example                   ← modelo de credenciais da BD
  backend.env.example              ← modelo de credenciais do backend
  nginx/chefcontrol-api.conf       ← configuração Nginx (reverse proxy)
  DEPLOY_VPS.md                    ← runbook completo, comando a comando

bolo-gest/
  vercel.json                      ← corrigido — aponta /api/* para a VPS
  src/app/core/config/api-url.deploy.ts   ← corrigido — mesmo motivo

Na VPS (fora do Git):
  /opt/chefcontrol/                ← clone do repositório
  /opt/chefcontrol/infra/db.env    ← segredo — só na VPS
  /opt/chefcontrol/infra/backend.env  ← segredo — só na VPS
  /opt/chefcontrol/backend/supabase.local.env  ← segredo — só na VPS (copiado via scp)
  ~/duckdns/duck.sh                ← actualizador automático do IP no DuckDNS
  /etc/nginx/sites-available/chefcontrol-api  ← configuração Nginx activa
  /etc/letsencrypt/live/flowcakes-api.duckdns.org/  ← certificado SSL
```
