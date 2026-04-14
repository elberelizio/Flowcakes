import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { normalizeMzPhoneDigits } from '../validators/mz-phone.validator';

@Component({
  selector: 'app-pagamento-licenca',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './pagamento-licenca.component.html',
  styleUrl: './pagamento-licenca.component.scss',
})
export class PagamentoLicencaComponent implements OnInit {
  private title = inject(Title);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  /** Alinhado ao backend `app.license-amount` (MZN por mês). */
  readonly licenseMonthAmountMzn = 500;

  loginPhone = '';
  password = '';
  walletPhone = '';
  payMonths = 1;
  simulatedPayChannel: 'mpesa' | 'emola' = 'mpesa';

  /** true quando o backend usa pagamento simulado (sem API externa). */
  paySimulated = false;
  payLoading = false;
  payMessage = '';
  paySuccess = false;

  ngOnInit(): void {
    this.title.setTitle('Renovar licença · Chef Control');
    const q = this.route.snapshot.queryParamMap.get('phone');
    if (q) {
      this.loginPhone = q.replace(/\D/g, '').slice(0, 12);
    }
    void this.refreshPayMode();
  }

  get totalMzn(): number {
    return this.licenseMonthAmountMzn * this.payMonths;
  }

  walletChannelLabel(): string {
    return this.simulatedPayChannel === 'emola' ? 'e-Mola' : 'M-Pesa';
  }

  walletPlaceholder(): string {
    return this.simulatedPayChannel === 'emola' ? '861234567 ou 871234567' : '841234567 ou 258…';
  }

  private async refreshPayMode(): Promise<void> {
    const r = await this.auth.checkMpesaAvailable();
    this.paySimulated = r.simulated === true;
    this.cdr.markForCheck();
  }

  async submitPayment(): Promise<void> {
    const login = normalizeMzPhoneDigits(this.loginPhone);
    if (login.length !== 9) {
      this.payMessage = 'Introduza o contacto da conta (9 dígitos ou 258 + 9 dígitos).';
      this.paySuccess = false;
      return;
    }
    if (!this.password || this.password.length < 4) {
      this.payMessage = 'Introduza a senha da conta.';
      this.paySuccess = false;
      return;
    }
    if (!this.walletPhone.trim()) {
      this.payMessage = `Introduza o número ou contacto ${this.walletChannelLabel()}.`;
      this.paySuccess = false;
      return;
    }
    const wallet = normalizeMzPhoneDigits(this.walletPhone);
    if (this.simulatedPayChannel === 'emola') {
      if (wallet.length !== 9 || (!wallet.startsWith('86') && !wallet.startsWith('87'))) {
        this.payMessage = 'e-Mola em Moçambique: use 9 dígitos começando por 86 ou 87 (ex.: 861234567).';
        this.paySuccess = false;
        return;
      }
    } else if (wallet.length !== 9) {
      this.payMessage = 'Introduza um número M-Pesa válido (9 dígitos nacionais ou 258 + 9 dígitos).';
      this.paySuccess = false;
      return;
    }
    this.payLoading = true;
    this.payMessage = '';
    this.paySuccess = false;
    const res = await this.auth.payMpesaWithCredentials(
      this.loginPhone.trim(),
      this.password,
      wallet,
      this.payMonths,
      this.simulatedPayChannel
    );
    this.payLoading = false;
    this.payMessage = res.message;
    this.paySuccess = res.success;
    this.cdr.markForCheck();
  }
}
