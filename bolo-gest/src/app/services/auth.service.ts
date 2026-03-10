import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_URL } from '../core/api.config';
import { OrderAlertsPopupService } from './order-alerts-popup.service';

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
  admin?: boolean;
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
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<CurrentUser | null>(null);
  private initialized = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private orderAlertsPopup: OrderAlertsPopupService
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
        // Sem sessão ativa - usuário precisa fazer login
        // Erro 401 é esperado quando não há sessão - não é um problema
        if (err?.status === 401) {
          console.log('Nenhuma sessão ativa encontrada - utilizador precisa fazer login');
        } else {
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
    };
  }

  isLoggedIn = computed(() => !!this.currentUser());

  /** Normaliza telefone para envio à API: só dígitos (ex.: "87 196 4887" → "871964887"). */
  private static normalizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') return '';
    return phone.replace(/\D/g, '').trim();
  }

  /** Resultado do login: sucesso com user, ou falha (conta não existe / credenciais inválidas) */
  login(
    phone: string,
    password: string
  ): Promise<
    | { ok: true; user: UserResponse }
    | { ok: false; code: 'ACCOUNT_NOT_FOUND' | 'INVALID_CREDENTIALS' }
  > {
    type LoginResult =
      | { ok: true; user: UserResponse }
      | { ok: false; code: 'ACCOUNT_NOT_FOUND' | 'INVALID_CREDENTIALS' };
    const normalizedPhone = AuthService.normalizePhone(phone);
    if (!normalizedPhone) {
      return Promise.resolve({ ok: false, code: 'INVALID_CREDENTIALS' });
    }
    return this.http
      .post<UserResponse>(`${API_URL}/auth/login`, { phone: normalizedPhone, password })
      .toPromise()
      .then((user): LoginResult => {
        if (user) {
          this.currentUser.set(this.toCurrentUser(user));
          try {
            sessionStorage.removeItem('chefcontrol_login_summary_dismissed');
          } catch (_) {}
          return { ok: true, user };
        }
        return { ok: false, code: 'INVALID_CREDENTIALS' };
      })
      .catch((err: { status?: number }): LoginResult => {
        const status = err?.status;
        const code: 'ACCOUNT_NOT_FOUND' | 'INVALID_CREDENTIALS' =
          status === 404 ? 'ACCOUNT_NOT_FOUND' : 'INVALID_CREDENTIALS';
        return { ok: false, code };
      });
  }

  register(data: RegisterRequest): Promise<{ ok: true; data: RegisterResponse } | { ok: false; message: string }> {
    return this.http
      .post<RegisterResponse>(`${API_URL}/auth/register`, {
        phone: data.phone,
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

  logout(): void {
    this.http.post(`${API_URL}/auth/logout`, {}).subscribe();
    this.currentUser.set(null);
    this.orderAlertsPopup.resetForNextLogin();
    try {
      sessionStorage.removeItem('chefcontrol_login_summary_dismissed');
    } catch (_) {}
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

  confirmPayment(paymentReference?: string): Promise<LicenseStatusResponse | null> {
    const body = paymentReference != null ? { paymentReference } : {};
    return this.http
      .post<LicenseStatusResponse>(`${API_URL}/auth/confirm-payment`, body)
      .toPromise()
      .then((res) => {
        if (res?.accountFinalized) {
          this.currentUser.update((u) => u ? { ...u, accountFinalized: true } : null);
        }
        return res ?? null;
      })
      .catch(() => null);
  }
}
