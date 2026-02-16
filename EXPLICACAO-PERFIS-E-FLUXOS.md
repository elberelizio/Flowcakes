# 📊 Explicação Completa: Perfis e Fluxos do Sistema

## 🎯 Visão Geral

O sistema tem **2 tipos de utilizadores** com funcionalidades e dados completamente diferentes:

1. **👤 Utilizador Normal** (Empreendedor)
2. **👑 Administrador** (Gestor do Sistema)

---

## 🔐 Como o Sistema Identifica o Perfil

### Na Base de Dados
- Tabela: `users`
- Campo: `is_admin` (BOOLEAN)
  - `true` = Administrador
  - `false` = Utilizador Normal

### No Backend (Spring Boot)
```java
// AuthService.java - linha ~40
boolean isAdmin = user.isAdmin();
String licenseStatus = isAdmin ? "paid" : licenseService.findByUserId(user.getId())...
```

### No Frontend (Angular)
```typescript
// auth.service.ts - linha 268
isAdmin(): boolean {
  return this.currentUser()?.admin ?? false;
}
```

---

## 📋 FLUXO 1: Utilizador Normal (Empreendedor)

### 🚪 Login
1. Utilizador faz login com telefone e senha
2. Backend verifica credenciais na tabela `users`
3. Se `is_admin = false` → Utilizador Normal

### 🏠 Redirecionamento Após Login
```
Login → Verifica conta finalizada e licença validada
  ├─ Se NÃO finalizada → /finalizar-conta
  └─ Se finalizada → /dashboard
```

### 📊 Dashboard do Utilizador Normal

**Dados Mostrados:**
- ✅ **Apenas os SEUS próprios dados**
- ✅ Pedidos que ELE criou
- ✅ Lucro/Despesa dos SEUS pedidos
- ✅ Encomendas que ELE tem para entregar

**Componentes do Dashboard:**
1. **Cards Principais:**
   - 🎂 Total Arrecadado (soma dos seus pedidos)
   - 🥟 Despesa (custo total dos seus pedidos)
   - 🧁 Lucro (receita - despesa dos seus pedidos)

2. **Gráfico:**
   - 📈 Lucro vs Despesa (últimos 30 dias)
   - Mostra apenas os dados do utilizador

3. **Encomendas por Entregar:**
   - Lista apenas as encomendas do utilizador
   - Ordenadas por data de entrega

4. **Pedidos do Dia:**
   - Mostra apenas os pedidos criados hoje pelo utilizador

**Fonte de Dados:**
```typescript
// dashboard.component.ts
totalRevenue = computed(() => {
  const allOrders = this.orders.allOrders(); // Apenas pedidos do utilizador
  return allOrders.reduce((sum, o) => sum + o.valueCharged, 0);
});
```

**API Chamada:**
```
GET /api/orders
→ Retorna apenas pedidos do utilizador logado (filtrado por userId na sessão)
```

### 🎛️ Menu Lateral (Sidebar)
```
📊 Dashboard
➕ Novo Pedido
📋 Pedidos
📈 Relatórios
👤 Perfil
🚪 Sair
```

### 🔒 Páginas Acessíveis
- `/dashboard` - Dashboard pessoal
- `/novo-pedido` - Criar novo pedido
- `/pedidos` - Ver todos os seus pedidos
- `/relatorios` - Relatórios dos seus dados
- `/perfil` - Editar perfil pessoal

---

## 👑 FLUXO 2: Administrador

### 🚪 Login
1. Administrador faz login com telefone e senha
2. Backend verifica credenciais na tabela `users`
3. Se `is_admin = true` → Administrador

### 🏠 Redirecionamento Após Login
```
Login → Verifica se é admin
  └─ Se admin → /gestao-licencas (sempre)
```

### 📊 Dashboard do Administrador

**Dados Mostrados:**
- ✅ **Dados de TODOS os utilizadores**
- ✅ Estatísticas globais do sistema
- ✅ Receita agregada de todos
- ✅ Gestão de licenças

**Componentes do Dashboard:**
1. **KPIs Principais:**
   - 👥 Utilizadores registados (total)
   - ✅ Licenças activas (contas com licença paga)
   - ⛔ Contas bloqueadas (sem licença paga)
   - 💰 Receita este mês (soma de todos os utilizadores)

2. **Indicadores de Uso:**
   - Tempo médio no sistema (em desenvolvimento)
   - Utilizador mais activo (em desenvolvimento)
   - Tempo no sistema por utilizador (em desenvolvimento)

3. **Gráfico:**
   - 📊 Receita por mês (todos os utilizadores)
   - Mostra receita agregada de todo o sistema

4. **Ações Rápidas:**
   - Gestão de licenças
   - Ver todas as encomendas do sistema

**Fonte de Dados:**
```typescript
// dashboard.component.ts - linha 336
if (this.isAdmin) {
  this.http.get<AdminStats>(`${API_URL}/admin/stats`).subscribe(...)
  this.http.get<RevenueByMonthDto[]>(`${API_URL}/admin/revenue-by-month`).subscribe(...)
}
```

**APIs Chamadas:**
```
GET /api/admin/stats
→ Retorna estatísticas globais:
   - totalUsers
   - licensesPaid
   - licensesPending

GET /api/admin/revenue-by-month
→ Retorna receita agregada por mês (todos os utilizadores)
```

### 🎛️ Menu Lateral (Sidebar)
```
📊 Dashboard
📈 Gestão de licenças
📋 Encomendas (todas do sistema)
👥 Satisfação
🔔 Notificações
📈 Relatórios
👤 Perfil
🚪 Sair
```

### 🔒 Páginas Acessíveis
- `/dashboard` - Dashboard administrativo
- `/gestao-licencas` - Gerir licenças dos utilizadores
- `/encomendas` - Ver todas as encomendas do sistema
- `/satisfacao` - Gestão de satisfação
- `/gestao-notificacoes` - Configurar notificações
- `/relatorios` - Relatórios globais
- `/perfil` - Perfil do administrador

### 🛡️ Proteções (Guards)
```typescript
// redirect-admin.guard.ts
// Se admin tentar acessar rotas de utilizador, redireciona para /gestao-licencas
if (auth.isAdmin()) return router.createUrlTree(['/gestao-licencas']);
```

---

## 🔄 Comparação: Dados Mostrados

| Recurso | Utilizador Normal | Administrador |
|---------|-------------------|---------------|
| **Pedidos** | Apenas os seus | Todos do sistema |
| **Receita** | Apenas a sua | Soma de todos |
| **Lucro/Despesa** | Apenas os seus | Não mostra (mostra receita global) |
| **Gráfico** | Lucro vs Despesa (30 dias) | Receita por mês (todos) |
| **Encomendas** | Apenas as suas | Todas do sistema |
| **Utilizadores** | Não vê | Vê todos e gerencia licenças |
| **Licenças** | Valida a sua própria | Gerencia todas as licenças |

---

## 🔍 Como Funciona a Separação de Dados

### Backend - Filtragem por Utilizador

**Para Utilizador Normal:**
```java
// OrderController.java (exemplo)
@GetMapping("/orders")
public List<Order> getOrders(@CurrentUserId UUID userId) {
    // Retorna apenas pedidos onde order.userId = userId
    return orderRepository.findByUserId(userId);
}
```

**Para Administrador:**
```java
// AdminController.java
@GetMapping("/admin/stats")
public AdminStats getStats() {
    // Retorna estatísticas de TODOS os utilizadores
    // Não filtra por userId
    return adminService.getGlobalStats();
}
```

### Frontend - Verificação de Perfil

**No Dashboard:**
```typescript
// dashboard.component.ts - linha 9
@if (isAdmin) {
  <!-- Mostra dashboard admin -->
} @else {
  <!-- Mostra dashboard utilizador -->
}
```

**No Menu:**
```html
<!-- app.component.html - linha 25 -->
@if (auth.isAdmin()) {
  <!-- Menu admin -->
} @else {
  <!-- Menu utilizador -->
}
```

---

## 📝 Resumo dos Fluxos

### Fluxo Utilizador Normal:
```
1. Login
2. Verifica: conta finalizada? licença validada?
3. Se sim → Dashboard (seus dados)
4. Se não → Finalizar conta
5. Dashboard mostra:
   - Seus pedidos
   - Seu lucro/despesa
   - Suas encomendas
   - Gráfico dos seus dados
```

### Fluxo Administrador:
```
1. Login
2. Verifica: is_admin = true?
3. Sempre → /gestao-licencas
4. Dashboard mostra:
   - Todos os utilizadores
   - Estatísticas globais
   - Receita agregada
   - Gráfico de receita global
```

---

## 🎯 Pontos Importantes

1. **Separação Total:** Utilizador normal NUNCA vê dados de outros utilizadores
2. **Administrador vê tudo:** Tem acesso a todos os dados do sistema
3. **APIs Diferentes:** 
   - Utilizador: `/api/orders` (filtrado)
   - Admin: `/api/admin/*` (sem filtro)
4. **Guards Protegem:** Rotas protegidas por guards que verificam `isAdmin()`
5. **Dashboard Dinâmico:** Mesmo componente, conteúdo diferente baseado em `isAdmin`

---

## 🔧 Como Criar um Administrador

Na base de dados PostgreSQL:
```sql
UPDATE users 
SET is_admin = true 
WHERE phone = '844179584';
```

Ou ao criar:
```sql
INSERT INTO users (phone, password_hash, full_name, is_admin, ...)
VALUES ('844179584', 'senha123', 'Nome', true, ...);
```

---

## ✅ Conclusão

O sistema usa **uma única aplicação** mas com **dois perfis completamente diferentes**:
- **Frontend:** Mesmo código, conteúdo diferente baseado em `isAdmin()`
- **Backend:** APIs diferentes (`/api/orders` vs `/api/admin/*`)
- **Base de Dados:** Campo `is_admin` na tabela `users` define o perfil

Isso permite que o mesmo sistema sirva tanto empreendedores individuais quanto o administrador que gerencia todo o sistema.
