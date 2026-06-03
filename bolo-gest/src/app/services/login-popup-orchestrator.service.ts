import { Injectable, inject, Injector, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { SystemNotificationsService } from './system-notifications.service';
import { WelcomeOnboardingPopupService } from './welcome-onboarding-popup.service';
import { SatisfactionPromptService } from './satisfaction-prompt.service';

export type LoginPopupStep = 'aviso' | 'welcome' | 'license' | 'satisfaction';

/**
 * Ordem dos popups após login (utilizador normal):
 * 1. Manutenção / aviso do sistema
 * 2. Boas-vindas (primeiro login)
 * 3. Satisfação (primeiro login, se elegível)
 * O aviso de licença a expirar (≤5 dias) fica no popup «Resumo da situação» do dashboard.
 */
@Injectable({ providedIn: 'root' })
export class LoginPopupOrchestratorService {
  private readonly injector = inject(Injector);
  private readonly systemNotifications = inject(SystemNotificationsService);
  private readonly welcomePopup = inject(WelcomeOnboardingPopupService);
  private readonly satisfactionPrompt = inject(SatisfactionPromptService);

  /** Popup actualmente activo na cadeia pós-login. */
  readonly activeStep = signal<LoginPopupStep | null>(null);

  private notificationsReady = false;
  private userDataReady = false;
  private chainStarted = false;

  private auth(): AuthService {
    return this.injector.get(AuthService);
  }

  /** True enquanto a cadeia pós-login está activa ou por iniciar. */
  blocksOtherPopups(): boolean {
    return this.activeStep() !== null;
  }

  reset(): void {
    this.notificationsReady = false;
    this.userDataReady = false;
    this.chainStarted = false;
    this.activeStep.set(null);
    this.welcomePopup.close();
    this.systemNotifications.closeLoginModal();
    this.satisfactionPrompt.reset();
  }

  markNotificationsReady(): void {
    this.notificationsReady = true;
    this.tryStartChain();
  }

  markUserDataReady(): void {
    this.userDataReady = true;
    this.tryStartChain();
  }

  /** Continua a cadeia quando o shell já está visível (ex.: após navegação). */
  continueChainAfterShell(): void {
    if (!this.auth().isLoggedIn() || this.auth().isAdmin()) return;
    if (!this.notificationsReady || !this.userDataReady) return;
    if (this.activeStep() !== null) return;

    if (!this.chainStarted) {
      this.tryStartChain();
      return;
    }

    this.showWelcomeOrFinish();
  }

  confirmAviso(): void {
    this.systemNotifications.confirmLoginModal();
    this.systemNotifications.closeLoginModal();
    this.showWelcomeOrFinish();
  }

  confirmWelcome(): void {
    this.auth().clearWelcomeOnboarding();
    this.welcomePopup.confirm();
    this.finishChain();
  }

  showLicenseStep(): void {
    this.activeStep.set('license');
  }

  completeLicenseStep(): void {
    if (this.activeStep() === 'license') {
      this.activeStep.set(null);
    }
  }

  private tryStartChain(): void {
    if (this.chainStarted || !this.notificationsReady || !this.userDataReady) return;
    if (!this.auth().isLoggedIn() || this.auth().isAdmin()) return;

    this.chainStarted = true;
    this.satisfactionPrompt.markLoginSessionContext();

    const shown = this.systemNotifications.tryShowLoginAvisoModal();
    if (shown) {
      this.activeStep.set('aviso');
      return;
    }
    this.showWelcomeOrFinish();
  }

  private showWelcomeOrFinish(): void {
    if (this.auth().showWelcomeOnboarding()) {
      this.welcomePopup.tryShow(true);
      this.activeStep.set('welcome');
      return;
    }
    this.finishChain();
  }

  completeSatisfactionStep(): void {
    if (this.activeStep() === 'satisfaction') {
      this.showLicenseOrEnd();
    }
  }

  private finishChain(): void {
    void this.trySatisfactionThenLicense();
  }

  private async trySatisfactionThenLicense(): Promise<void> {
    this.showLicenseOrEnd();
  }

  private showLicenseOrEnd(): void {
    this.activeStep.set(null);
  }
}
