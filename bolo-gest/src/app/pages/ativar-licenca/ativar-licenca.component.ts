import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/api.config';

export interface LicenseInfoPublic {
  fullName: string | null;
  licenseToken: string | null;
  validUntil: string | null; // ISO
  expired: boolean;
}

@Component({
  selector: 'app-ativar-licenca',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ativar-licenca.component.html',
  styleUrl: './ativar-licenca.component.scss',
})
export class AtivarLicencaComponent implements OnInit {
  info = signal<LicenseInfoPublic | null>(null);
  loading = signal(true);
  notFound = signal(false);
  /** Sem ligação não é possível obter o código (o código não vai na URL por segurança). */
  networkError = signal(false);

  validUntilFormatted = computed(() => {
    const i = this.info();
    if (!i?.validUntil) return null;
    return new Date(i.validUntil).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  });

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const t = params.get('t')?.trim() ?? null;
      if (!t) {
        this.loading.set(false);
        this.notFound.set(true);
        return;
      }
      this.fetchLicenseInfo(t);
    });
  }

  private fetchLicenseInfo(activationToken: string): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.networkError.set(false);
    this.http
      .get<LicenseInfoPublic>(`${API_URL}/public/license-info`, {
        params: { t: activationToken },
      })
      .subscribe({
        next: (data) => {
          this.info.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          if (err?.status === 404) this.notFound.set(true);
          else this.networkError.set(true);
        },
      });
  }
}
