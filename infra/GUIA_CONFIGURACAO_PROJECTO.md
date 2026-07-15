# Guia de configuração — Chef Control / Flow Cakes

Este guia é para qualquer pessoa nova que precise de mexer neste projecto:
onde estão as coisas, o que é seguro editar, o que **nunca** deve ir para o
Git, e os erros mais comuns já conhecidos (para não perder tempo a
redescobri-los).

---

## 1. Arquitectura geral

```
┌─────────────────┐        HTTPS         ┌──────────────────────────┐
│   Vercel         │  /api/*  ────────►   │   VPS Hostinger            │
│  (flowcakes.     │  (rewrite via        │  76.13.1.215                │
│   vercel.app)    │   vercel.json)       │                              │
│                   │                       │  ┌────────────────────┐  │
│  Angular 19       │                       │  │ Nginx (porta 443)   │  │
│  (bolo-gest/)     │                       │  └─────────┬──────────┘  │
└──────────────────┘                       │            ▼               │
                                             │  ┌────────────────────┐  │
                                             │  │ Docker: backend      │  │
                                             │  │ Spring Boot (8081)   │  │
                                             │  └─────────┬──────────┘  │
                                             │            ▼               │
                                             │  ┌────────────────────┐  │
                                             │  │ Docker: db            │  │
                                             │  │ Postgres 16 (5433)    │  │
                                             │  └────────────────────┘  │
                                             └──────────────────────────┘
```

- **Frontend**: Angular 19 (standalone components), em `bolo-gest/`. Hospedado
  no Vercel, deploy manual via Vercel CLI (`npx vercel --prod`) — **não** está
  ligado ao GitLab para deploy automático.
- **Backend**: Spring Boot 3.2.5 / Java 17 (Maven), em `backend/`. Corre em
  Docker na VPS.
- **Base de dados**: Postgres 16, em Docker na VPS.
- **Domínio da API**: `flowcakes-api.duckdns.org` (subdomínio grátis DuckDNS,
  aponta para o IP da VPS), com HTTPS via Let's Encrypt/Certbot.
- **Repositório**: GitLab, privado —
  `gitlab.com/guilhermemabilanee/chef-control-sistema-de-gestao-de-doces-e-salgados`.

---

## 2. Estrutura de pastas (o que interessa)

```
chef-control-sistema-de-gestao-de-doces-e-salgados/
├── backend/                          Spring Boot (Java 17, Maven)
│   ├── src/main/resources/
│   │   └── application.yml           Config por variáveis de ambiente
│   ├── scripts/
│   │   ├── migrate_supabase.py       Migração/cópia de dados entre bases Postgres
│   │   ├── script-mother.sql         Corre as migrações 01–33 em ordem
│   │   └── 01…39_*.sql               Migrações SQL individuais, incrementais
│   ├── Dockerfile                    Build da imagem do backend
│   ├── .env                          ← LOCAL, nunca commitado
│   └── supabase.local.env            ← LOCAL, nunca commitado (segredo)
│
├── bolo-gest/                        Angular 19 (frontend)
│   ├── src/app/
│   │   ├── core/i18n/                Sistema de tradução PT/EN (ver secção 5)
│   │   ├── app.component.ts/.html    "Shell" — navbar/sidebar da app autenticada
│   │   └── services/language.service.ts   Serviço central do idioma
│   ├── scripts/generate-deploy-config.mjs  Gera vercel.json + api-url.deploy.ts
│   ├── vercel.json                   GERADO — não editar à mão (ver secção 4)
│   └── .env.vercel.local             ← LOCAL, nunca commitado
│
├── infra/                            Infraestrutura da VPS (Docker/Nginx)
│   ├── docker-compose.yml            Define containers "db" e "backend"
│   ├── db.env.example                Modelo — copiar para db.env na VPS
│   ├── backend.env.example           Modelo — copiar para backend.env na VPS
│   ├── nginx/chefcontrol-api.conf    Config Nginx (reverse proxy)
│   └── DEPLOY_VPS.md                 Runbook comando-a-comando
│
└── .claude/launch.json               Config do dev server local (Angular)
```

Na **VPS**, o repositório fica clonado em `/opt/chefcontrol/`, com a mesma
estrutura acima. Os ficheiros de segredos (`infra/db.env`, `infra/backend.env`,
`backend/supabase.local.env`) existem **só lá**, nunca no Git.

---

## 3. Segredos e variáveis de ambiente — onde vive cada um

| Segredo | Onde vive | Nunca commitar |
|---|---|---|
| Senha da BD local de desenvolvimento | `backend/.env` | ✅ |
| Credenciais do Supabase (antigo) | `backend/supabase.local.env` | ✅ |
| Credenciais da BD da VPS | `infra/db.env` (só na VPS) | ✅ |
| Config do backend na VPS (liga à BD, CORS, Twilio) | `infra/backend.env` (só na VPS) | ✅ |
| `CHEFCONTROL_API_BACKEND_ORIGIN` (URL do backend usada pelo frontend) | Painel Vercel → Project Settings → Environment Variables | Definida lá, mas **também precisa de estar correcta no `vercel.json` gerado** (ver secção 4) |
| Token GitLab (para `git clone`/`pull` na VPS) | Introduzido manualmente no `git` da VPS, guardado nas credenciais do sistema | ✅ — gerar com scope mínimo (`read_repository`) e revogar/rodar periodicamente |
| Token DuckDNS | Dentro de `~/duckdns/duck.sh` na VPS | ✅ |

**Regra de ouro**: se um ficheiro tem "senha", "password", "token" ou uma
connection string com credenciais lá dentro, confirmar com `git status` que
**não** está a ser adicionado antes de qualquer commit. Nenhum destes
ficheiros tem `.gitignore` a protegê-lo automaticamente (o projecto não tem
`.gitignore`) — a disciplina é manual, verificar sempre antes de `git add`.

---

## 4. Armadilha conhecida: `vercel.json` e a variável `CHEFCONTROL_API_BACKEND_ORIGIN`

Isto já causou confusão uma vez — registar aqui para não se repetir.

O ficheiro `bolo-gest/vercel.json` controla para onde o Vercel reencaminha os
pedidos `/api/*` (rewrite). Esse ficheiro é **gerado** pelo script
`bolo-gest/scripts/generate-deploy-config.mjs`, que lê a variável de ambiente
`CHEFCONTROL_API_BACKEND_ORIGIN`.

**O que NÃO funciona**: mudar só a variável de ambiente no painel do Vercel e
fazer `vercel --prod` a partir de um `vercel.json` desactualizado no
código — o Vercel usa o `vercel.json` que está no código enviado para
configurar o encaminhamento; não é suficiente a variável de ambiente sozinha
influenciar isto de forma fiável no deploy directo via CLI.

**O que funciona**: antes de fazer deploy, gerar o ficheiro **localmente** com
o valor certo, e deixá-lo entrar no deploy já correcto:

```bash
cd bolo-gest
CHEFCONTROL_API_BACKEND_ORIGIN="https://flowcakes-api.duckdns.org" node scripts/generate-deploy-config.mjs
git diff vercel.json src/app/core/config/api-url.deploy.ts   # conferir
npx vercel --prod
```

Depois do deploy, commitar os dois ficheiros gerados
(`vercel.json` e `src/app/core/config/api-url.deploy.ts`) para não se perder o
valor correcto.

**Como confirmar que está a funcionar**: pedir
`curl -I https://flowcakes.vercel.app/api/public/health` — se aparecer
`X-Railway-Edge` na resposta, ainda está a apontar para o Railway (errado); se
vier `{"service":"chef-control-backend", ...}` directo, está correcto.

---

## 5. Sistema de tradução PT/EN

Construído de raiz nesta fase do projecto (não existia antes). Sem
dependências externas — solução própria baseada em `signal` do Angular.

```
bolo-gest/src/app/
├── services/language.service.ts        Estado do idioma actual + tradução
├── core/i18n/
│   ├── translate.pipe.ts               Pipe `| translate`, usar nos templates
│   └── dictionaries/
│       ├── index.ts                    Junta todos os dicionários num só
│       ├── common.dict.ts              Palavras genéricas (Guardar, Cancelar…)
│       ├── shell.dict.ts               Menu/navbar/sidebar da app autenticada
│       ├── public-site.dict.ts         Navbar pública (site/landing)
│       ├── auth.dict.ts                Login
│       ├── register.dict.ts            Registo/criação de conta
│       ├── landing.dict.ts             Landing page (marketing)
│       └── dashboard-user.dict.ts      Dashboard do utilizador
```

### Como adicionar uma tradução nova

1. Escolher (ou criar) o dicionário do módulo certo em
   `core/i18n/dictionaries/`. Cada ficheiro exporta um objecto com uma única
   chave de topo (o namespace do módulo) e dois blocos, `pt` e `en`, com as
   mesmas chaves internas.
2. Se criares um ficheiro novo, regista-o em `dictionaries/index.ts`
   (importar + adicionar à lista `modules`).
3. No template Angular, usar `{{ 'namespace.chave' | translate }}`. Para
   atributos (`placeholder`, `aria-label`, etc.), usar
   `[placeholder]="'namespace.chave' | translate"`.
4. No `.ts` do componente, se precisares de texto traduzido em lógica
   (mensagens de erro, `alert()`, etc.), injecta o serviço:
   ```ts
   readonly lang = inject(LanguageService);
   // ...
   this.lang.t('namespace.chave')
   ```
5. O componente precisa de ter `TranslatePipe` nos `imports: [...]` do
   `@Component` se usares a pipe no template.

### Estado actual da cobertura

Já traduzido: menu/navbar da app, navbar pública, página de login, landing
page (secções principais), formulário de registo, barra de progresso do
registo.

**Ainda por traduzir**: a maior parte das páginas internas da app autenticada
(dashboard, encomendas, clientes, dívidas, relatórios, configurações de
admin, etc.) — cerca de 50 componentes ainda têm texto português fixo. O
padrão está montado; falta percorrer os componentes um a um e aplicar o mesmo
processo.

---

## 6. Deploy — como fazer, passo a passo

### Frontend (Vercel)

```bash
cd bolo-gest
# se mudaste o backend/origin, regenerar primeiro (ver secção 4)
npx vercel --prod
```

Não há deploy automático a partir do GitLab — é sempre manual, a partir do
computador com o Vercel CLI já autenticado (`npx vercel whoami` confirma).

### Backend + Base de dados (VPS)

```bash
ssh root@76.13.1.215
cd /opt/chefcontrol
git pull                       # trazer código novo
cd infra
docker compose up -d --build   # reconstrói e reinicia os containers alterados
docker compose logs -f backend # confirmar que arrancou bem
```

Se só mudaste o backend (não a base de dados), isto é suficiente — o
Postgres mantém os dados no volume Docker (`infra_pgdata`), não é apagado.

### Migrações de base de dados novas

Se adicionares um novo ficheiro `NN_nome.sql` em `backend/scripts/`:
1. Adiciona-o à lista `MOTHER_MIGRATIONS` ou `POST_MOTHER` em
   `backend/scripts/migrate_supabase.py` (conforme o caso).
2. Corre manualmente na VPS via `psql` ou reaplica com o script de migração.
   (O backend também tem `ddl-auto: update`, que cria/altera colunas
   automaticamente em muitos casos — mas para constraints, índices e dados
   iniciais, os scripts SQL são a fonte da verdade.)

---

## 7. Problemas já conhecidos e resolvidos (não repetir a investigação)

| Sintoma | Causa | Solução |
|---|---|---|
| `docker compose up` falha com "address already in use" na porta 5432 | Esta VPS Hostinger já vem com um Postgres nativo pré-instalado, a ocupar a porta 5432 | O container Postgres usa a porta **5433** no anfitrião (`infra/docker-compose.yml`) — não mexer nisto sem confirmar que a porta 5432 está livre |
| `migrate_supabase.py schema` falha a autenticar com um erro estranho tipo `user "port=5432"` | Bug antigo no script — parâmetros de ligação passados como argumentos `psql` separados em vez de uma única string | Já corrigido no ficheiro (commit `abcf91d`). Se voltar a aparecer, confirmar que não foi revertido |
| Erro `server does not support SSL, but SSL was required` ao migrar dados para a VPS | O Postgres em Docker não tem SSL configurado (não precisa, é só acessível dentro da VPS) | Usar `DB_SSLMODE=disable` no ficheiro `.env` de destino apontado para a VPS |
| Erro `function gen_random_bytes(integer) does not exist` a aplicar migrações | Falta a extensão `pgcrypto` (o Supabase já vem com ela; um Postgres normal não) | `CREATE EXTENSION IF NOT EXISTS pgcrypto;` antes de aplicar o esquema |
| Erro `null value in column "blocked"` (ou semelhante) ao aplicar migrações numa BD "nova" | O backend já tinha arrancado antes e criado tabelas sozinho via Hibernate (`ddl-auto: update`), com uma estrutura ligeiramente diferente da esperada pelos scripts SQL | Nunca deixar o backend arrancar contra uma base de dados vazia antes de aplicar os scripts SQL de propósito. Se acontecer: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` e reaplicar do zero |
| Frontend em produção continua a falar com o Railway mesmo depois de mudar a variável de ambiente no Vercel | Ver secção 4 — o `vercel.json` tem de ser gerado localmente com o valor certo antes do deploy | Gerar localmente, conferir com `git diff`, só depois fazer `vercel --prod` |
| `git clone`/`git pull` na VPS pede senha e recusa | O GitLab não aceita a senha normal da conta para Git — precisa de um Personal Access Token | Criar token em GitLab → User Settings → Access Tokens, scope `read_repository` (ou mais, se for para dar push) |

---

## 8. Checklist para quem for mexer pela primeira vez

- [ ] Consegues fazer `ssh root@76.13.1.215`? (pede a senha root a quem gere a VPS)
- [ ] Tens o Vercel CLI autenticado no teu computador? (`npx vercel whoami`
      dentro de `bolo-gest/`)
- [ ] Tens um Personal Access Token do GitLab válido, com scope adequado?
- [ ] Sabes onde estão `backend/.env`, `backend/supabase.local.env` — pede-os
      a quem já os tem, **não** os reconstruas do zero (para não gerar
      segredos divergentes)
- [ ] Antes de qualquer `git add`/`git commit`, corre `git status` e confirma
      que nenhum ficheiro com segredos está na lista
- [ ] Se fores mexer no `CHEFCONTROL_API_BACKEND_ORIGIN` ou no backend da
      VPS, lê a secção 4 primeiro
