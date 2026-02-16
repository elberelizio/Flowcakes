import { Component, signal, HostListener, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';
import { IconComponent } from './components/icons/icons.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  sidebarCollapsed = signal(false);
  sidebarOpen = signal(false);
  notificationsOpen = signal(false);
  userMenuOpen = signal(false);
  licenseCode = signal('');
  licenseCodeError = signal('');
  /** Data e hora fixas (definidas ao carregar a página, sem actualização em tempo real). */
  currentDateTime = signal('');

  constructor(
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const now = new Date();
    this.currentDateTime.set(
      now.toLocaleDateString('pt-MZ', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' · ' +
        now.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })
    );
  }

  async submitLicenseCode(code: string): Promise<void> {
    const c = (code || this.licenseCode()).trim().toUpperCase();
    this.licenseCodeError.set('');
    if (!c) {
      this.licenseCodeError.set('Introduza o código da licença (máx. 9 caracteres).');
      return;
    }
    const ok = await this.auth.validateLicenseCode(c);
    if (ok) {
      this.licenseCode.set('');
    } else {
      this.licenseCodeError.set('Código inválido. O código está associado ao seu NUIT e foi enviado após o pagamento.');
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
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

  /** Páginas públicas: sem app-shell (login e link de ativação de licença). */
  isPublicPage(): boolean {
    const url = this.router.url;
    return url === '/login' || url.startsWith('/login?') || url.includes('/ativar-licenca');
  }

  getPageTitle(): string {
    const url = this.router.url;
    if (url.includes('/gestao-licencas')) return 'Gestão de licenças';
    if (url.includes('/encomendas')) return 'Encomendas';
    if (url.includes('/satisfacao')) return 'Satisfação';
    if (url.includes('/gestao-notificacoes')) return 'Notificações';
    if (url.includes('/finalizar-conta')) return 'Finalizar conta';
    if (url.includes('/nova-encomenda')) return 'Nova Encomenda';
    if (url.includes('/encomendas')) return 'Encomendas';
    if (url.includes('/relatorios')) return 'Relatórios';
    if (url.includes('/perfil')) return 'Perfil';
    if (url.includes('/dashboard') || url === '/') return 'Dashboard';
    return 'Chef Control';
  }
}
