import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../core/config/api.config';

/**
 * Popup de boas-vindas no primeiro login (utilizadores normais).
 */
@Injectable({ providedIn: 'root' })
export class WelcomeOnboardingPopupService {
  private readonly http = inject(HttpClient);

  visible = signal(false);

  tryShow(shouldShow: boolean): boolean {
    if (!shouldShow) return false;
    this.visible.set(true);
    return true;
  }

  close(): void {
    this.visible.set(false);
  }

  confirm(): void {
    this.http.post(`${API_URL}/auth/onboarding-complete`, {}).subscribe({
      next: () => this.close(),
      error: () => this.close(),
    });
  }
}
