import { Component, signal, HostListener, OnInit, OnDestroy, AfterViewInit, effect, inject, ViewChild } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { IsActiveMatchOptions, Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
// import { ThemeService } from './services/theme.service';
import { LanguageService } from './services/language.service';
import { IconComponent, IconName } from './ui/icon/icon.component';
import { SnackbarComponent } from './ui/snackbar/snackbar.component';
import { NotificationService } from './services/notification.service';
import { LicenseStatusResponse } from './services/auth.service';
import { OrdersService } from './services/orders.service';
import { ReminderService } from './services/reminder.service';
import { OrderAlertsPopupService } from './services/order-alerts-popup.service';
import { AdminStatsService } from './services/admin-stats.service';
import { LicenseExpiryPopupService } from './services/license-expiry-popup.service';
import { SystemNotificationsService, SystemNotification } from './services/system-notifications.service';
import { LoginPopupOrchestratorService } from './services/login-popup-orchestrator.service';
import { WelcomeOnboardingPopupService } from './services/welcome-onboarding-popup.service';
import { orderDisplayName } from './models/order.model';
import { isPaidOrTrialStatus } from './core/license/license-status';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, SnackbarComponent, DecimalPipe, DatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  /** Destaca «Configurações» também em /admin-configuracoes/logs, /acessos, etc. */
  readonly configNavActiveOptions: IsActiveMatchOptions = {
    paths: 'subset',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored',
  };

  @ViewChild(SnackbarComponent) private snackbar!: SnackbarComponent;
  private notificationService = inject(NotificationService);
  sidebarCollapsed = signal(false);
  sidebarOpen = signal(false);
  notificationsOpen = signal(false);
  userMenuOpen = signal(false);
  encomendasExpanded = signal(true);
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
  licenseExpiryPopup = inject(LicenseExpiryPopupService);
  systemNotifications = inject(SystemNotificationsService);
  welcomeOnboardingPopup = inject(WelcomeOnboardingPopupService);
  loginPopupOrchestrator = inject(LoginPopupOrchestratorService);
  displayName = orderDisplayName;

  /** Nome do ícone para o item Retiradas (evita erro de tipo no template). */
  readonly retiradasIcon: IconName = 'wallet';

  /** Iniciais para avatar no navbar (ex.: «João Silva» → JS). */
  userInitials(): string {
    const name = (this.auth.getDisplayName() || '').trim();
    if (!name) return '?';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  constructor(
    public auth: AuthService,
    // public theme: ThemeService,
    public lang: LanguageService,
    private router: Router
  ) {
    effect(() => {
      this.reminderCount.set(this.reminders.reminders().length);
      this.orderCount.set(this.orders.allOrders().length);
      this.debtCount.set(this.orders.ordersWithPendingBalance().length);
    });
    effect(() => {
      const logged = this.auth.isLoggedIn();
      if (logged) {
        this.systemNotifications.load();
      } else {
        this.systemNotifications.items.set([]);
        this.systemNotifications.closeLoginModal();
      }
    });

    effect(() => {
      const logged = this.auth.isLoggedIn();
      const admin = this.auth.isAdmin();
      if (!logged) {
        this.licenseStatus.set(null);
        return;
      }
      if (admin) {
        this.licenseStatus.set(null);
        return;
      }
      void this.auth.getLicenseStatus().then((s) => {
        this.licenseStatus.set(s);
        this.licenseExpiryPopup.tryShowFromStatus(s);
      });
    });

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      if (this.auth.isLoggedIn() && !this.auth.isAdmin() && !this.isPublicPage()) {
        queueMicrotask(() => this.loginPopupOrchestrator.continueChainAfterShell());
      }
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
        void Promise.all([this.orders.loadOrders(), this.reminders.loadReminders()]).then(() => {
          this.loginPopupOrchestrator.markUserDataReady();
        });
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
  }

  ngOnDestroy(): void {
    if (this.dateTimeInterval) clearInterval(this.dateTimeInterval);
  }

  formatLicenseExpiry(validUntil?: string): string {
    if (!validUntil) return '—';
    return new Date(validUntil).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /** EN: Sidebar license chip text. Pt: Texto do chip da licença na barra lateral. */
  sidebarLicenseBadgeText(s: LicenseStatusResponse | null | undefined): string {
    if (!s) return '';
    if (s.showLicenseExpiryWarning) return 'A expirar';
    if (s.status === 'paid') return 'Activa';
    if (s.status === 'trial') return 'Teste';
    return 'Pendente';
  }

  readonly isPaidOrTrialStatus = isPaidOrTrialStatus;

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleEncomendas(): void {
    this.encomendasExpanded.update(v => !v);
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

  dismissSystemNotification(id: string, event?: Event): void {
    event?.stopPropagation();
    this.systemNotifications.dismiss(id);
  }

  avisoIconName(n: SystemNotification): IconName {
    if (n.category === 'maintenance' || n.type === 'warning' || n.type === 'error') {
      return 'alert-circle';
    }
    if (n.type === 'success') {
      return 'check-circle';
    }
    return 'bell';
  }

  onSystemLoginModalConfirm(): void {
    if (!this.auth.isAdmin()) {
      this.loginPopupOrchestrator.confirmAviso();
    } else {
      this.systemNotifications.confirmLoginModal();
    }
  }

  onWelcomeOnboardingConfirm(): void {
    this.loginPopupOrchestrator.confirmWelcome();
  }

  onLicensePopupClose(): void {
    this.licenseExpiryPopup.close();
  }

  @HostListener('document:click') onDocumentClick(): void {
    this.closeNavDropdowns();
  }

  /** Páginas públicas: sem app-shell (início, login, registo/register, ativação de licença, loja pública). */
  isPublicPage(): boolean {
    const url = this.router.url.split('?')[0];
    if (url === '/' || url === '') return true;
    if (url === '/login' || url === '/register' || url === '/escolher-plano') return true;
    if (url === '/termos' || url === '/privacidade') return true;
    if (url.startsWith('/ativar-licenca')) return true;
    if (url.startsWith('/loja')) return true;
    if (url.startsWith('/recuperar-senha')) return true;
    if (url === '/license-payment') {
      return !this.auth.isLoggedIn();
    }
    return false;
  }

  getPageTitle(): string {
    const url = this.router.url;
    if (url.includes('/admin-configuracoes/sugestoes')) return 'Sugestões';
    if (url.includes('landing-suggestions')) return 'Sugestões';
    if (url.includes('/admin-dashboard')) return 'Painel de administração';
    if (url.includes('/tesouraria')) return 'Tesouraria';
    if (url.includes('/gestao-licencas')) return 'Gestão de licenças';
    if (url.includes('/admin-configuracoes/logs')) return 'Logs de acesso';
    if (url.includes('/admin-configuracoes/acessos')) return 'Gestão de acessos';
    if (url.includes('/admin-encomendas')) return 'Encomendas';
    if (url.includes('/recuperar-senha')) return 'Recuperar senha';
    if (url.includes('/lembretes')) return 'Lembretes';
    if (url.includes('/notificacoes')) return 'Notificações';
    if (url.includes('/despesas-variaveis')) return 'Despesas extras';
    if (url.includes('/gestao-dividas')) return 'Gestão de dívidas';
    if (url.includes('/clientes')) return 'Clientes';
    if (url.includes('/perfil')) return 'Meu perfil';
    if (url.includes('/minha-licenca')) return 'Minha Licença';
    if (url.includes('/encomendas/detalhes')) return 'Detalhes dos pedidos';
    if (url.match(/\/encomendas\/[^/]+/)) return 'Detalhes da encomenda';
    if (url.includes('/encomendas')) return 'Encomendas';
    if (url.includes('/gestao-notificacoes')) return 'Notificações';
    if (url.includes('/admin-novos-utilizadores')) return 'Novos utilizadores';
    if (url.includes('/admin-perfis')) return 'Utilizadores e perfis';
    if (url.includes('/admin-configuracoes')) return 'Configurações';
    if (url.includes('/configuracoes')) return 'Configurações do Meu site';
    if (url.includes('/admin-ranking')) return 'Ranking';
    if (url.includes('/pagamentos')) return 'Pagamentos';
    if (url.includes('/nova-encomenda')) return 'Criar encomenda';
    if (url.includes('/relatorios')) return 'Relatórios';
    if (url.includes('/dashboard')) return 'Dashboard';
    if (url === '/' || url === '') return 'Início';
    if (url.includes('/register')) return 'Criar conta';
    if (url.includes('/escolher-plano')) return 'Escolher plano';
    if (url.includes('/license-payment')) return 'Pagamento da licença';
    return 'Chef Control';
  }
}
