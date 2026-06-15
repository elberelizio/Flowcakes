import { Injectable, signal, computed, Injector } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { API_URL } from '../core/config/api.config';
import { OrderAlertsPopupService } from './order-alerts-popup.service';
import { LicenseExpiryPopupService } from './license-expiry-popup.service';
import { LoginPopupOrchestratorService } from './login-popup-orchestrator.service';
import { SatisfactionPromptService } from './satisfaction-prompt.service';
import { AdminLoginSummaryPopupService } from '../dashboard-admin/services/admin-login-summary-popup.service';

/** Só dígitos; se começar por 258, usa os 9 dígitos nacionais (para pedidos à API). */
export function normalizeMzPhoneDigits(raw: string): string {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (d.startsWith('258')) {
    d = d.slice(3);
  }
  return d.length > 9 ? d.slice(0, 9) : d;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  fullName: string;
  province: string;
  email?: string;
}

/** Resposta da API (utilizador sem senha) */
export interface UserResponse {
  id: string;
  phone: string;
  fullName?: string;
  documentType?: string;
  documentNumber?: string;
  province?: string;
  email?: string;
  licenseStatus?: string;
  accountFinalized?: boolean;
  licenseRestrictedCode?: string;
  admin?: boolean;
  licenseDaysRemaining?: number;
  showLicenseExpiryWarning?: boolean;
  showWelcomeOnboarding?: boolean;
  showPaymentRejectionPopup?: boolean;
  paymentRejectionReason?: string;
  supportWhatsapp?: string;
  pendingPaymentValidation?: boolean;
  createdAt?: string;
}

/** Utilizador atual (apenas em memória; sessão no backend via cookie HttpOnly) */
export interface CurrentUser {
  id: string;
  phone: string;
  fullName?: string;
  documentType?: string;
  documentNumber?: string;
  province?: string;
  email?: string;
  accountFinalized?: boolean;
  licenseRestrictedCode?: string;
  admin?: boolean;
  licenseDaysRemaining?: number;
  showLicenseExpiryWarning?: boolean;
  showWelcomeOnboarding?: boolean;
  showPaymentRejectionPopup?: boolean;
  paymentRejectionReason?: string;
  supportWhatsapp?: string;
  pendingPaymentValidation?: boolean;
  createdAt?: string;
}

/** Resposta do registo: user + mensagem enviada por SMS/WhatsApp */
export interface RegisterResponse {
  user: UserResponse;
  messageSent: boolean;
  message?: string;
}

export interface LicenseStatusResponse {
  status: string;
  amount: number;
  eMolaPhone: string;
  mpesaPhone?: string;
  supportWhatsapp?: string;
  licenseToken?: string;
  accountFinalized: boolean;
  validUntil?: string; // ISO date
  daysRemaining?: number;
  showLicenseExpiryWarning?: boolean;
  lastPaymentRejected?: boolean;
  paymentRejectionReason?: string;
  paymentRejectedAt?: string;
  pendingPaymentValidation?: boolean;
}

export interface LicensePaymentRow {
  id: string;
  createdAt?: string;
  amount: number;
  durationMonths: number;
  /** Dias de validade (durationMonths × 30). */
  durationDays?: number;
  eMolaTransactionId: string;
  receiptNumber?: string;
  validUntilAfter?: string;
  paymentStatus?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<CurrentUser | null>(null);
  private initialized = false;
  private sessionInitPromise: Promise<void> | null = null;
  private static readonly SESSION_CHECK_TIMEOUT_MS = 4000;

  constructor(
    private http: HttpClient,
    private router: Router,
    private injector: Injector,
    private orderAlertsPopup: OrderAlertsPopupService,
    private licenseExpiryPopup: LicenseExpiryPopupService,
    private adminLoginSummaryPopup: AdminLoginSummaryPopupService,
  ) {}

  /** Verifica sessão no backend (cookie). Chamado no arranque da app. Nenhum dado guardado no browser. */
  initSession(): Promise<void> {
    if (this.initialized) return Promise.resolve();
    if (this.sessionInitPromise) return this.sessionInitPromise;

    this.sessionInitPromise = firstValueFrom(
      this.http.get<UserResponse>(`${API_URL}/auth/me`).pipe(
        timeout(AuthService.SESSION_CHECK_TIMEOUT_MS),
        catchError((err) => {
          const status = err?.status;
          const isExpected =
            status === 401 ||
            err?.name === 'TimeoutError' ||
            (status === 200 && /api$/i.test(API_URL) && typeof window !== 'undefined' && !window.location.hostname.includes('localhost'));
          if (!isExpected) {
            console.warn('Sessão: API indisponível.', API_URL, status ?? err?.name);
          }
          return of(null);
        }),
      ),
    )
      .then((user) => {
        this.currentUser.set(user ? this.toCurrentUser(user) : null);
      })
      .finally(() => {
        this.initialized = true;
      });

    return this.sessionInitPromise;
  }

  /** Aguarda a verificação inicial de sessão (ex.: guards de rotas protegidas). */
  whenInitialized(): Promise<void> {
    return this.sessionInitPromise ?? Promise.resolve();
  }

  /** Chamar quando precisar de saber se a sessão já foi verificada (ex.: guards) */
  isInitialized(): boolean {
    return this.initialized;
  }

  private toCurrentUser(u: UserResponse): CurrentUser {
    return {
      id: u.id,
      phone: u.phone,
      fullName: u.fullName,
      documentType: u.documentType,
      documentNumber: u.documentNumber,
      province: u.province,
      email: u.email,
      accountFinalized: u.accountFinalized ?? false,
      licenseRestrictedCode: u.licenseRestrictedCode,
      admin: u.admin ?? false,
      licenseDaysRemaining: u.licenseDaysRemaining,
      showLicenseExpiryWarning: u.showLicenseExpiryWarning,
      showWelcomeOnboarding: u.showWelcomeOnboarding ?? false,
      showPaymentRejectionPopup: u.showPaymentRejectionPopup === true,
      paymentRejectionReason: u.paymentRejectionReason,
      supportWhatsapp: u.supportWhatsapp,
      pendingPaymentValidation: u.pendingPaymentValidation === true,
      createdAt: u.createdAt,
    };
  }

  isLoggedIn = computed(() => !!this.currentUser());

  /** Extrai JSON do corpo de erro (HttpClient por vezes devolve string ou Blob). */
  private static loginErrorPayload(err: unknown): {
    message?: string;
    code?: string;
    validUntil?: string;
    supportWhatsapp?: string;
    remainingAttempts?: number;
  } {
    if (!(err instanceof HttpErrorResponse)) {
      return {};
    }
    const raw = err.error;
    if (raw == null) {
      return {};
    }
    if (typeof raw === 'object' && !Array.isArray(raw)) {
      const o = raw as Record<string, unknown>;
      const remaining = o['remainingAttempts'];
      return {
        message: typeof o['message'] === 'string' ? o['message'] : undefined,
        code: typeof o['code'] === 'string' ? o['code'] : undefined,
        validUntil: typeof o['validUntil'] === 'string' ? o['validUntil'] : undefined,
        remainingAttempts: typeof remaining === 'number' ? remaining : undefined,
      };
    }
    if (typeof raw === 'string') {
      try {
        const o = JSON.parse(raw) as Record<string, unknown>;
        const remaining = o['remainingAttempts'];
        const wa = o['supportWhatsapp'];
        return {
          message: typeof o['message'] === 'string' ? o['message'] : undefined,
          code: typeof o['code'] === 'string' ? o['code'] : undefined,
          validUntil: typeof o['validUntil'] === 'string' ? o['validUntil'] : undefined,
          supportWhatsapp: typeof wa === 'string' ? wa : undefined,
          remainingAttempts: typeof remaining === 'number' ? remaining : undefined,
        };
      } catch {
        return { message: raw };
      }
    }
    return {};
  }

  /** Resultado do login: sucesso com user, ou falha (incl. licença inactiva com detalhes no ecrã de login). */
  async login(
    phone: string,
    password: string
  ): Promise<
    | { ok: true; user: UserResponse }
    | {
        ok: false;
        code: 'ACCOUNT_NOT_FOUND' | 'INVALID_CREDENTIALS' | 'ACCOUNT_BLOCKED';
        message?: string;
        remainingAttempts?: number;
      }
  > {
    const normalizedPhone = normalizeMzPhoneDigits(phone);
    if (!normalizedPhone || normalizedPhone.length !== 9) {
      return { ok: false, code: 'INVALID_CREDENTIALS' };
    }
    try {
      const user = await firstValueFrom(
        this.http.post<UserResponse>(`${API_URL}/auth/login`, { phone: normalizedPhone, password })
      );
      if (user) {
        this.currentUser.set(this.toCurrentUser(user));
        try {
          sessionStorage.removeItem('chefcontrol_login_summary_dismissed');
          sessionStorage.removeItem('chefcontrol_admin_login_summary_consumed');
        } catch (_) {}
        return { ok: true, user };
      }
      return { ok: false, code: 'INVALID_CREDENTIALS' };
    } catch (e: unknown) {
      const httpErr = e instanceof HttpErrorResponse ? e : null;
      const status = httpErr?.status ?? 0;
      const body = AuthService.loginErrorPayload(e);
      const msg = body.message;
      if (status === 403 && body.code === 'ACCOUNT_BLOCKED') {
        return { ok: false, code: 'ACCOUNT_BLOCKED', message: msg };
      }
      if (status === 403) {
        return { ok: false, code: 'INVALID_CREDENTIALS', message: msg };
      }
      if (status === 400 && body.code === 'INVALID_PASSWORD') {
        return {
          ok: false,
          code: 'INVALID_CREDENTIALS',
          message: msg,
          remainingAttempts: body.remainingAttempts,
        };
      }
      // EN: Login 401 body is JSON `{ "message": "..." }` from GlobalExceptionHandler (ResponseStatusException).
      // PT: O 401 do login traz JSON com `message`; distingue «Conta não encontrada» de «Telefone ou senha incorretos» (ver AuthService no backend).
      if (status === 401) {
        const raw401 = (body.message ?? '').toLowerCase();
        if (
          raw401.includes('conta não encontrada') ||
          raw401.includes('conta nao encontrada') ||
          raw401.includes('não encontrada') ||
          raw401.includes('nao encontrada')
        ) {
          return { ok: false, code: 'ACCOUNT_NOT_FOUND', message: msg };
        }
        return { ok: false, code: 'INVALID_CREDENTIALS', message: msg };
      }
      if (status === 404) {
        const rawMsg = (body.message ?? '').toLowerCase();
        const looksLikeMissingUser =
          rawMsg.includes('conta não encontrada') ||
          rawMsg.includes('conta nao encontrada') ||
          rawMsg.includes('utilizador não encontrado') ||
          rawMsg.includes('utilizador nao encontrado');
        if (looksLikeMissingUser) {
          return { ok: false, code: 'ACCOUNT_NOT_FOUND' };
        }
        return {
          ok: false,
          code: 'INVALID_CREDENTIALS',
          message:
            msg?.trim() ||
            `O servidor respondeu 404 ao login (normalmente não é "conta inexistente" — isso seria 401). Confirme que o backend Flow Cakes está activo na mesma URL que o front (por omissão porta 8081). Teste no browser: ${API_URL}/public/health — deve devolver JSON com "chef-control-backend". Se usar a porta 8080: localStorage.setItem('chefcontrol_api_base_url','http://localhost:8080/api'); location.reload()`,
        };
      }
      if (status === 405) {
        return {
          ok: false,
          code: 'INVALID_CREDENTIALS',
          message:
            'A API não está configurada no Vercel. Defina CHEFCONTROL_API_BACKEND_ORIGIN com a URL pública do backend Spring Boot e faça redeploy.',
        };
      }
      if (status === 0) {
        return {
          ok: false,
          code: 'INVALID_CREDENTIALS',
          message: 'Sem ligação ao servidor. Confirme que o backend está a correr e a porta na API.',
        };
      }
      return { ok: false, code: 'INVALID_CREDENTIALS', message: msg };
    }
  }

  register(data: RegisterRequest): Promise<{ ok: true; data: RegisterResponse } | { ok: false; message: string }> {
    const phone = normalizeMzPhoneDigits(data.phone);
    return this.http
      .post<RegisterResponse>(`${API_URL}/auth/register`, {
        phone,
        password: data.password,
        fullName: data.fullName,
        province: data.province,
        email: data.email || undefined,
      })
      .toPromise()
      .then((res) => {
        if (res?.user) {
          this.currentUser.set(this.toCurrentUser(res.user));
          return { ok: true as const, data: res };
        }
        return { ok: false as const, message: 'Resposta inválida' };
      })
      .catch((err): { ok: false; message: string } => ({
        ok: false,
        message: err?.error?.message || err?.message || 'Erro ao criar conta',
      }));
  }

  /** Termina sessão no servidor e limpa estado local; não navega (ex.: guards). */
  endSessionWithoutNavigation(): void {
    this.http.post(`${API_URL}/auth/logout`, {}).subscribe();
    this.currentUser.set(null);
    this.orderAlertsPopup.resetForNextLogin();
    this.licenseExpiryPopup.resetForNextLogin();
    this.injector.get(LoginPopupOrchestratorService).reset();
    this.injector.get(SatisfactionPromptService).reset();
    this.adminLoginSummaryPopup.resetForNextLogin();
    try {
      sessionStorage.removeItem('chefcontrol_login_summary_dismissed');
    } catch (_) {}
  }

  logout(): void {
    this.endSessionWithoutNavigation();
    this.router.navigate(['/login']);
  }

  getPhone(): string | null {
    return this.currentUser()?.phone ?? null;
  }

  /** Nome para exibir no navbar: nome completo ou telefone. */
  getDisplayName(): string {
    const u = this.currentUser();
    if (!u) return '';
    const name = (u.fullName ?? '').trim();
    return name || u.phone || 'Utilizador';
  }

  getCurrentUser(): CurrentUser | null {
    return this.currentUser();
  }

  getUserId(): string | null {
    return this.currentUser()?.id ?? null;
  }

  changePassword(currentPassword: string, newPassword: string): Promise<{ ok: boolean; message?: string }> {
    return this.http
      .post<void>(`${API_URL}/auth/change-password`, { currentPassword, newPassword })
      .toPromise()
      .then(() => ({ ok: true }))
      .catch((err) => ({
        ok: false,
        message: err?.error?.message || err?.message || 'Erro ao alterar senha',
      }));
  }

  refreshProfile(): Promise<CurrentUser | null> {
    return this.http
      .get<UserResponse>(`${API_URL}/auth/profile`)
      .toPromise()
      .then((user) => {
        if (user) {
          const cur = this.toCurrentUser(user);
          this.currentUser.set(cur);
          return cur;
        }
        return null;
      })
      .catch(() => null);
  }

  /** Altera contacto de login (senha actual + novo número não registado). */
  changePhone(
    currentPassword: string,
    newPhone: string
  ): Promise<{
    ok: boolean;
    message?: string;
    code?: string;
    remainingAttempts?: number;
    forceLogout?: boolean;
  }> {
    const normalized = normalizeMzPhoneDigits(newPhone);
    return this.http
      .put<UserResponse>(`${API_URL}/auth/change-phone`, {
        currentPassword,
        newPhone: normalized,
      })
      .toPromise()
      .then((user) => {
        if (user) {
          this.currentUser.set(this.toCurrentUser(user));
        }
        return { ok: true };
      })
      .catch((err) => {
        const body = err?.error ?? {};
        const code = typeof body.code === 'string' ? body.code : undefined;
        const message = body.message || err?.message || 'Erro ao alterar contacto';
        if (code === 'ACCOUNT_BLOCKED' || (err?.status === 403 && String(message).toLowerCase().includes('bloqueada'))) {
          return { ok: false, message, code: 'ACCOUNT_BLOCKED', forceLogout: true };
        }
        return {
          ok: false,
          message,
          code,
          remainingAttempts:
            typeof body.remainingAttempts === 'number' ? body.remainingAttempts : undefined,
          forceLogout: code === 'ACCOUNT_BLOCKED',
        };
      });
  }

  /** Actualiza os dados do perfil (nome, documento, província, email). */
  updateProfile(data: {
    fullName?: string;
    documentType?: string;
    documentNumber?: string;
    province?: string;
    email?: string;
  }): Promise<{ ok: boolean; message?: string }> {
    return this.http
      .put<UserResponse>(`${API_URL}/auth/profile`, data)
      .toPromise()
      .then((user) => {
        if (user) {
          const cur = this.toCurrentUser(user);
          this.currentUser.set(cur);
        }
        return { ok: true };
      })
      .catch((err) => ({
        ok: false,
        message: err?.error?.message || err?.message || 'Erro ao guardar',
      }));
  }

  isAccountFinalized(): boolean {
    return this.currentUser()?.accountFinalized ?? false;
  }

  pendingPaymentValidation(): boolean {
    return this.currentUser()?.pendingPaymentValidation === true;
  }

  licenseRestrictedCode(): string | undefined {
    return this.currentUser()?.licenseRestrictedCode;
  }

  shouldShowPaymentRejectionPopup(): boolean {
    return this.currentUser()?.showPaymentRejectionPopup === true;
  }

  paymentRejectionReason(): string | undefined {
    return this.currentUser()?.paymentRejectionReason?.trim() || undefined;
  }

  supportWhatsapp(): string {
    const wa = this.currentUser()?.supportWhatsapp?.replace(/\D/g, '') ?? '';
    return wa.length >= 9 ? wa : '871964887';
  }

  clearPaymentRejectionPopupFlag(): void {
    const u = this.currentUser();
    if (u?.showPaymentRejectionPopup) {
      this.currentUser.set({ ...u, showPaymentRejectionPopup: false });
    }
  }

  /** Actualiza estado de acesso após aprovação da licença (poll ou recibo). */
  applyLicenseAccessFromStatus(status: LicenseStatusResponse | null): boolean {
    if (!status?.accountFinalized) return false;
    const u = this.currentUser();
    if (!u) return status.accountFinalized;
    this.currentUser.set({
      ...u,
      accountFinalized: true,
      licenseRestrictedCode: undefined,
      pendingPaymentValidation: status.pendingPaymentValidation === true,
    });
    return true;
  }

  isAdmin(): boolean {
    return this.currentUser()?.admin ?? false;
  }

  showWelcomeOnboarding(): boolean {
    return this.currentUser()?.showWelcomeOnboarding === true;
  }

  clearWelcomeOnboarding(): void {
    const u = this.currentUser();
    if (u?.showWelcomeOnboarding) {
      this.currentUser.set({ ...u, showWelcomeOnboarding: false });
    }
  }

  getLicenseStatus(): Promise<LicenseStatusResponse | null> {
    return this.http
      .get<LicenseStatusResponse>(`${API_URL}/auth/license-status`)
      .toPromise()
      .then((res) => res ?? null)
      .catch(() => null);
  }

  listLicensePayments(): Promise<LicensePaymentRow[]> {
    return this.http
      .get<LicensePaymentRow[]>(`${API_URL}/auth/license-payments`)
      .toPromise()
      .then((rows) => rows ?? []);
  }

  /** Verifica disponibilidade de pagamento no backend (`simulated` = modo simulado, sem cobrança real). */
  checkMpesaAvailable(): Promise<{
    available: boolean;
    environment: string;
    configured?: boolean;
    hint?: string;
    simulated?: boolean;
    manualTransfer?: boolean;
    mpesaDestinationPhone?: string;
    emolaDestinationPhone?: string;
    supportWhatsapp?: string;
    licenseAmountMzn?: number;
  }> {
    return this.http
      .get<{
        available: boolean;
        environment: string;
        configured?: boolean;
        hint?: string;
        simulated?: boolean;
        manualTransfer?: boolean;
        mpesaDestinationPhone?: string;
        emolaDestinationPhone?: string;
        supportWhatsapp?: string;
        licenseAmountMzn?: number;
      }>(`${API_URL}/mpesa/available`)
      .toPromise()
      .then((r) => r ?? { available: false, environment: '' })
      .catch(() => ({
        available: false,
        environment: '',
        hint: 'Não foi possível contactar o servidor. Verifique se o backend está a correr.',
      }));
  }

  /** Inicia pagamento de licença (sessão autenticada). */
  initiateMpesaPayment(
    phone: string,
    months: number,
    simulatedChannel: 'mpesa' | 'emola' = 'mpesa',
    transferReference?: string
  ): Promise<{
    success: boolean;
    message: string;
    paymentId?: string;
    simulated?: boolean;
    simulatedChannel?: string;
  }> {
    return this.http
      .post<{
        success: boolean;
        message: string;
        paymentId?: string;
        simulated?: boolean;
        simulatedChannel?: string;
      }>(`${API_URL}/mpesa/pay`, {
        phone,
        months,
        simulatedChannel,
        transferReference: transferReference?.trim() || undefined,
      })
      .toPromise()
      .then((r) => r ?? { success: false, message: 'Sem resposta do servidor.' })
      .catch((err) => ({
        success: false,
        message: err?.error?.message || err?.message || 'Erro ao iniciar o pagamento.',
      }));
  }

  /** Verifica estado de pagamento pendente. */
  checkMpesaPaymentStatus(): Promise<{
    hasPending: boolean;
    hasRejected?: boolean;
    completed?: boolean;
    pendingPaymentValidation?: boolean;
    status?: string;
    amount?: number;
    rejectionReason?: string;
    rejectedAt?: string;
    supportWhatsapp?: string;
  }> {
    return this.http
      .get<{
        hasPending: boolean;
        hasRejected?: boolean;
        completed?: boolean;
        pendingPaymentValidation?: boolean;
        status?: string;
        amount?: number;
        rejectionReason?: string;
        rejectedAt?: string;
        supportWhatsapp?: string;
      }>(`${API_URL}/mpesa/status`)
      .toPromise()
      .then((r) => r ?? { hasPending: false })
      .catch(() => ({ hasPending: false }));
  }
}
