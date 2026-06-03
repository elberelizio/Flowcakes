import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, LicenseStatusResponse, LicensePaymentRow } from '../../services/auth.service';
import {
  isPaidOrTrialStatus,
  licensePaymentStatusLabelPt,
  licenseStatusLabelPt,
  licenseSubscriptionLabelPt,
} from '../../core/license/license-status';
import { licensePeriodLabelPt } from '../../core/license/license-period';
import { LicenseReceiptPdfService } from '../../core/license/license-receipt-pdf.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-my-license',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  templateUrl: './my-license.component.html',
  styleUrl: './my-license.component.scss',
})
export class MyLicenseComponent implements OnInit {
  readonly licenseStatusLabelPt = licenseStatusLabelPt;
  readonly isPaidOrTrialStatus = isPaidOrTrialStatus;

  status = signal<LicenseStatusResponse | null>(null);
  payments = signal<LicensePaymentRow[]>([]);
  loading = signal(true);
  paymentsLoading = signal(true);

  private readonly pdfExport = inject(LicenseReceiptPdfService);
  private readonly notification = inject(NotificationService);

  constructor(public auth: AuthService) {}

  ngOnInit(): void {
    this.auth.getLicenseStatus().then((s) => {
      this.status.set(s);
      this.loading.set(false);
    });
    this.auth.listLicensePayments().then((rows) => {
      this.payments.set(rows);
      this.paymentsLoading.set(false);
    });
  }

  formatExpiry(validUntil?: string): string {
    if (!validUntil) return '—';
    return new Date(validUntil).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  formatPhone(phone?: string): string {
    if (!phone) return '—';
    const d = phone.replace(/\D/g, '');
    if (d.length === 9) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
    return phone;
  }

  whatsappSupportUrl(phone?: string): string {
    const d = (phone ?? '871964887').replace(/\D/g, '');
    const e164 = d.startsWith('258') ? d : d.length === 9 ? `258${d}` : d;
    const text = encodeURIComponent('Olá, preciso de ajuda com o pagamento da licença Chef Control.');
    return `https://wa.me/${e164}?text=${text}`;
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('pt-MZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  txId(row: LicensePaymentRow): string {
    const r = row as unknown as Record<string, string | undefined>;
    return r['eMolaTransactionId'] ?? r['e_mola_transaction_id'] ?? '';
  }

  receiptNumber(row: LicensePaymentRow): string {
    const r = row as unknown as Record<string, string | undefined>;
    const fromApi = r['receiptNumber'] ?? r['receipt_number'];
    if (fromApi?.trim()) return fromApi.trim();
    const stamp = this.fileStampFromIso(row.createdAt);
    const suffix = (row.id ?? '').replace(/-/g, '').slice(0, 8).toUpperCase() || '00000000';
    return `RC-${stamp}-${suffix}`;
  }

  paymentStatusLabel(row: LicensePaymentRow): string {
    return licensePaymentStatusLabelPt(row.paymentStatus);
  }

  periodLabel(row: LicensePaymentRow): string {
    if (row.durationDays != null && row.durationDays > 0) {
      return row.durationDays === 1 ? '1 dia' : `${row.durationDays} dias`;
    }
    return licensePeriodLabelPt(row.durationMonths);
  }

  validUntilAfterPayment(row: LicensePaymentRow): string {
    const raw = row.validUntilAfter;
    if (!raw) return '—';
    return this.formatExpiry(raw);
  }

  downloadRecibo(row: LicensePaymentRow): void {
    const stamp = this.fileStampFromIso(row.createdAt);
    const ref = this.sanitizeFilePart(this.receiptNumber(row));
    const id = this.txId(row);
    const user = this.auth.getCurrentUser();
    this.pdfExport.downloadRecibo({
      filename: `recibo-licenca-chefcontrol-${stamp}-${ref}.pdf`,
      issuedAt: this.issuedAtLabel(),
      clientName: user?.fullName,
      clientPhone: user?.phone ? this.formatPhone(user.phone) : undefined,
      rows: [
        ['N.º do recibo', this.receiptNumber(row)],
        ['Data do pagamento', this.formatDate(row.createdAt)],
        ['Estado do pagamento', this.paymentStatusLabel(row)],
        ['Valor pago', `${row.amount} MZN`],
        ['Validade adquirida', this.periodLabel(row)],
        ['Licença válida até (após este pagamento)', this.validUntilAfterPayment(row)],
        ['ID transacção e-Mola', id || '—'],
      ],
      note: 'Recibo de pagamento confirmado — Chef Control. Conserve para os seus registos contabilísticos.',
    });
    this.notification.showSuccess('Recibo descarregado em PDF.');
  }

  downloadExtrato(): void {
    const stamp = this.fileStampFromDate(new Date());
    const user = this.auth.getCurrentUser();
    const lic = this.status();
    const total = this.payments().reduce((s, r) => s + (Number(r.amount) || 0), 0);
    this.pdfExport.downloadExtrato({
      filename: `extrato-licenca-chefcontrol-${stamp}.pdf`,
      issuedAt: this.issuedAtLabel(),
      clientName: user?.fullName,
      clientPhone: user?.phone ? this.formatPhone(user.phone) : undefined,
      summary: [
        ['Titular', user?.fullName || '—'],
        ['Telefone', user?.phone ? this.formatPhone(user.phone) : '—'],
        ['Subscrição actual', lic ? licenseSubscriptionLabelPt(lic.status) : '—'],
        ['Total pago (histórico)', `${total.toLocaleString('pt-MZ')} MZN`],
        ['N.º de pagamentos', String(this.payments().length)],
      ],
      payments: this.payments().map((r) => ({
        receipt: this.receiptNumber(r),
        date: this.formatDate(r.createdAt),
        status: this.paymentStatusLabel(r),
        amount: String(r.amount),
        period: this.periodLabel(r),
        validUntil: this.validUntilAfterPayment(r),
        txId: this.txId(r) || '—',
      })),
    });
    this.notification.showSuccess('Extrato completo descarregado em PDF.');
  }

  private issuedAtLabel(): string {
    return new Date().toLocaleString('pt-MZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private fileStampFromIso(iso?: string): string {
    const d = iso ? new Date(iso) : new Date();
    return this.fileStampFromDate(Number.isNaN(d.getTime()) ? new Date() : d);
  }

  private fileStampFromDate(d: Date): string {
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }

  private sanitizeFilePart(value: string): string {
    return value.replace(/[^\w-]+/g, '_').slice(0, 24) || 'ref';
  }
}
