import { Component, signal, HostListener, OnInit, OnDestroy, AfterViewInit, effect, inject, ViewChild } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { LanguageService } from './services/language.service';
import { IconComponent, IconName } from './components/icons/icons.component';
import { SnackbarComponent } from './components/snackbar/snackbar.component';
import { NotificationService } from './services/notification.service';
import { LicenseStatusResponse } from './services/auth.service';
import { OrdersService } from './services/orders.service';
import { ReminderService } from './services/reminder.service';
import { OrderAlertsPopupService } from './services/order-alerts-popup.service';
import { AdminStatsService } from './services/admin-stats.service';
import { orderDisplayName } from './models/order.model';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, SnackbarComponent, DecimalPipe, DatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(SnackbarComponent) private snackbar!: SnackbarComponent;
  private notificationService = inject(NotificationService);
  sidebarCollapsed = signal(false);
  sidebarOpen = signal(false);
  notificationsOpen = signal(false);
  userMenuOpen = signal(false);
  encomendasExpanded = signal(true);
  lembretesExpanded = signal(true);
  /** Contagens para a sidebar (lembretes, encomendas, dívidas) */
  reminderCount = signal(0);
  orderCount = signal(0);
  debtCount = signal(0);
  /** Data e hora fixas (definidas ao carregar a página, sem actualização em tempo real). */
  currentDateTime = signal('');

  licenseStatus = signal<LicenseStatusResponse | null>(null);

  private orders = inject(OrdersService);
  private reminders = inject(ReminderService);
  orderAlertsPopup = inject(OrderAlertsPopupService);
  adminStats = inject(AdminStatsService);
  displayName = orderDisplayName;

  /** Nome do ícone para o item Retiradas (evita erro de tipo no template). */
  readonly retiradasIcon: IconName = 'wallet';

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    public lang: LanguageService,
    private router: Router
  ) {
    effect(() => {
      if (
        this.auth.isLoggedIn() &&
        !this.auth.isAdmin() &&
        this.orders.allOrders().length > 0
      ) {
        this.orderAlertsPopup.tryShowSessionPopup();
      }
    });
    effect(() => {
      this.reminderCount.set(this.reminders.reminders().length);
      this.orderCount.set(this.orders.allOrders().length);
      this.debtCount.set(this.orders.ordersWithPendingBalance().length);
    });
  }

  private dateTimeInterval: ReturnType<typeof setInterval> | null = null;

  ngAfterViewInit(): void {
    if (this.snackbar) this.notificationService.setSnackbar(this.snackbar);
  }

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      if (this.auth.isAdmin()) {
        this.adminStats.loadStats();
      } else {
        this.orders.loadOrders();
        this.reminders.loadReminders();
      }
    }
    const updateDateTime = () => {
      const now = new Date();
      this.currentDateTime.set(
        now.toLocaleDateString('pt-MZ', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) +
          ' · ' +
          now.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateDateTime();
    this.dateTimeInterval = setInterval(updateDateTime, 60000); // atualizar a cada minuto
    if (!this.auth.isAdmin()) {
      this.auth.getLicenseStatus().then((s) => this.licenseStatus.set(s));
    }
  }

  ngOnDestroy(): void {
    if (this.dateTimeInterval) clearInterval(this.dateTimeInterval);
  }

  formatLicenseExpiry(validUntil?: string): string {
    if (!validUntil) return '—';
    return new Date(validUntil).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleEncomendas(): void {
    this.encomendasExpanded.update(v => !v);
  }

  toggleLembretes(): void {
    this.lembretesExpanded.update(v => !v);
  }


  openSidebar(): void {
    this.sidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleNotifications(e: Event): void {
    e.stopPropagation();
    this.userMenuOpen.set(false);
    this.notificationsOpen.update(v => !v);
  }

  toggleUserMenu(e: Event): void {
    e.stopPropagation();
    this.notificationsOpen.set(false);
    this.userMenuOpen.update(v => !v);
  }

  closeNavDropdowns(): void {
    this.notificationsOpen.set(false);
    this.userMenuOpen.set(false);
  }

  @HostListener('document:click') onDocumentClick(): void {
    this.closeNavDropdowns();
  }

  /** Páginas públicas: sem app-shell (login, ativação de licença, loja pública). */
  isPublicPage(): boolean {
    const url = this.router.url;
    return url === '/login' || url.startsWith('/login?') || url.includes('/ativar-licenca') || url.startsWith('/loja');
  }

  getPageTitle(): string {
    const url = this.router.url;
    if (url.includes('/admin-dashboard')) return 'Painel de administração';
    if (url.includes('/gestao-licencas')) return 'Gestão de licenças';
    if (url.includes('/admin-logs')) return 'Logs de acesso';
    if (url.includes('/admin-encomendas')) return 'Encomendas';
    if (url.includes('/recuperar-senha')) return 'Recuperar senha';
    if (url.includes('/calendario')) return 'Lembretes – Criar';
    if (url.includes('/lembretes')) return 'Lembretes – Visualizar';
    if (url.includes('/despesas-variaveis')) return 'Cadastro de despesas eventuais';
    if (url.includes('/gestao-dividas')) return 'Gestão de dívidas';
    if (url.includes('/clientes')) return 'Clientes';
    if (url.includes('/minha-licenca')) return 'Minha Licença';
    if (url.includes('/encomendas/detalhes')) return 'Detalhes dos pedidos';
    if (url.match(/\/encomendas\/[^/]+/)) return 'Detalhes da encomenda';
    if (url.includes('/encomendas')) return 'Visualização de encomendas';
    if (url.includes('/satisfacao')) return 'Satisfação';
    if (url.includes('/gestao-notificacoes')) return 'Notificações';
    if (url.includes('/admin-novos-utilizadores')) return 'Novos utilizadores';
    if (url.includes('/admin-perfis')) return 'Utilizadores e perfis';
    if (url.includes('/admin-configuracoes')) return 'Configurações';
    if (url.includes('/admin-ranking')) return 'Ranking';
    if (url.includes('/finalizar-conta')) return 'Finalizar conta';
    if (url.includes('/nova-encomenda')) return 'Nova Encomenda';
    if (url.includes('/encomendas')) return 'Encomendas';
    if (url.includes('/relatorios')) return 'Relatórios';
    if (url.includes('/dashboard') || url === '/') return 'Dashboard';
    return 'Chef Control';
  }
}
