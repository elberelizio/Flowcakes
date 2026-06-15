import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  inject,
  ChangeDetectorRef,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import {
  isValidMzWalletPhone,
  normalizeMzPhoneDigits,
  sanitizeMzWalletPhone,
} from '../validators/mz-phone.validator';
import { LicensePaymentStrings } from './license-payment.strings';
import { LICENSE_PAYMENT_BRAND_ALTS, LICENSE_PAYMENT_BRAND_IMAGES } from './license-payment.brand-assets';
import { BRAND_ASSETS } from '@app/core/config/brand-assets';
import { BrandLockupComponent } from '@app/core/brand/brand-lockup.component';
import { RegistrationFlowService } from '@app/core/registration/registration-flow.service';
import { LicensePaymentLockService } from '../services/license-payment-lock.service';
import { RegistrationProgressComponent } from '@app/core/registration/registration-progress.component';
import { PublicSiteNavComponent } from '../public/web-page/public-site-nav/public-site-nav.component';
import { NotificationService } from '../services/notification.service';
import { SnackbarComponent } from '../ui/snackbar/snackbar.component';

@Component({
  selector: 'app-license-payment',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    PublicSiteNavComponent,
    RegistrationProgressComponent,
    SnackbarComponent,
    BrandLockupComponent,
  ],
  templateUrl: './license-payment.component.html',
  styleUrl: './license-payment.component.scss',
})
export class LicensePaymentComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly brand = BRAND_ASSETS;
  @ViewChild(SnackbarComponent) private snackbar!: SnackbarComponent;

  private title = inject(Title);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected readonly auth = inject(AuthService);
  private registrationFlow = inject(RegistrationFlowService);
  private licenseLock = inject(LicensePaymentLockService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private accessPollTimer: ReturnType<typeof setInterval> | null = null;
  private paymentPollTimer: ReturnType<typeof setInterval> | null = null;
  private readonly pollIntervalMs = 8000;
  private navigatingAfterApproval = false;
  private pendingInfoShown = false;

  inRegistrationFlow = false;
  readonly registrationProgressStep = 3 as const;

  licenseMonthAmountMzn = signal(500);
  readonly str = LicensePaymentStrings;
  readonly brandImg = LICENSE_PAYMENT_BRAND_IMAGES;
  readonly brandAlt = LICENSE_PAYMENT_BRAND_ALTS;

  walletPhone = '';
  transferReference = '';
  payMonths = 1;
  readonly selectedTab = signal<'mpesa' | 'emola'>('mpesa');

  /** Pagamento por transferência manual (omissão activa nesta página). */
  manualTransfer = signal(true);
  payModeLoading = signal(true);
  /** Vodacom M-Pesa */
  readonly mpesaDestination = signal('846746170');
  /** Movitel e-Mola */
  readonly emolaDestination = signal('871964887');
  supportWhatsapp = signal('871964887');

  hasPendingPayment = signal(false);
  hasRejectedPayment = signal(false);
  rejectionReason = signal('');
  showPendingPopup = signal(false);
  showRejectedPopup = signal(false);
  payLoading = false;
  payMessage = '';
  paySuccess = false;
  copyHint = '';

  readonly destinationPhone = computed(() =>
    this.selectedTab() === 'emola' ? this.emolaDestination() : this.mpesaDestination()
  );

  ngAfterViewInit(): void {
    if (this.snackbar) {
      this.notification.setSnackbar(this.snackbar);
    }
  }

  ngOnInit(): void {
    this.title.setTitle(LicensePaymentStrings.documentTitle);
    this.inRegistrationFlow = this.registrationFlow.isFinalizePaid();

    const q = this.route.snapshot.queryParamMap.get('phone');
    if (q) {
      const digits = q.replace(/\D/g, '').slice(0, 12);
      const d = sanitizeMzWalletPhone(digits, this.selectedTab());
      if (d.length === 9) {
        this.walletPhone = d;
      }
    }
    if (this.sessionActive()) {
      const p = this.auth.getPhone();
      if (p) {
        const d = sanitizeMzWalletPhone(p, this.selectedTab());
        if (d.length === 9) {
          this.walletPhone = d;
        }
      }
    }
    void this.refreshPayMode();
    if (this.sessionActive()) {
      void this.loadPendingStatus().then(() => {
        if (this.hasPendingPayment() && !this.accessRestricted()) {
          this.startPaymentStatusPoll();
        }
      });
    }
    if (this.accessRestricted()) {
      this.startAccessPoll();
    }
  }

  ngOnDestroy(): void {
    this.stopAccessPoll();
    this.stopPaymentStatusPoll();
  }

  accessRestricted(): boolean {
    return this.sessionActive() && !this.auth.isAccountFinalized();
  }

  showTransferUi(): boolean {
    return this.manualTransfer() || this.accessRestricted();
  }

  userDisplayName(): string {
    return this.auth.getDisplayName().trim() || 'Utilizador';
  }

  userDisplayPhone(): string {
    const p = this.auth.getPhone() ?? '';
    return this.formatDisplayPhone(p) || p;
  }

  userInitials(): string {
    const name = this.userDisplayName();
    if (name === 'Utilizador') {
      const phone = (this.auth.getPhone() ?? '').replace(/\D/g, '');
      return phone.length >= 2 ? phone.slice(-2) : '?';
    }
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  currentPayStep(): 1 | 2 | 3 {
    if (this.hasPendingPayment()) return 3;
    if (this.walletPhone.trim().length >= 9) return 2;
    return 1;
  }

  restrictionTitle(): string {
    return this.licenseLock.title();
  }

  restrictionMessage(): string {
    return this.licenseLock.message();
  }

  private startAccessPoll(): void {
    if (this.accessPollTimer) return;
    void this.pollLicenseAccess();
    this.accessPollTimer = setInterval(() => void this.pollLicenseAccess(), this.pollIntervalMs);
  }

  private stopAccessPoll(): void {
    if (this.accessPollTimer) {
      clearInterval(this.accessPollTimer);
      this.accessPollTimer = null;
    }
  }

  private startPaymentStatusPoll(): void {
    if (this.paymentPollTimer) return;
    void this.pollPaymentStatus();
    this.paymentPollTimer = setInterval(() => void this.pollPaymentStatus(), this.pollIntervalMs);
  }

  private stopPaymentStatusPoll(): void {
    if (this.paymentPollTimer) {
      clearInterval(this.paymentPollTimer);
      this.paymentPollTimer = null;
    }
  }

  private async pollPaymentStatus(): Promise<void> {
    if (this.navigatingAfterApproval) return;
    const st = await this.auth.checkMpesaPaymentStatus();
    if (st.hasRejected) {
      this.hasPendingPayment.set(false);
      this.hasRejectedPayment.set(true);
      const reason =
        st.rejectionReason?.trim() ||
        this.auth.paymentRejectionReason() ||
        '';
      this.rejectionReason.set(reason);
      this.stopPaymentStatusPoll();
      this.cdr.markForCheck();
      return;
    }
    if (st.completed === true || (st.hasPending === false && this.hasPendingPayment())) {
      await this.onRenewalPaymentCompleted();
      return;
    }
    this.hasPendingPayment.set(st.hasPending === true);
    this.cdr.markForCheck();
  }

  private async onRenewalPaymentCompleted(): Promise<void> {
    if (this.navigatingAfterApproval) return;
    this.navigatingAfterApproval = true;
    this.stopPaymentStatusPoll();
    this.hasPendingPayment.set(false);
    this.notification.showSuccess(LicensePaymentStrings.toastRenewalSuccess, 6000);
    await this.auth.refreshProfile();
    this.cdr.markForCheck();
    setTimeout(() => {
      void this.router.navigate(['/my-license'], { replaceUrl: true });
    }, 1200);
  }

  private async pollLicenseAccess(): Promise<void> {
    if (this.navigatingAfterApproval) return;
    const st = await this.auth.getLicenseStatus();
    if (this.auth.applyLicenseAccessFromStatus(st)) {
      await this.onLicenseApproved();
      return;
    }
    this.cdr.markForCheck();
  }

  private async onLicenseApproved(): Promise<void> {
    if (this.navigatingAfterApproval) return;
    this.navigatingAfterApproval = true;
    this.stopAccessPoll();
    this.notification.showSuccess(LicensePaymentStrings.toastPaymentApproved, 8000);
    await this.auth.refreshProfile();
    this.cdr.markForCheck();
    setTimeout(() => {
      const dest = this.inAppShell() ? '/my-license' : '/dashboard';
      void this.router.navigate([dest], { replaceUrl: true });
    }, 1200);
  }

  backFromPayment(): void {
    if (this.inRegistrationFlow) {
      this.registrationFlow.reopenPlanChoice();
      const phone = this.registrationFlow.getPhone() || this.walletPhone;
      void this.router.navigate(['/choose-plan'], {
        queryParams: phone ? { phone, registered: '1' } : { registered: '1' },
      });
      return;
    }
    if (this.sessionActive() && this.auth.isAccountFinalized()) {
      void this.router.navigate(['/my-license']);
      return;
    }
    if (this.accessRestricted()) {
      return;
    }
    void this.router.navigate(['/']);
  }

  logout(): void {
    this.auth.logout();
  }

  sessionActive(): boolean {
    return this.auth.isLoggedIn() && !this.auth.isAdmin();
  }

  inAppShell(): boolean {
    return this.sessionActive() && this.auth.isAccountFinalized();
  }

  totalMzn(): number {
    return this.licenseMonthAmountMzn() * this.payMonths;
  }

  monthOptionLabel(m: number): string {
    const days = m * 30;
    return `${days} dias — ${m * this.licenseMonthAmountMzn()} MZN`;
  }

  apiChannel(): 'mpesa' | 'emola' {
    return this.selectedTab() === 'emola' ? 'emola' : 'mpesa';
  }

  selectTab(m: 'mpesa' | 'emola'): void {
    this.selectedTab.set(m);
    this.payMessage = '';
    this.copyHint = '';
    this.walletPhone = sanitizeMzWalletPhone(this.walletPhone, m);
  }

  onWalletPhoneChange(raw: string): void {
    this.walletPhone = sanitizeMzWalletPhone(raw, this.selectedTab());
    if (this.payMessage && !this.paySuccess) {
      this.payMessage = '';
    }
  }

  walletFormatHint(): string {
    return this.selectedTab() === 'emola' ? LicensePaymentStrings.hintEmola : LicensePaymentStrings.hintMpesa;
  }

  walletChannelLabel(): string {
    return this.selectedTab() === 'emola' ? 'e-Mola (Movitel)' : 'M-Pesa (Vodacom)';
  }

  operatorLabel(): string {
    return this.selectedTab() === 'emola' ? 'Movitel' : 'Vodacom';
  }

  walletPlaceholder(): string {
    return this.selectedTab() === 'emola'
      ? LicensePaymentStrings.placeholderEmola
      : LicensePaymentStrings.placeholderMpesa;
  }

  /** Renovação com licença ainda activa — pode continuar a usar a app enquanto valida. */
  isRenewalWhileActive(): boolean {
    return this.auth.isAccountFinalized();
  }

  pendingPopupText(): string {
    return this.isRenewalWhileActive()
      ? LicensePaymentStrings.pendingPopupTextRenewal
      : LicensePaymentStrings.pendingPopupTextRestricted;
  }

  pendingPanelNote(): string {
    return this.isRenewalWhileActive()
      ? LicensePaymentStrings.pendingPanelNoteRenewal
      : LicensePaymentStrings.pendingPanelNoteRestricted;
  }

  pendingToastMessage(): string {
    return this.isRenewalWhileActive()
      ? LicensePaymentStrings.toastPendingRegisteredRenewal
      : LicensePaymentStrings.toastPendingRegistered;
  }

  formatDisplayPhone(phone: string): string {
    const d = phone.replace(/\D/g, '');
    if (d.length === 9) {
      return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
    }
    return phone;
  }

  whatsappE164(): string {
    const d = this.supportWhatsapp().replace(/\D/g, '');
    if (d.startsWith('258')) return d;
    if (d.length === 9) return `258${d}`;
    return d;
  }

  whatsappUrl(): string {
    const text = encodeURIComponent(
      `Olá, preciso de ajuda com o pagamento da licença Flow Cakes (${this.totalMzn} MZN).`
    );
    return `https://wa.me/${this.whatsappE164()}?text=${text}`;
  }

  telUrl(): string {
    return `tel:+${this.whatsappE164()}`;
  }

  dismissPendingPopup(): void {
    this.showPendingPopup.set(false);
    this.cdr.markForCheck();
  }

  async copyDestination(): Promise<void> {
    const n = this.destinationPhone().replace(/\s/g, '');
    try {
      await navigator.clipboard.writeText(n);
      this.copyHint = LicensePaymentStrings.toastCopyNumber;
      this.notification.showSuccess(LicensePaymentStrings.toastCopyNumber);
    } catch {
      this.copyHint = n;
      this.notification.showInfo(n, 3000);
    }
    this.cdr.markForCheck();
    setTimeout(() => {
      this.copyHint = '';
      this.cdr.markForCheck();
    }, 2500);
  }

  private async refreshPayMode(): Promise<void> {
    this.payModeLoading.set(true);
    try {
      const r = await this.auth.checkMpesaAvailable();
      this.manualTransfer.set(r.manualTransfer !== false);
      if (r.mpesaDestinationPhone) this.mpesaDestination.set(r.mpesaDestinationPhone.replace(/\D/g, ''));
      if (r.emolaDestinationPhone) this.emolaDestination.set(r.emolaDestinationPhone.replace(/\D/g, ''));
      if (r.supportWhatsapp) this.supportWhatsapp.set(r.supportWhatsapp.replace(/\D/g, ''));
      if (r.licenseAmountMzn && r.licenseAmountMzn > 0) {
        this.licenseMonthAmountMzn.set(r.licenseAmountMzn);
      }
    } catch {
      this.notification.showError(LicensePaymentStrings.toastLoadError);
    } finally {
      this.payModeLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  private async loadPendingStatus(): Promise<void> {
    const st = await this.auth.checkMpesaPaymentStatus();
    this.hasPendingPayment.set(st.hasPending === true);
    this.hasRejectedPayment.set(st.hasRejected === true);
    const reason =
      st.rejectionReason?.trim() ||
      this.auth.paymentRejectionReason() ||
      '';
    this.rejectionReason.set(reason);
    if (st.supportWhatsapp) {
      this.supportWhatsapp.set(st.supportWhatsapp.replace(/\D/g, ''));
    } else if (this.auth.supportWhatsapp()) {
      this.supportWhatsapp.set(this.auth.supportWhatsapp());
    }
    if (st.hasRejected && !st.hasPending) {
      const showPopup =
        this.auth.shouldShowPaymentRejectionPopup() || this.route.snapshot.queryParamMap.get('rejected') === '1';
      this.showRejectedPopup.set(showPopup);
      if (showPopup) {
        this.notification.showWarning(LicensePaymentStrings.toastPaymentRejected);
      }
    } else if (st.hasPending && !this.pendingInfoShown) {
      this.pendingInfoShown = true;
      this.notification.showInfo(this.pendingToastMessage(), 5000);
    }
    this.cdr.markForCheck();
  }

  dismissRejectedPopup(): void {
    this.showRejectedPopup.set(false);
    this.auth.clearPaymentRejectionPopupFlag();
    this.cdr.markForCheck();
  }

  async submitPayment(): Promise<void> {
    if (this.hasPendingPayment()) {
      this.notification.showInfo(this.pendingToastMessage());
      return;
    }

    const channel = this.apiChannel();

    if (!this.walletPhone.trim()) {
      const msg = LicensePaymentStrings.errWalletRequired(this.walletChannelLabel());
      this.payMessage = msg;
      this.paySuccess = false;
      this.notification.showError(msg);
      return;
    }
    const wallet = sanitizeMzWalletPhone(this.walletPhone, channel);
    this.walletPhone = wallet;
    if (!isValidMzWalletPhone(wallet, channel)) {
      const msg =
        channel === 'emola' ? LicensePaymentStrings.errEmolaFormat : LicensePaymentStrings.errMpesaFormat;
      this.payMessage = msg;
      this.paySuccess = false;
      this.notification.showError(msg);
      return;
    }

    this.payLoading = true;
    this.payMessage = '';
    this.paySuccess = false;
    const res = await this.auth.initiateMpesaPayment(
      wallet,
      this.payMonths,
      channel,
      this.transferReference
    );
    this.payLoading = false;
    this.paySuccess = res.success;
    if (res.success) {
      this.hasPendingPayment.set(true);
      this.hasRejectedPayment.set(false);
      this.rejectionReason.set('');
      this.showPendingPopup.set(false);
      this.payMessage = '';
      const msg = res.message?.trim() || this.pendingToastMessage();
      this.notification.showSuccess(msg, 6000);
      await this.auth.refreshProfile();
      this.cdr.markForCheck();
      if (this.auth.isAccountFinalized()) {
        setTimeout(() => {
          void this.router.navigate(['/dashboard'], { replaceUrl: true });
        }, 800);
      } else if (this.accessRestricted()) {
        this.startAccessPoll();
      } else {
        this.startPaymentStatusPoll();
      }
    } else {
      const msg = res.message?.trim() || LicensePaymentStrings.toastSubmitError;
      this.payMessage = msg;
      this.notification.showError(msg);
    }
    this.cdr.markForCheck();
  }
}
