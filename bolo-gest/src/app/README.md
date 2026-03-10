# Estrutura da aplicação Chef Control

O código está organizado em **duas áreas principais** mais autenticação e páginas públicas, para facilitar a manutenção e o trabalho em equipa.

## Pastas principais

| Pasta | Descrição |
|-------|-----------|
| **`admin/`** | **Painel do administrador** — todas as páginas e funcionalidades só acessíveis a utilizadores admin (dashboard, gestão de licenças, logs, encomendas, satisfação, notificações). |
| **`user/`** | **Painel do utilizador** — todas as páginas do utilizador com licença (dashboard, encomendas, clientes, calendário, lembretes, relatórios, retiradas, perfil, etc.). |
| **`auth/`** | Autenticação e fluxos públicos de conta: login, recuperar senha, ativar licença, finalizar conta. |
| **`public/`** | Conteúdo público sem login: loja (home, contacto, rastreio). |
| **`core/`** | Configuração da API, estilos globais, utilitários partilhados. |
| **`guards/`** | Guards de rotas (auth, licença, admin, etc.). |
| **`services/`** | Serviços partilhados (auth, orders, notificações, etc.). |
| **`models/`** | Modelos/interfaces partilhados. |
| **`components/`** | Componentes reutilizáveis (ícones, snackbar, etc.). |
| **`modals/`** | Modais reutilizáveis. |

## Onde trabalhar

- **Alterações ao painel admin** → ficheiros em `admin/`.
- **Alterações ao painel do utilizador** → ficheiros em `user/`.
- **Login, recuperar senha, ativar licença** → `auth/`.
- **Loja pública** → `public/loja/`.
- **API, estilos globais, guards, serviços partilhados** → `core/`, `guards/`, `services/`, `models/`.

## Rotas (URLs)

As URLs da aplicação **não mudaram**. Exemplos:

- `/admin-dashboard` → `admin/dashboard/`
- `/gestao-licencas` → `admin/gestao-licencas/`
- `/dashboard` → `user/dashboard/`
- `/encomendas` → `user/encomendas/`
- `/login` → `auth/login/`
- `/loja` → `public/loja/`

As rotas estão definidas em `app.routes.ts` com lazy loading a apontar para estas pastas.
