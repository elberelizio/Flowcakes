import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { licenseGuard } from './core/guards/license.guard';
import { adminGuard } from './core/guards/admin.guard';
import { redirectAdminGuard } from './core/guards/redirect-admin.guard';
import { registrationChoosePlanGuard, registrationPaymentGuard } from './core/guards/registration-flow.guard';
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
    path: 'recover-password',
    loadComponent: () => import('./login/recover-password/recover-password.component').then((m) => m.RecoverPasswordComponent),
  },
  { path: 'recuperar-senha', redirectTo: 'recover-password', pathMatch: 'full' },
  { path: 'register', loadComponent: () => import('./public/web-store/register/register.component').then((m) => m.RegisterComponent) },
  {
    path: 'choose-plan',
    canActivate: [registrationChoosePlanGuard],
    loadComponent: () =>
      import('./public/web-store/post-register-plan/post-register-plan.component').then((m) => m.PostRegisterPlanComponent),
  },
  { path: 'escolher-plano', redirectTo: 'choose-plan', pathMatch: 'full' },
  { path: 'registro', redirectTo: 'register', pathMatch: 'full' },
  {
    path: 'activate-license',
    loadComponent: () =>
      import('./dashboard-admin/activate-license/activate-license.component').then((m) => m.ActivateLicenseComponent),
  },
  { path: 'ativar-licenca', redirectTo: 'activate-license', pathMatch: 'full' },
  { path: 'pagamento-licenca', redirectTo: '/license-payment', pathMatch: 'full' },
  {
    path: 'license-payment',
    canActivate: [redirectAdminGuard, registrationPaymentGuard],
    loadComponent: () =>
      import('./license-payment/license-payment.component').then((m) => m.LicensePaymentComponent),
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
    path: 'treasury',
    loadComponent: () => import('./dashboard-admin/treasury/treasury.component').then((m) => m.TreasuryComponent),
    canActivate: [authGuard, adminGuard],
  },
  { path: 'tesouraria', redirectTo: 'treasury', pathMatch: 'full' },
  {
    path: 'license-management',
    loadComponent: () => import('./dashboard-admin/license-management/admin.component').then((m) => m.AdminComponent),
    canActivate: [authGuard, adminGuard],
  },
  { path: 'gestao-licencas', redirectTo: 'license-management', pathMatch: 'full' },
  {
    path: 'admin-orders',
    loadComponent: () => import('./dashboard-admin/orders/admin-orders.component').then((m) => m.AdminOrdersComponent),
    canActivate: [authGuard, adminGuard],
  },
  { path: 'admin-encomendas', redirectTo: 'admin-orders', pathMatch: 'full' },
  {
    path: 'notification-management',
    loadComponent: () =>
      import('./dashboard-admin/notifications/notification-management.component').then((m) => m.NotificationManagementComponent),
    canActivate: [authGuard, adminGuard],
  },
  { path: 'gestao-notificacoes', redirectTo: 'notification-management', pathMatch: 'full' },
  {
    path: 'admin-new-users',
    loadComponent: () => import('./dashboard-admin/new-users/new-users.component').then((m) => m.NewUsersComponent),
    canActivate: [authGuard, adminGuard],
  },
  { path: 'admin-novos-utilizadores', redirectTo: 'admin-new-users', pathMatch: 'full' },
  {
    path: 'admin-profiles',
    loadComponent: () => import('./dashboard-admin/profiles/profile-management.component').then((m) => m.ProfileManagementComponent),
    canActivate: [authGuard, adminGuard],
  },
  { path: 'admin-perfis', redirectTo: 'admin-profiles', pathMatch: 'full' },
  {
    path: 'admin-settings',
    loadComponent: () =>
      import('./dashboard-admin/settings/settings-layout.component').then((m) => m.SettingsLayoutComponent),
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./dashboard-admin/settings/settings-hub.component').then((m) => m.SettingsHubComponent),
      },
      {
        path: 'logs',
        loadComponent: () =>
          import('./dashboard-admin/settings/logs/admin-logs.component').then((m) => m.AdminLogsComponent),
      },
      {
        path: 'logs/:userId',
        loadComponent: () =>
          import('./dashboard-admin/settings/logs/admin-logs-user-history.component').then(
            (m) => m.AdminLogsUserHistoryComponent,
          ),
      },
      {
        path: 'access',
        loadComponent: () =>
          import('./dashboard-admin/access-management/access-management.component').then((m) => m.AccessManagementComponent),
      },
      {
        path: 'suggestions',
        loadComponent: () =>
          import('./dashboard-admin/suggestions/suggestions.component').then((m) => m.SuggestionsComponent),
      },
    ],
  },
  { path: 'admin-configuracoes', redirectTo: 'admin-settings', pathMatch: 'full' },
  { path: 'admin-configuracoes/logs', redirectTo: 'admin-settings/logs', pathMatch: 'full' },
  { path: 'admin-configuracoes/logs/:userId', redirectTo: 'admin-settings/logs/:userId', pathMatch: 'full' },
  { path: 'admin-configuracoes/acessos', redirectTo: 'admin-settings/access', pathMatch: 'full' },
  { path: 'admin-configuracoes/sugestoes', redirectTo: 'admin-settings/suggestions', pathMatch: 'full' },
  { path: 'admin-logs', redirectTo: 'admin-settings/logs', pathMatch: 'full' },
  { path: 'gestao-acessos', redirectTo: 'admin-settings/access', pathMatch: 'full' },
  { path: 'sugestoes', redirectTo: 'admin-settings/suggestions', pathMatch: 'full' },
  {
    path: 'admin-ranking',
    loadComponent: () => import('./dashboard-admin/ranking/ranking.component').then((m) => m.RankingComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'satisfaction',
    loadComponent: () =>
      import('./dashboard-admin/satisfaction/satisfaction.component').then((m) => m.SatisfactionComponent),
    canActivate: [authGuard, adminGuard],
  },
  { path: 'satisfacao', redirectTo: 'satisfaction', pathMatch: 'full' },
  {
    path: 'new-order',
    loadComponent: () => import('./dashboard-user/new-order/new-order.component').then((m) => m.NewOrderComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  { path: 'nova-encomenda', redirectTo: 'new-order', pathMatch: 'full' },
  {
    path: 'clients',
    loadComponent: () => import('./dashboard-user/clients/clients.component').then((m) => m.ClientsComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  { path: 'clientes', redirectTo: 'clients', pathMatch: 'full' },
  {
    path: 'my-license',
    loadComponent: () => import('./dashboard-user/my-license/my-license.component').then((m) => m.MyLicenseComponent),
    canActivate: [authGuard, licenseGuard],
  },
  { path: 'minha-licenca', redirectTo: 'my-license', pathMatch: 'full' },
  {
    path: 'profile',
    loadComponent: () => import('./dashboard-user/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  { path: 'perfil', redirectTo: 'profile', pathMatch: 'full' },
  {
    path: 'variable-expenses',
    loadComponent: () =>
      import('./dashboard-user/variable-expenses/variable-expenses.component').then((m) => m.VariableExpensesComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  { path: 'despesas-variaveis', redirectTo: 'variable-expenses', pathMatch: 'full' },
  {
    path: 'debts',
    loadComponent: () => import('./dashboard-user/debts/debts.component').then((m) => m.DebtsComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  { path: 'gestao-dividas', redirectTo: 'debts', pathMatch: 'full' },
  {
    path: 'orders',
    loadComponent: () => import('./dashboard-user/orders/orders.component').then((m) => m.OrdersComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'orders/details',
    loadComponent: () =>
      import('./dashboard-user/order-details-list/orders-detail-list.component').then((m) => m.OrdersDetailListComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  {
    path: 'orders/:id',
    loadComponent: () => import('./dashboard-user/order/order-details.component').then((m) => m.OrderDetailsComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  { path: 'encomendas', redirectTo: 'orders', pathMatch: 'full' },
  { path: 'encomendas/detalhes', redirectTo: 'orders/details', pathMatch: 'full' },
  { path: 'encomendas/:id', redirectTo: 'orders/:id', pathMatch: 'full' },
  {
    path: 'reminders',
    loadComponent: () => import('./dashboard-user/reminders/reminders.component').then((m) => m.RemindersComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  { path: 'lembretes', redirectTo: 'reminders', pathMatch: 'full' },
  {
    path: 'notifications',
    loadComponent: () => import('./dashboard-user/notifications/notifications.component').then((m) => m.NotificationsComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  { path: 'notificacoes', redirectTo: 'notifications', pathMatch: 'full' },
  {
    path: 'reports',
    loadComponent: () => import('./dashboard-user/reports/reports.component').then((m) => m.ReportsComponent),
    canActivate: [authGuard, licenseGuard],
  },
  { path: 'relatorios', redirectTo: 'reports', pathMatch: 'full' },
  {
    path: 'withdrawals',
    loadComponent: () => import('./dashboard-user/withdrawals/withdrawals.component').then((m) => m.WithdrawalsComponent),
    canActivate: [authGuard, redirectAdminGuard, licenseGuard],
  },
  { path: 'retiradas', redirectTo: 'withdrawals', pathMatch: 'full' },
  {
    path: 'payments',
    redirectTo: 'my-license',
    pathMatch: 'full',
  },
  { path: 'pagamentos', redirectTo: 'my-license', pathMatch: 'full' },
  {
    path: 'settings',
    loadComponent: () => import('./dashboard-user/settings/settings.component').then((m) => m.SettingsComponent),
    canActivate: [authGuard, adminGuard],
  },
  { path: 'configuracoes', redirectTo: 'settings', pathMatch: 'full' },
  {
    path: 'store',
    loadComponent: () => import('./public/web-store/web-store-layout.component').then((m) => m.WebStoreLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./public/web-store/web-store-home.component').then((m) => m.WebStoreHomeComponent) },
      { path: 'contact', loadComponent: () => import('./public/web-store/web-store-contact.component').then((m) => m.WebStoreContactComponent) },
      { path: 'tracking', component: WebStoreTrackOrderComponent },
      {
        path: ':slug',
        children: [
          { path: '', loadComponent: () => import('./public/web-store/web-store-home.component').then((m) => m.WebStoreHomeComponent) },
          { path: 'contact', loadComponent: () => import('./public/web-store/web-store-contact.component').then((m) => m.WebStoreContactComponent) },
          { path: 'tracking', component: WebStoreTrackOrderComponent },
        ],
      },
    ],
  },
  { path: 'loja', redirectTo: 'store', pathMatch: 'full' },
  { path: 'loja/contato', redirectTo: 'store/contact', pathMatch: 'full' },
  { path: 'loja/rastreio', redirectTo: 'store/tracking', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
