import { Component, OnInit, inject, ChangeDetectorRef, computed, signal } from '@angular/core';
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
import { RegistrationFlowService } from '@app/core/registration/registration-flow.service';
import { RegistrationProgressComponent } from '@app/core/registration/registration-progress.component';
import { PublicSiteNavComponent } from '../public/web-page/public-site-nav/public-site-nav.component';

@Component({
  selector: 'app-license-payment',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PublicSiteNavComponent, RegistrationProgressComponent],
  templateUrl: './license-payment.component.html',
  styleUrl: './license-payment.component.scss',
})
export class LicensePaymentComponent implements OnInit {
  private title = inject(Title);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected readonly auth = inject(AuthService);
  private registrationFlow = inject(RegistrationFlowService);
  private cdr = inject(ChangeDetectorRef);

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

  manualTransfer = signal(false);
  /** Vodacom M-Pesa */
  readonly mpesaDestination = signal('846746170');
  /** Movitel e-Mola */
  readonly emolaDestination = signal('871964887');
  supportWhatsapp = signal('871964887');

  hasPendingPayment = signal(false);
  hasRejectedPayment = signal(false);
  rejectionReason = signal('');
  showPendingPopup = signal(false);
  paySimulated = false;
  payLoading = false;
  payMessage = '';
  paySuccess = false;
  copyHint = '';

  readonly destinationPhone = computed(() =>
    this.selectedTab() === 'emola' ? this.emolaDestination() : this.mpesaDestination()
  );

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
      void this.loadPendingStatus();
    }
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
    if (this.sessionActive()) {
      void this.router.navigate(['/my-license']);
      return;
    }
    void this.router.navigate(['/']);
  }

  goToLoginAfterPayment(): void {
    const phone = this.registrationFlow.getPhone() || this.walletPhone;
    this.auth.endSessionWithoutNavigation();
    void this.router.navigate(['/login'], {
      queryParams: phone ? { phone, finalize: '1' } : { finalize: '1' },
    });
  }

  sessionActive(): boolean {
    return this.auth.isLoggedIn() && !this.auth.isAdmin();
  }

  inAppShell(): boolean {
    return this.auth.isLoggedIn() && !this.auth.isAdmin();
  }

  leadText(): string {
    return this.sessionActive() ? LicensePaymentStrings.leadLogged : LicensePaymentStrings.lead;
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
      `Olá, preciso de ajuda com o pagamento da licença Chef Control (${this.totalMzn} MZN).`
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
      this.copyHint = 'Número copiado!';
    } catch {
      this.copyHint = n;
    }
    this.cdr.markForCheck();
    setTimeout(() => {
      this.copyHint = '';
      this.cdr.markForCheck();
    }, 2500);
  }

  private async refreshPayMode(): Promise<void> {
    const r = await this.auth.checkMpesaAvailable();
    this.paySimulated = r.simulated === true || r.manualTransfer === true;
    this.manualTransfer.set(r.manualTransfer === true || r.simulated === true);
    if (r.mpesaDestinationPhone) this.mpesaDestination.set(r.mpesaDestinationPhone.replace(/\D/g, ''));
    if (r.emolaDestinationPhone) this.emolaDestination.set(r.emolaDestinationPhone.replace(/\D/g, ''));
    if (r.supportWhatsapp) this.supportWhatsapp.set(r.supportWhatsapp.replace(/\D/g, ''));
    if (r.licenseAmountMzn && r.licenseAmountMzn > 0) {
      this.licenseMonthAmountMzn.set(r.licenseAmountMzn);
    }
    this.cdr.markForCheck();
  }

  private async loadPendingStatus(): Promise<void> {
    const st = await this.auth.checkMpesaPaymentStatus();
    this.hasPendingPayment.set(st.hasPending === true);
    this.hasRejectedPayment.set(st.hasRejected === true);
    this.rejectionReason.set(st.rejectionReason?.trim() || '');
    this.cdr.markForCheck();
  }

  async submitPayment(): Promise<void> {
    if (!this.sessionActive()) {
      this.payMessage = LicensePaymentStrings.errNeedAccount;
      this.paySuccess = false;
      return;
    }

    if (this.hasPendingPayment()) {
      return;
    }

    const channel = this.apiChannel();

    if (!this.walletPhone.trim()) {
      this.payMessage = LicensePaymentStrings.errWalletRequired(this.walletChannelLabel());
      this.paySuccess = false;
      return;
    }
    const wallet = sanitizeMzWalletPhone(this.walletPhone, channel);
    this.walletPhone = wallet;
    if (!isValidMzWalletPhone(wallet, channel)) {
      this.payMessage =
        channel === 'emola' ? LicensePaymentStrings.errEmolaFormat : LicensePaymentStrings.errMpesaFormat;
      this.paySuccess = false;
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
      this.showPendingPopup.set(true);
      this.payMessage = '';
    } else {
      this.payMessage = res.message;
    }
    this.cdr.markForCheck();
  }
}
