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
import { SatisfactionPromptService } from './services/satisfaction-prompt.service';
import { SatisfactionSurveyModalComponent } from './core/satisfaction/satisfaction-survey-modal.component';
import { orderDisplayName } from './models/order.model';
import { isPaidOrTrialStatus } from './core/license/license-status';
import { PublicPageMotionService } from './public/web-page/public-page-motion.service';
import { LicensePaymentLockService } from './services/license-payment-lock.service';
import { BRAND_ASSETS } from './core/config/brand-assets';
import { BrandWordmarkComponent } from './core/brand/brand-wordmark.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    IconComponent,
    SnackbarComponent,
    SatisfactionSurveyModalComponent,
    BrandWordmarkComponent,
    DecimalPipe,
    DatePipe,
  ],
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
  readonly brand = BRAND_ASSETS;

  @ViewChild(SnackbarComponent) private snackbar!: SnackbarComponent;
  private notificationService = inject(NotificationService);
  sidebarCollapsed = signal(false);
  sidebarOpen = signal(false);
  notificationsOpen = signal(false);
  userMenuOpen = signal(false);
  ordersExpanded = signal(true);
  /** Contagens para a sidebar (lembretes, encomendas, dívidas) */
  reminderCount = signal(0);
  orderCount = signal(0);
  debtCount = signal(0);
  /** Data e hora fixas (definidas ao carregar a página, sem actualização em tempo real). */
  currentDateTime = signal('');

  licenseStatus = signal<LicenseStatusResponse | null>(null);

  private orders = inject(OrdersService);
  private reminders = inject(ReminderService);
  private sessionNotificationsBootstrapped = false;
  orderAlertsPopup = inject(OrderAlertsPopupService);
  adminStats = inject(AdminStatsService);
  licenseExpiryPopup = inject(LicenseExpiryPopupService);
  systemNotifications = inject(SystemNotificationsService);
  welcomeOnboardingPopup = inject(WelcomeOnboardingPopupService);
  satisfactionPrompt = inject(SatisfactionPromptService);
  loginPopupOrchestrator = inject(LoginPopupOrchestratorService);
  private publicPageMotion = inject(PublicPageMotionService);
  private licensePaymentLock = inject(LicensePaymentLockService);
  displayName = orderDisplayName;

  /** Nome do ícone para o item Retiradas (evita erro de tipo no template). */
  readonly withdrawalsIcon: IconName = 'wallet';

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
        if (!this.sessionNotificationsBootstrapped) {
          this.sessionNotificationsBootstrapped = true;
          const triggerLoginChain = this.auth.isAdmin() || this.auth.isAccountFinalized();
          this.systemNotifications.load({ triggerLoginChain });
        }
      } else {
        this.sessionNotificationsBootstrapped = false;
        this.systemNotifications.resetForLogout();
        this.loginPopupOrchestrator.reset();
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
      void this.auth.getLicenseStatus().then((s) => this.licenseStatus.set(s));
    });

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      if (this.licensePaymentLock.active()) {
        const path = this.router.url.split('?')[0];
        if (!this.licensePaymentLock.isAllowedWhenLocked(path)) {
          void this.router.navigate(['/license-payment'], { queryParams: { renewed: '1' } });
        }
        return;
      }
      if (this.auth.isLoggedIn() && !this.auth.isAdmin() && !this.isPublicPage()) {
        queueMicrotask(() => this.loginPopupOrchestrator.continueChainAfterShell());
      }
    });

    effect(() => {
      const step = this.loginPopupOrchestrator.activeStep();
      const lock = step === 'welcome' || step === 'aviso';
      document.body.classList.toggle('login-popup-scroll-lock', lock);
    });
  }

  private dateTimeInterval: ReturnType<typeof setInterval> | null = null;
  private paymentStatusPollTimer: ReturnType<typeof setInterval> | null = null;
  private trackingPendingPayment = false;

  showPaymentValidationBanner(): boolean {
    if (this.auth.isAdmin() || !this.auth.isLoggedIn()) return false;
    if (!this.auth.isAccountFinalized()) return false;
    return (
      this.auth.pendingPaymentValidation() ||
      this.licenseStatus()?.pendingPaymentValidation === true
    );
  }

  ngAfterViewInit(): void {
    if (this.snackbar) this.notificationService.setSnackbar(this.snackbar);
  }

  ngOnInit(): void {
    this.publicPageMotion.bindPublicRouteTransitions(this.router);
    if (this.auth.isLoggedIn()) {
      if (this.auth.isAdmin()) {
        this.adminStats.loadStats();
      } else if (!this.auth.isAccountFinalized()) {
        const path = this.router.url.split('?')[0];
        if (!this.licensePaymentLock.isAllowedWhenLocked(path)) {
          void this.router.navigate(['/license-payment'], { queryParams: { renewed: '1' }, replaceUrl: true });
        }
      } else {
        void Promise.all([this.orders.loadOrders(), this.reminders.loadReminders()]).then(() => {
          this.loginPopupOrchestrator.markUserDataReady();
        });
        this.trackingPendingPayment = this.auth.pendingPaymentValidation();
        this.startPaymentStatusPoll();
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
    this.stopPaymentStatusPoll();
    document.body.classList.remove('login-popup-scroll-lock');
  }

  private startPaymentStatusPoll(): void {
    if (this.auth.isAdmin() || !this.auth.isLoggedIn()) return;
    if (this.paymentStatusPollTimer) return;
    void this.pollPaymentStatus();
    this.paymentStatusPollTimer = setInterval(() => void this.pollPaymentStatus(), 60_000);
  }

  private stopPaymentStatusPoll(): void {
    if (this.paymentStatusPollTimer) {
      clearInterval(this.paymentStatusPollTimer);
      this.paymentStatusPollTimer = null;
    }
  }

  private async pollPaymentStatus(): Promise<void> {
    if (this.auth.isAdmin() || !this.auth.isLoggedIn()) return;
    const st = await this.auth.checkMpesaPaymentStatus();
    if (st.hasRejected) {
      this.trackingPendingPayment = false;
      const reason =
        st.rejectionReason?.trim() ||
        'O pagamento não foi confirmado. Pode efectuar uma nova transferência.';
      this.notificationService.showWarning(
        `Pagamento não confirmado: ${reason}`,
        10_000
      );
      await this.auth.refreshProfile();
      const lic = await this.auth.getLicenseStatus();
      this.licenseStatus.set(lic);
      if (!this.auth.isAccountFinalized()) {
        void this.router.navigate(['/license-payment'], { queryParams: { rejected: '1' } });
      }
      return;
    }
    if (st.hasPending) {
      this.trackingPendingPayment = true;
      if (!this.auth.pendingPaymentValidation()) {
        await this.auth.refreshProfile();
        const lic = await this.auth.getLicenseStatus();
        this.licenseStatus.set(lic);
      }
      return;
    }
    if (this.trackingPendingPayment && !st.hasPending) {
      this.trackingPendingPayment = false;
      await this.auth.refreshProfile();
      const lic = await this.auth.getLicenseStatus();
      this.licenseStatus.set(lic);
      if (lic?.accountFinalized) {
        this.notificationService.showSuccess('Pagamento confirmado. A sua licença foi actualizada.', 8000);
      }
    }
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

  onSidebarToggleClick(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 900 && this.sidebarOpen()) {
      this.closeSidebar();
      return;
    }
    this.toggleSidebar();
  }

  toggleOrders(): void {
    this.ordersExpanded.update(v => !v);
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

  /** Bloqueia cliques no fundo escuro — o popup só fecha pelos botões. */
  onWelcomeOverlayClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onLicensePopupClose(): void {
    this.licenseExpiryPopup.close();
  }

  async onLogout(): Promise<void> {
    this.closeNavDropdowns();
    this.satisfactionPrompt.reset();
    this.auth.logout();
  }

  @HostListener('document:click') onDocumentClick(): void {
    this.closeNavDropdowns();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onDocumentEscape(event: KeyboardEvent): void {
    if (this.loginPopupOrchestrator.activeStep() === 'welcome') {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /** Páginas públicas: sem app-shell (início, login, registo/register, ativação de licença, loja pública). */
  isPublicPage(): boolean {
    const url = this.router.url.split('?')[0];
    if (url === '/' || url === '') return true;
    if (url === '/login' || url === '/register' || url === '/choose-plan') return true;
    if (url === '/termos' || url === '/privacidade') return true;
    if (url.startsWith('/activate-license')) return true;
    if (url.startsWith('/store') || url.startsWith('/loja')) return true;
    if (url.startsWith('/recover-password')) return true;
    if (url === '/license-payment') {
      if (!this.auth.isLoggedIn()) return true;
      if (this.auth.isAccountFinalized()) return true;
      return true;
    }
    return false;
  }

  getPageTitle(): string {
    const url = this.router.url;
    if (url.includes('/admin-settings/suggestions')) return 'Sugestões';
    if (url.includes('landing-suggestions')) return 'Sugestões';
    if (url.includes('/admin-dashboard')) return 'Painel de administração';
    if (url.includes('/treasury')) return 'Tesouraria';
    if (url.includes('/license-management')) return 'Gestão de licenças';
    if (url.includes('/admin-settings/logs')) return 'Logs de acesso';
    if (url.includes('/admin-settings/access')) return 'Gestão de acessos';
    if (url.includes('/admin-orders')) return 'Encomendas';
    if (url.includes('/recover-password')) return 'Recuperar senha';
    if (url.includes('/reminders')) return 'Lembretes';
    if (url.includes('/notifications')) return 'Comunicado';
    if (url.includes('/variable-expenses/consultar')) return 'Consultar despesas';
    if (url.includes('/variable-expenses')) return 'Registar despesas';
    if (url.includes('/debts')) return 'Gestão de dívidas';
    if (url.includes('/clients')) return 'Clientes';
    if (url.includes('/profile')) return 'Meu perfil';
    if (url.includes('/my-license')) return 'Minha Licença';
    if (url.includes('/orders/details')) return 'Detalhes dos pedidos';
    if (url.match(/\/orders\/[^/]+/) && !url.includes('/orders/details')) return 'Detalhes da encomenda';
    if (url.includes('/orders')) return 'Encomendas';
    if (url.includes('/notification-management')) return 'Notificações';
    if (url.includes('/admin-new-users')) return 'Novos utilizadores';
    if (url.includes('/admin-profiles')) return 'Utilizadores e perfis';
    if (url.includes('/admin-settings')) return 'Configurações';
    if (url.includes('/settings')) return 'Configurações do Meu site';
    if (url.includes('/admin-ranking')) return 'Ranking';
    if (url.includes('/satisfaction')) return 'Satisfação';
    if (url.includes('/pagamentos')) return 'Pagamentos';
    if (url.includes('/new-order')) return 'Criar encomenda';
    if (url.includes('/reports')) return 'Relatórios';
    if (url.includes('/dashboard')) return 'Dashboard';
    if (url === '/' || url === '') return 'Início';
    if (url.includes('/register')) return 'Criar conta';
    if (url.includes('/choose-plan')) return 'Escolher plano';
    if (url.includes('/license-payment')) return 'Pagamento da licença';
    return 'Flow Cakes';
  }
}
