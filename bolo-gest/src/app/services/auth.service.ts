import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { API_URL } from '../core/config/api.config';
import { OrderAlertsPopupService } from './order-alerts-popup.service';
import { LicenseExpiryPopupService } from './license-expiry-popup.service';

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

/** Corpo 403 do login quando a licença não permite sessão. */
export interface LoginLicenseBlock {
  code: string;
  validUntil?: string;
  message?: string;
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
  admin?: boolean;
  licenseDaysRemaining?: number;
  showLicenseExpiryWarning?: boolean;
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
  admin?: boolean;
  licenseDaysRemaining?: number;
  showLicenseExpiryWarning?: boolean;
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
  licenseToken?: string;
  accountFinalized: boolean;
  validUntil?: string; // ISO date
  daysRemaining?: number;
  showLicenseExpiryWarning?: boolean;
}

export interface LicensePaymentRow {
  id: string;
  createdAt?: string;
  amount: number;
  durationMonths: number;
  eMolaTransactionId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<CurrentUser | null>(null);
  private initialized = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private orderAlertsPopup: OrderAlertsPopupService,
    private licenseExpiryPopup: LicenseExpiryPopupService
  ) {}

  /** Verifica sessão no backend (cookie). Chamado no arranque da app. Nenhum dado guardado no browser. */
  initSession(): Promise<void> {
    if (this.initialized) return Promise.resolve();
    return this.http
      .get<UserResponse>(`${API_URL}/auth/me`)
      .toPromise()
      .then((user) => {
        this.currentUser.set(user ? this.toCurrentUser(user) : null);
        this.initialized = true;
      })
      .catch((err) => {
        // 401 = sem cookie de sessão; é o comportamento normal antes do login
        if (err?.status !== 401) {
          console.error('Erro ao verificar sessão:', err);
        }
        this.currentUser.set(null);
        this.initialized = true;
      });
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
      admin: u.admin ?? false,
      licenseDaysRemaining: u.licenseDaysRemaining,
      showLicenseExpiryWarning: u.showLicenseExpiryWarning,
    };
  }

  isLoggedIn = computed(() => !!this.currentUser());

  /** Extrai JSON do corpo de erro (HttpClient por vezes devolve string ou Blob). */
  private static loginErrorPayload(err: unknown): {
    message?: string;
    code?: string;
    validUntil?: string;
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
      return {
        message: typeof o['message'] === 'string' ? o['message'] : undefined,
        code: typeof o['code'] === 'string' ? o['code'] : undefined,
        validUntil: typeof o['validUntil'] === 'string' ? o['validUntil'] : undefined,
      };
    }
    if (typeof raw === 'string') {
      try {
        const o = JSON.parse(raw) as Record<string, unknown>;
        return {
          message: typeof o['message'] === 'string' ? o['message'] : undefined,
          code: typeof o['code'] === 'string' ? o['code'] : undefined,
          validUntil: typeof o['validUntil'] === 'string' ? o['validUntil'] : undefined,
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
        code: 'ACCOUNT_NOT_FOUND' | 'INVALID_CREDENTIALS' | 'LICENSE_BLOCKED';
        message?: string;
        licenseBlock?: LoginLicenseBlock;
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
        } catch (_) {}
        return { ok: true, user };
      }
      return { ok: false, code: 'INVALID_CREDENTIALS' };
    } catch (e: unknown) {
      const httpErr = e instanceof HttpErrorResponse ? e : null;
      const status = httpErr?.status ?? 0;
      const body = AuthService.loginErrorPayload(e);
      const msg = body.message;
      if (status === 403 && typeof body.code === 'string' && body.code.startsWith('LICENSE_')) {
        return {
          ok: false,
          code: 'LICENSE_BLOCKED',
          message: msg,
          licenseBlock: {
            code: body.code,
            validUntil: body.validUntil,
            message: msg,
          },
        };
      }
      if (status === 403) {
        return { ok: false, code: 'INVALID_CREDENTIALS', message: msg };
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
            `O servidor respondeu 404 ao login (normalmente não é "conta inexistente" — isso seria 401). Confirme que o backend ChefControl está activo na mesma URL que o front (por omissão porta 8081). Teste no browser: ${API_URL}/public/health — deve devolver JSON com "chef-control-backend". Se usar a porta 8080: localStorage.setItem('chefcontrol_api_base_url','http://localhost:8080/api'); location.reload()`,
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

  /** Pagamento de licença sem sessão (contacto e senha da conta). */
  payMpesaWithCredentials(
    loginPhone: string,
    password: string,
    mpesaPhone: string,
    months: number,
    simulatedChannel: 'mpesa' | 'emola' = 'mpesa'
  ): Promise<{
    success: boolean;
    message: string;
    paymentId?: string;
    simulated?: boolean;
    simulatedChannel?: string;
  }> {
    const normalizedLogin = normalizeMzPhoneDigits(loginPhone);
    return this.http
      .post<{
        success: boolean;
        message: string;
        paymentId?: string;
        simulated?: boolean;
        simulatedChannel?: string;
      }>(`${API_URL}/mpesa/pay-with-credentials`, {
        loginPhone: normalizedLogin,
        password,
        mpesaPhone,
        months,
        simulatedChannel,
      })
      .toPromise()
      .then((r) => r ?? { success: false, message: 'Sem resposta do servidor.' })
      .catch((err) => ({
        success: false,
        message: err?.error?.message || err?.message || 'Erro ao iniciar pagamento.',
      }));
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

  /** Actualiza os dados do perfil (nome, documento, província, email). O contacto não é alterável. */
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

  isAdmin(): boolean {
    return this.currentUser()?.admin ?? false;
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
  }> {
    return this.http
      .get<{
        available: boolean;
        environment: string;
        configured?: boolean;
        hint?: string;
        simulated?: boolean;
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
    simulatedChannel: 'mpesa' | 'emola' = 'mpesa'
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
      }>(`${API_URL}/mpesa/pay`, { phone, months, simulatedChannel })
      .toPromise()
      .then((r) => r ?? { success: false, message: 'Sem resposta do servidor.' })
      .catch((err) => ({
        success: false,
        message: err?.error?.message || err?.message || 'Erro ao iniciar o pagamento.',
      }));
  }

  /** Verifica estado de pagamento pendente. */
  checkMpesaPaymentStatus(): Promise<{ hasPending: boolean; status?: string; amount?: number }> {
    return this.http
      .get<{ hasPending: boolean; status?: string; amount?: number }>(`${API_URL}/mpesa/status`)
      .toPromise()
      .then((r) => r ?? { hasPending: false })
      .catch(() => ({ hasPending: false }));
  }
}
