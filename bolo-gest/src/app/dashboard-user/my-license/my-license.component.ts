import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, LicenseStatusResponse, LicensePaymentRow } from '../../services/auth.service';
import { isPaidOrTrialStatus, licenseStatusLabelPt } from '../../core/license/license-status';

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

  downloadRecibo(row: LicensePaymentRow): void {
    const w = window.open('', '_blank');
    if (!w) return;
    const id = this.txId(row);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Recibo — Chef Control</title>
      <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:480px;margin:auto}
      h1{font-size:1.25rem} .muted{color:#666;font-size:0.9rem}</style></head><body>
      <h1>Recibo de pagamento — Licença Chef Control</h1>
      <p><strong>Data:</strong> ${this.formatDate(row.createdAt)}</p>
      <p><strong>Valor:</strong> ${row.amount} MZN</p>
      <p><strong>Duração:</strong> ${row.durationMonths} mês(es)</p>
      <p><strong>ID transacção e-Mola:</strong> ${id}</p>
      <p class="muted">Documento informativo. Conserve para os seus registos.</p>
      </body></html>`;
    w.document.write(html);
    w.document.close();
    w.onload = () => w.print();
  }

  downloadExtrato(): void {
    const w = window.open('', '_blank');
    if (!w) return;
    const lines = this.payments()
      .map(
        (r) =>
          `<tr><td>${this.formatDate(r.createdAt)}</td><td>${r.amount} MZN</td><td>${r.durationMonths}</td><td>${this.txId(r)}</td></tr>`
      )
      .join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Extrato — Chef Control</title>
      <style>body{font-family:system-ui,sans-serif;padding:2rem} table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #ccc;padding:0.5rem;text-align:left} th{background:#f5f5f5}</style></head><body>
      <h1>Extrato de pagamentos da licença</h1>
      <p>Chef Control</p>
      <table><thead><tr><th>Data</th><th>Valor (MZN)</th><th>Meses</th><th>ID e-Mola</th></tr></thead><tbody>${lines}</tbody></table>
      </body></html>`;
    w.document.write(html);
    w.document.close();
    w.onload = () => w.print();
  }
}
