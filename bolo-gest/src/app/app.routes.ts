import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { licenseGuard } from './guards/license.guard';
import { adminGuard } from './guards/admin.guard';
import { redirectAdminGuard } from './guards/redirect-admin.guard';
import { noFinalizarForAdminGuard } from './guards/no-finalizar-for-admin.guard';
import { LojaRastreioComponent } from './public/loja/loja-rastreio.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  {
    path: 'recuperar-senha',
    loadComponent: () => import('./auth/recuperar-senha/recuperar-senha.component').then(m => m.RecuperarSenhaComponent),
  },
  {
    path: 'ativar-licenca',
    loadComponent: () => import('./auth/ativar-licenca/ativar-licenca.component').then(m => m.AtivarLicencaComponent),
  },
  {
    path: 'finalizar-conta',
    loadComponent: () => import('./auth/finalizar-conta/finalizar-conta.component').then(m => m.FinalizarContaComponent),
    canActivate: [authGuard, noFinalizarForAdminGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./user/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard, licenseGuard],
  },
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'gestao-licencas',
    loadComponent: () => import('./admin/gestao-licencas/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin-logs',
    loadComponent: () => import('./admin/logs/admin-logs.component').then(m => m.AdminLogsComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin-encomendas',
    loadComponent: () => import('./admin/encomendas/admin-orders.component').then(m => m.AdminOrdersComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'satisfacao',
    loadComponent: () => import('./admin/satisfacao/satisfacao.component').then(m => m.SatisfacaoComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'gestao-notificacoes',
    loadComponent: () => import('./admin/notificacoes/gestao-notificacoes.component').then(m => m.GestaoNotificacoesComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin-novos-utilizadores',
    loadComponent: () => import('./admin/novos-utilizadores/novos-utilizadores.component').then(m => m.NovosUtilizadoresComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin-perfis',
    loadComponent: () => import('./admin/perfis/gestao-perfis.component').then(m => m.GestaoPerfisComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin-configuracoes',
    loadComponent: () => import('./admin/configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin-ranking',
    loadComponent: () => import('./admin/ranking/ranking.component').then(m => m.RankingComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'nova-encomenda',
    loadComponent: () => import('./user/nova-encomenda/new-order.component').then(m => m.NewOrderComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'clientes',
    loadComponent: () => import('./user/clientes/clientes.component').then(m => m.ClientesComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'minha-licenca',
    loadComponent: () => import('./user/minha-licenca/minha-licenca.component').then(m => m.MinhaLicencaComponent),
    canActivate: [authGuard, licenseGuard],
  },
  {
    path: 'despesas-variaveis',
    loadComponent: () => import('./user/despesas-variaveis/despesas-variaveis.component').then(m => m.DespesasVariaveisComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'gestao-dividas',
    loadComponent: () => import('./user/dividas/dividas.component').then(m => m.DividasComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'encomendas',
    loadComponent: () => import('./user/encomendas/orders.component').then(m => m.OrdersComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'encomendas/detalhes',
    loadComponent: () => import('./user/encomendas-detalhes/orders-detail-list.component').then(m => m.OrdersDetailListComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'encomendas/:id',
    loadComponent: () => import('./user/encomenda/order-details.component').then(m => m.OrderDetailsComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'calendario',
    loadComponent: () => import('./user/calendario/calendario.component').then(m => m.CalendarioComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'lembretes',
    loadComponent: () => import('./user/lembretes/lembretes.component').then(m => m.LembretesComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'relatorios',
    loadComponent: () => import('./user/relatorios/reports.component').then(m => m.ReportsComponent),
    canActivate: [authGuard, licenseGuard],
  },
  {
    path: 'retiradas',
    loadComponent: () => import('./user/retiradas/retiradas.component').then(m => m.RetiradasComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'loja',
    loadComponent: () => import('./public/loja/loja-layout.component').then(m => m.LojaLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./public/loja/loja-home.component').then(m => m.LojaHomeComponent) },
      { path: 'contato', loadComponent: () => import('./public/loja/loja-contato.component').then(m => m.LojaContatoComponent) },
      { path: 'rastreio', component: LojaRastreioComponent },
    ],
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
