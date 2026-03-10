import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, LicenseStatusResponse } from '../../services/auth.service';

@Component({
  selector: 'app-minha-licenca',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './minha-licenca.component.html',
  styleUrl: './minha-licenca.component.scss',
})
export class MinhaLicencaComponent implements OnInit {
  status = signal<LicenseStatusResponse | null>(null);
  loading = signal(true);

  constructor(public auth: AuthService) {}

  ngOnInit(): void {
    this.auth.getLicenseStatus().then((s) => {
      this.status.set(s);
      this.loading.set(false);
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
}
