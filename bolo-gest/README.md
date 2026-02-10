# Chef Control

MVP para gestão de pedidos (bolos, salgados e mais): **material, preço e lucro**.  
Angular 19, PWA e layout responsivo (mobile, tablet e desktop).

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

# Build de produção (inclui PWA)
ng build
# Saída em dist/chef-control/browser/
```

## PWA

O projeto está configurado como PWA. O Service Worker é ativado apenas em **build de produção**. Para testar:

1. `ng build`
2. Servir a pasta `dist/chef-control/browser` (por exemplo com `npx http-server dist/chef-control/browser -p 8080`)
3. Abrir no browser e, se quiser, “Instalar app” / “Add to Home Screen”

## Tecnologias

- Angular 19
- Angular Router (lazy loading)
- Reactive Forms
- Signals (Auth e Orders)
- Local Storage (MVP sem backend)
- SCSS com variáveis CSS
- PWA (@angular/service-worker)

## Estrutura principal

- `src/app/pages/` — Login, Dashboard, Novo Pedido, Pedidos, Relatórios
- `src/app/services/` — Auth, Orders, Storage
- `src/app/guards/` — authGuard
- `src/app/models/` — Order, User, Ingredient

Todos os valores monetários estão em **MZN**.
