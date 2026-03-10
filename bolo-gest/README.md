# Chef Control

MVP para gestão de pedidos (bolos, salgados e mais): **material, preço e lucro**.  
Angular 19 e layout responsivo (mobile, tablet e desktop).

## Funcionalidades

- **Login / Registo** — Telefone + senha (dados guardados localmente)
- **Dashboard** — Pedidos do dia, lucro total, pedidos com saldo pendente
- **Novo Pedido** — Cliente, nome e tamanho do bolo, valor cobrado, valor pago (0%, 50%, 100%), ingredientes com custo, energia; cálculo automático de custo total, lucro, saldo e status de pagamento
- **Pedidos** — Lista com atualização de valor pago e “Marcar como entregue”
- **Relatórios** — Lucro total do dia / semana / mês, total de pedidos, pedidos com saldo pendente

## Como executar

```bash
# Instalar dependências (se ainda não fez)
npm install

# Servidor de desenvolvimento
npm start
# ou: ng serve
# Abrir http://localhost:4200

# Build de produção
ng build
# Saída em dist/chef-control/
```

## Tecnologias

- Angular 19
- Angular Router (lazy loading)
- Reactive Forms
- Signals (Auth e Orders)
- Local Storage (MVP sem backend)
- SCSS com variáveis CSS

## Estrutura principal

- `src/app/pages/` — Login, Dashboard, Novo Pedido, Pedidos, Relatórios
- `src/app/services/` — Auth, Orders, Storage
- `src/app/guards/` — authGuard
- `src/app/models/` — Order, User, Ingredient

Todos os valores monetários estão em **MZN**.
