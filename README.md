# Chef Control

Sistema de gestão de doces e salgados (pedidos, clientes, lucros).

O projeto está dividido em duas partes:

| Pasta       | Descrição |
|------------|-----------|
| **bolo-gest/** | Frontend (Angular) – interface da aplicação |
| **backend/**   | Backend (Java Spring Boot + PostgreSQL) – API REST |

## Como executar

### 1. Base de dados

Tenha o **PostgreSQL** a correr e crie a base:

```sql
CREATE DATABASE chefcontrol2025;
```

Configure utilizador e senha em variáveis de ambiente ou em `backend/src/main/resources/application.yml`.

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

A API fica em `http://localhost:8080`. Ver detalhes em [backend/README.md](backend/README.md).

### 3. Frontend

```bash
cd bolo-gest
npm install
npm start
```

A aplicação abre em `http://localhost:4200`.

## Resumo

- **Front:** Angular em `bolo-gest/` (login, dashboard, pedidos, perfil).
- **Back:** Spring Boot em `backend/` (auth, pedidos, PostgreSQL). Endpoints em `/api/auth` e `/api/orders`; pedidos e perfil usam o header `X-User-Id` com o ID do utilizador devolvido no login/registo.
