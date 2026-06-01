# Estrutura da aplicação Chef Control

## Pastas em `src/app/`

| Pasta | Descrição |
|-------|-----------|
| **`public/web-page/`** | Site público (marketing): layout `web-page-layout` e filhos (ex.: landing em `/`). |
| **`login/`** | Login, estilos partilhados do cartão (`auth-login-shell.scss`) e **recuperar senha** (`login/recuperar-senha/`). |
| **`register/`** | Registo de nova conta (rota **`/register`**; `/registro` redireciona). |
| **`license-payment/`** | Página de pagamento da licença no site público (`/license-payment`, filha do layout web; `/pagamento-licenca` redirecciona). |
| **`public/`** | Loja pública (`web-store/`) e site institucional (`web-page/`). |
| **`dashboard-admin/`** | Painel admin, incluindo **ativar licença** (`ativar-licenca/`). |
| **`dashboard-user/`** | Área do utilizador com licença. |
| **`core/`**, **`services/`**, **`models/`**, **`ui/`** | Infraestrutura partilhada: **`ui/icon/`** (SVG inline), **`ui/snackbar/`** (mensagens). Validação do contacto no login/registo fica nos próprios componentes; normalização para a API em `auth.service` (`normalizeMzPhoneDigits`). |

URLs principais em `app.routes.ts` (ex.: `/ativar-licenca`, `/recuperar-senha`, **`/register`**).

## Imports (`@app/*`)

Em `tsconfig.json` está definido o alias **`@app/*`** → `src/app/*`. Use por exemplo `import { AuthService } from '@app/services/auth.service'` em qualquer ficheiro sob `src/app/`.

## Serviços em `services/` (ficheiros planos)

| Ficheiro | Função resumida |
|----------|------------------|
| `auth.service.ts` | Sessão, login, registo, perfil, licença. |
| `orders.service.ts` | Encomendas e dados ligados. |
| `admin-stats.service.ts` | Estatísticas do painel admin. |
| `notification.service.ts` | Snackbar global. |
| `theme.service.ts` / `language.service.ts` | Tema e idioma. |
| `store-settings.service.ts` / `store-context.service.ts` | Loja pública / contexto da loja. |
| `reminder.service.ts` | Lembretes. |
| `withdrawal.service.ts` | Retiradas. |
| `user-settings.service.ts` | Preferências do utilizador. |
| `order-alerts-popup.service.ts` / `license-expiry-popup.service.ts` | Popups no `app.component`. |
