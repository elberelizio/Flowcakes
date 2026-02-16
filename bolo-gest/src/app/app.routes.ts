import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { licenseGuard } from './guards/license.guard';
import { adminGuard } from './guards/admin.guard';
import { redirectAdminGuard } from './guards/redirect-admin.guard';
import { noFinalizarForAdminGuard } from './guards/no-finalizar-for-admin.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: 'ativar-licenca',
    loadComponent: () => import('./pages/ativar-licenca/ativar-licenca.component').then(m => m.AtivarLicencaComponent),
  },
  {
    path: 'finalizar-conta',
    loadComponent: () => import('./pages/finalizar-conta/finalizar-conta.component').then(m => m.FinalizarContaComponent),
    // Temporariamente sem guard - canActivate: [authGuard, noFinalizarForAdminGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    // Temporariamente sem guards - canActivate: [authGuard, licenseGuard],
  },
  {
    path: 'gestao-licencas',
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
    // Temporariamente sem guard - canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin-encomendas',
    loadComponent: () => import('./pages/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent),
    // Temporariamente sem guard - canActivate: [authGuard, adminGuard],
  },
  {
    path: 'satisfacao',
    loadComponent: () => import('./pages/satisfacao/satisfacao.component').then(m => m.SatisfacaoComponent),
    // Temporariamente sem guard - canActivate: [authGuard, adminGuard],
  },
  {
    path: 'gestao-notificacoes',
    loadComponent: () => import('./pages/gestao-notificacoes/gestao-notificacoes.component').then(m => m.GestaoNotificacoesComponent),
    // Temporariamente sem guard - canActivate: [authGuard, adminGuard],
  },
  {
    path: 'nova-encomenda',
    loadComponent: () => import('./pages/new-order/new-order.component').then(m => m.NewOrderComponent),
    // Temporariamente sem guards - canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'encomendas',
    loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent),
    // Temporariamente sem guards - canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'relatorios',
    loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent),
    // Temporariamente sem guards - canActivate: [authGuard, licenseGuard],
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    // Temporariamente sem guards - canActivate: [authGuard, licenseGuard],
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
