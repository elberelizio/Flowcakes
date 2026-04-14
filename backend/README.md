# Chef Control – Backend

Backend em **Java 17** com **Spring Boot 3** e base de dados **PostgreSQL**.

## Requisitos

- JDK 17+
- Maven 3.8+
- PostgreSQL (ex.: 14 ou 15)

## Base de dados

Scripts SQL estão em `scripts/` (por tabela e schema completo):

1. **00_create_database.sql** – instruções para criar a base `chefcontrol2025`.
2. **01_users.sql** – tabela de login (utilizadores).
3. **02_licenses.sql** – tabela de licenças (500 MZN, e-Mola 871964887). Conta só finalizada após pagamento.
4. **03_add_is_admin_and_admin_user.sql** – coluna `is_admin` e conta administrador (871964887). **Obrigatório** para que o login com o admin não peça licença.
5. **04_license_transactions.sql** – tabela de IDs de transacção e-Mola por licença (admin introduz o ID ao confirmar pagamento).
6. **01_schema.sql** – schema base (users, user_licenses). Encomendas unificadas: **03_create_orders_table.sql** (`orders`, `order_ingredient_ids`). Tabelas antigas `orders_doces` / `orders_salgados` podem ser removidas com **17_drop_legacy_orders_tables.sql** após migração dos dados.

Ordem recomendada (por tabela):

```bash
psql -U postgres -c "CREATE DATABASE chefcontrol2025;"
psql -U postgres -d chefcontrol2025 -f scripts/01_users.sql
psql -U postgres -d chefcontrol2025 -f scripts/02_licenses.sql
psql -U postgres -d chefcontrol2025 -f scripts/03_add_is_admin_and_admin_user.sql
# depois o resto em 01_schema.sql ou tabelas de pedidos
```

Ou use apenas o JPA com `spring.jpa.hibernate.ddl-auto: update` (já configurado) e o Hibernate cria/atualiza as tabelas automaticamente. Os scripts servem para criar o schema à mão ou para ambientes onde não se usa `ddl-auto`.

## Configuração

Variáveis de ambiente (ou edite `src/main/resources/application.yml`):

| Variável     | Descrição           | Default     |
|-------------|---------------------|-------------|
| `DB_HOST`   | Host PostgreSQL     | `localhost` |
| `DB_PORT`   | Porta                | `5432`      |
| `DB_NAME`   | Nome da base         | `chefcontrol2025` |
| `DB_USER`   | Utilizador          | `postgres`  |
| `DB_PASSWORD` | Senha             | `admin`  |
| `SERVER_PORT` | Porta do servidor | `8081`      |
| `app.cors-allowed-origins` | Origens CORS (separadas por vírgula) | `http://localhost:4200` |
| `TWILIO_ACCOUNT_SID` | (Opcional) Twilio – envio SMS e WhatsApp | - |
| `TWILIO_AUTH_TOKEN` | (Opcional) Twilio | - |
| `TWILIO_FROM_NUMBER` | (Opcional) Número Twilio para **SMS** (ex.: +1234567890). Entrega via operador nacional ao número em Moçambique (+258...). | - |
| `TWILIO_WHATSAPP_FROM` | (Opcional) Número Twilio para **WhatsApp** (ex.: `whatsapp:+14155238886` para sandbox). Se definido, o código de licença é enviado também por WhatsApp. | - |

## Executar

No Windows, na pasta `backend`:

```bat
iniciar-backend.bat
```

Define `SERVER_PORT=8081` e `DB_PASSWORD=admin` (ajuste se precisar). Com Maven instalado também pode usar `mvnw.cmd spring-boot:run` depois de definir `JAVA_HOME`.

A API fica em `http://localhost:8081` (ou na porta definida em `SERVER_PORT`).

## Endpoints

- **Auth:** `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/profile`, `POST /api/auth/change-password`
- **Licença:** `GET /api/auth/license-status`, `POST /api/auth/confirm-payment` (reconhecimento pagamento e-Mola 871964887)
- **Pedidos:** `GET /api/orders`, `GET /api/orders/{id}`, `POST /api/orders`, `PUT /api/orders/{id}`, `DELETE /api/orders/{id}`

Endpoints de pedidos, perfil e licença identificam o utilizador pela sessão (cookie `CHEFCONTROL_SESSION`). Se o cookie não for enviado (ex.: CORS), o backend aceita o header `X-User-Id` com o UUID do utilizador; o frontend envia-o automaticamente quando o utilizador está logado.

## Registo e licença

- Ao registar, é criada uma licença em estado **pending**.
- **SMS (operador nacional) e WhatsApp (Twilio):**
  - **No registo:** Se definir `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_FROM_NUMBER`, o sistema envia **SMS** ao utilizador (confirmação de conta, credenciais e instruções para pagar 500 MZN) e ao **admin (871964887)** (aviso de nova conta).
  - **Após o admin confirmar pagamento:** O sistema envia ao utilizador **SMS** com o código de licença (9 caracteres). Se definir também `TWILIO_WHATSAPP_FROM` (ex.: `whatsapp:+14155238886` para sandbox), envia o **mesmo código por WhatsApp**.
- Sem Twilio configurado, as mensagens são apenas registadas em log; o utilizador vê o popup de sucesso no frontend e o admin pode comunicar o código manualmente.
- A conta só fica **finalizada** após pagamento da licença (500 MZN) para o número e-Mola **871964887**.
- Para teste, o frontend pode chamar `POST /api/auth/confirm-payment` para simular o reconhecimento do pagamento; o backend gera um **código de licença** (9 caracteres, letras e números).
- **Administrador:** execute o script `03_add_is_admin_and_admin_user.sql` na base. Ele adiciona a coluna `is_admin` e marca o utilizador com telefone **871964887** como admin. O admin não tem licença na tabela `user_licenses` e não é solicitado a pagar; o backend trata `is_admin = true` como conta finalizada. Sem este script, o login com 871964887 leva para "Finalizar conta".
