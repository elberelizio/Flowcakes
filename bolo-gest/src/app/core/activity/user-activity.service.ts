import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { API_URL } from '../config/api.config';
import { AuthService } from '../../services/auth.service';

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/orders': 'Encomendas',
  '/orders/details': 'Detalhes de encomendas',
  '/new-order': 'Nova encomenda',
  '/clients': 'Clientes',
  '/variable-expenses': 'Registar despesas',
  '/variable-expenses/consultar': 'Consultar despesas',
  '/debts': 'Gestão de dívidas',
  '/reminders': 'Lembretes',
  '/notifications': 'Comunicado',
  '/reports': 'Relatórios',
  '/withdrawals': 'Retiradas',
  '/my-license': 'Minha licença',
  '/profile': 'Perfil',
  '/settings': 'Configurações',
  '/admin-dashboard': 'Painel admin',
  '/treasury': 'Tesouraria',
  '/license-management': 'Gestão de licenças',
  '/admin-orders': 'Encomendas (admin)',
  '/notification-management': 'Gestão de notificações',
  '/admin-new-users': 'Novos utilizadores',
  '/admin-profiles': 'Gestão de perfis',
  '/admin-settings': 'Configurações admin',
  '/admin-settings/logs': 'Logs de acesso',
  '/admin-settings/access': 'Gestão de acessos',
  '/admin-settings/suggestions': 'Sugestões',
  '/admin-ranking': 'Ranking',
  '/satisfaction': 'Satisfação',
  '/license-payment': 'Pagamento de licença',
  '/activate-license': 'Ativar licença',
};

@Injectable({ providedIn: 'root' })
export class UserActivityService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);
  private lastPagePath = '';
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    if (this.auth.getUserId()) {
      const initial = this.normalizePath(this.router.url);
      if (initial) {
        this.lastPagePath = initial;
        this.trackPage(initial);
      }
    }

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      if (!this.auth.getUserId()) return;
      const path = this.normalizePath(this.router.url);
      if (!path || path === this.lastPagePath) return;
      this.lastPagePath = path;
      this.trackPage(path);
    });
  }

  trackPage(pagePath: string): void {
    if (!this.auth.getUserId()) return;
    this.send({
      activityType: 'PAGE_VIEW',
      pagePath,
      operation: pageLabel(pagePath),
    });
  }

  trackOperation(operation: string, detail?: string): void {
    if (!this.auth.getUserId()) return;
    this.send({
      activityType: 'OPERATION',
      operation: operation.slice(0, 200),
      detail: detail?.slice(0, 500),
    });
  }

  private send(body: {
    activityType: string;
    pagePath?: string;
    operation?: string;
    detail?: string;
  }): void {
    this.http.post(`${API_URL}/auth/activity`, body).subscribe({ error: () => {} });
  }

  private normalizePath(url: string): string {
    const path = url.split('?')[0].split('#')[0];
    if (!path || path === '/login' || path === '/register') return '';
    return path;
  }
}

export function pageLabel(path: string): string {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  if (path.startsWith('/orders/') && path !== '/orders/details') {
    return `Encomenda ${path.slice('/orders/'.length)}`;
  }
  return path;
}

export function describeApiOperation(method: string, url: string): string | null {
  const path = url.replace(API_URL, '').split('?')[0];
  if (path.startsWith('/auth/')) return null;

  const m = method.toUpperCase();
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return null;

  if (path.startsWith('/orders')) {
    if (m === 'POST') return 'Criar encomenda';
    if (m === 'PUT' || m === 'PATCH') return 'Atualizar encomenda';
    if (m === 'DELETE') return 'Eliminar encomenda';
  }
  if (path.includes('/close')) return 'Fechar encomenda';
  if (path.startsWith('/clients')) {
    if (m === 'POST') return 'Criar cliente';
    if (m === 'PUT' || m === 'PATCH') return 'Atualizar cliente';
    if (m === 'DELETE') return 'Eliminar cliente';
  }
  if (path.startsWith('/reminders')) {
    if (m === 'POST') return 'Criar lembrete';
    if (m === 'PUT' || m === 'PATCH') return 'Atualizar lembrete';
    if (m === 'DELETE') return 'Eliminar lembrete';
  }
  if (path.startsWith('/withdrawals')) {
    if (m === 'POST') return 'Registar retirada';
    if (m === 'PUT' || m === 'PATCH') return 'Atualizar retirada';
    if (m === 'DELETE') return 'Eliminar retirada';
  }
  if (path.startsWith('/auth/profile') || path.includes('/profile')) return 'Atualizar perfil';
  if (path.startsWith('/auth/store-settings')) return 'Atualizar loja';
  if (path.startsWith('/auth/change-password')) return 'Alterar senha';
  if (path.startsWith('/auth/change-phone')) return 'Alterar contacto';
  if (path.startsWith('/admin/users')) return 'Gestão de utilizador (admin)';
  if (path.startsWith('/admin/notifications')) return 'Gestão de notificações (admin)';
  if (path.startsWith('/admin/treasury')) return 'Operação de tesouraria';
  if (path.startsWith('/variable-expenses') || path.includes('expenses')) {
    if (m === 'POST') return 'Registar despesa';
    if (m === 'PUT' || m === 'PATCH') return 'Atualizar despesa';
    if (m === 'DELETE') return 'Eliminar despesa';
  }

  return `${m} ${path}`;
}
