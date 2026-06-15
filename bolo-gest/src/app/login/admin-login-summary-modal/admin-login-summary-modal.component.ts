import { Component, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminTreasuryService, type AdminLoginSummary } from '../../dashboard-admin/services/admin-treasury.service';
import { IconComponent } from '../../ui/icon/icon.component';
import { BRAND_ASSETS } from '@app/core/config/brand-assets';
import { BrandLockupComponent } from '@app/core/brand/brand-lockup.component';

@Component({
  selector: 'app-admin-login-summary-modal',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe, IconComponent, BrandLockupComponent],
  templateUrl: './admin-login-summary-modal.component.html',
  styleUrl: './admin-login-summary-modal.component.scss',
})
export class AdminLoginSummaryModalComponent implements OnInit {
  readonly brand = BRAND_ASSETS;
  private readonly treasury = inject(AdminTreasuryService);

  @Output() closed = new EventEmitter<void>();

  loading = signal(true);
  data = signal<AdminLoginSummary | null>(null);
  closing = false;

  ngOnInit(): void {
    this.treasury.getLoginSummary().subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  close(): void {
    if (this.closing) return;
    this.closing = true;
    setTimeout(() => this.closed.emit(), 280);
  }

  healthClass(score: number): string {
    if (score >= 80) return 'good';
    if (score >= 50) return 'warn';
    return 'bad';
  }

  formatMonth(ym: string | null | undefined): string {
    if (!ym || ym.length < 7) return '—';
    const [, m] = ym.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const i = parseInt(m, 10) - 1;
    return `${months[i] ?? m} ${ym.slice(0, 4)}`;
  }
}
