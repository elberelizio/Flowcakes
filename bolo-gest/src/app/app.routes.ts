import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { licenseGuard } from './core/guards/license.guard';
import { adminGuard } from './core/guards/admin.guard';
import { redirectAdminGuard } from './core/guards/redirect-admin.guard';
import { WebStoreTrackOrderComponent } from './public/web-store/web-store-track-order.component';
import { webPageRoutes } from './public/web-page/web-page.routes';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./public/web-page/web-page-layout.component').then((m) => m.WebPageLayoutComponent),
    children: webPageRoutes,
  },
  { path: 'login', loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent) },
  {
    path: 'recuperar-senha',
    loadComponent: () => import('./login/recuperar-senha/recuperar-senha.component').then((m) => m.RecuperarSenhaComponent),
  },
  { path: 'register', loadComponent: () => import('./public/web-store/register/register.component').then((m) => m.RegisterComponent) },
  { path: 'registro', redirectTo: 'register', pathMatch: 'full' },
  {
    path: 'ativar-licenca',
    loadComponent: () =>
      import('./dashboard-admin/ativar-licenca/ativar-licenca.component').then((m) => m.AtivarLicencaComponent),
  },
  {
    path: 'pagamento-licenca',
    loadComponent: () =>
      import('./pagamento-licenca/pagamento-licenca.component').then((m) => m.PagamentoLicencaComponent),
  },
  { path: 'finalizar-conta', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard-user/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard, licenseGuard],
  },
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./dashboard-admin/dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'gestao-licencas',
    loadComponent: () => import('./dashboard-admin/gestao-licencas/admin.component').then((m) => m.AdminComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin-logs',
    loadComponent: () => import('./dashboard-admin/logs/admin-logs.component').then((m) => m.AdminLogsComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin-encomendas',
    loadComponent: () => import('./dashboard-admin/encomendas/admin-orders.component').then((m) => m.AdminOrdersComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'satisfacao',
    loadComponent: () => import('./dashboard-admin/satisfacao/satisfacao.component').then((m) => m.SatisfacaoComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'gestao-notificacoes',
    loadComponent: () => import('./dashboard-admin/notificacoes/gestao-notificacoes.component').then((m) => m.GestaoNotificacoesComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin-novos-utilizadores',
    loadComponent: () => import('./dashboard-admin/novos-utilizadores/novos-utilizadores.component').then((m) => m.NovosUtilizadoresComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin-perfis',
    loadComponent: () => import('./dashboard-admin/perfis/gestao-perfis.component').then((m) => m.GestaoPerfisComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin-configuracoes',
    loadComponent: () => import('./dashboard-admin/configuracoes/configuracoes.component').then((m) => m.ConfiguracoesComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin-ranking',
    loadComponent: () => import('./dashboard-admin/ranking/ranking.component').then((m) => m.RankingComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'nova-encomenda',
    loadComponent: () => import('./dashboard-user/nova-encomenda/new-order.component').then((m) => m.NewOrderComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'clientes',
    loadComponent: () => import('./dashboard-user/clientes/clientes.component').then((m) => m.ClientesComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'minha-licenca',
    loadComponent: () => import('./dashboard-user/minha-licenca/minha-licenca.component').then((m) => m.MinhaLicencaComponent),
    canActivate: [authGuard, licenseGuard],
  },
  {
    path: 'despesas-variaveis',
    loadComponent: () => import('./dashboard-user/despesas-variaveis/despesas-variaveis.component').then((m) => m.DespesasVariaveisComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'gestao-dividas',
    loadComponent: () => import('./dashboard-user/dividas/dividas.component').then((m) => m.DividasComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'encomendas',
    loadComponent: () => import('./dashboard-user/encomendas/orders.component').then((m) => m.OrdersComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'encomendas/detalhes',
    loadComponent: () => import('./dashboard-user/encomendas-detalhes/orders-detail-list.component').then((m) => m.OrdersDetailListComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'encomendas/:id',
    loadComponent: () => import('./dashboard-user/encomenda/order-details.component').then((m) => m.OrderDetailsComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'lembretes',
    loadComponent: () => import('./dashboard-user/lembretes/lembretes.component').then((m) => m.LembretesComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'relatorios',
    loadComponent: () => import('./dashboard-user/relatorios/reports.component').then((m) => m.ReportsComponent),
    canActivate: [authGuard, licenseGuard],
  },
  {
    path: 'retiradas',
    loadComponent: () => import('./dashboard-user/retiradas/retiradas.component').then((m) => m.RetiradasComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'pagamentos',
    redirectTo: 'minha-licenca',
    pathMatch: 'full',
  },
  {
    path: 'configuracoes',
    loadComponent: () => import('./dashboard-user/configuracoes/configuracoes.component').then((m) => m.ConfiguracoesComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'loja',
    loadComponent: () => import('./public/web-store/web-store-layout.component').then((m) => m.WebStoreLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./public/web-store/web-store-home.component').then((m) => m.WebStoreHomeComponent) },
      { path: 'contato', loadComponent: () => import('./public/web-store/web-store-contact.component').then((m) => m.WebStoreContactComponent) },
      { path: 'rastreio', component: WebStoreTrackOrderComponent },
      {
        path: ':slug',
        children: [
          { path: '', loadComponent: () => import('./public/web-store/web-store-home.component').then((m) => m.WebStoreHomeComponent) },
          { path: 'contato', loadComponent: () => import('./public/web-store/web-store-contact.component').then((m) => m.WebStoreContactComponent) },
          { path: 'rastreio', component: WebStoreTrackOrderComponent },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
