import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, LicenseStatusResponse } from '../../services/auth.service';

@Component({
  selector: 'app-finalizar-conta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './finalizar-conta.component.html',
  styleUrl: './finalizar-conta.component.scss',
})
export class FinalizarContaComponent implements OnInit {
  status: LicenseStatusResponse | null = null;
  loading = true;
  success = false;
  error = '';

  /** Popup do código da licença */
  showCodePopup = false;
  licenseCode = '';
  codeError = '';
  validating = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.isAdmin()) {
      this.router.navigate(['/gestao-licencas']);
      return;
    }
    this.loadStatus();
  }

  loadStatus(): void {
    this.loading = true;
    this.auth.getLicenseStatus().then((res) => {
      this.status = res ?? null;
      this.loading = false;
      if (res?.accountFinalized && this.auth.isLicenseCodeValidated()) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  /** Abre o popup para introduzir o código da licença. */
  openCodePopup(): void {
    this.showCodePopup = true;
    this.licenseCode = '';
    this.codeError = '';
  }

  closeCodePopup(): void {
    this.showCodePopup = false;
    this.licenseCode = '';
    this.codeError = '';
  }

  /** Valida o código e, se correcto, redirecciona para o dashboard. */
  async submitLicenseCode(): Promise<void> {
    const code = (this.licenseCode || '').trim().toUpperCase();
    this.codeError = '';
    if (!code) {
      this.codeError = 'Introduza o código da licença (máx. 9 caracteres).';
      return;
    }
    if (code.length > 9) {
      this.codeError = 'O código tem no máximo 9 caracteres.';
      return;
    }
    this.validating = true;
    const ok = await this.auth.validateLicenseCode(code);
    this.validating = false;
    if (ok) {
      await this.auth.refreshProfile();
      this.closeCodePopup();
      this.success = true;
      setTimeout(() => this.router.navigate(['/dashboard']), 1500);
    } else {
      this.codeError = 'Código inválido. Verifique o código que recebeu (por link ou mensagem).';
    }
  }

  /** Sair da conta e ir para o login. Ao fazer login de novo, será redireccionado para finalizar-conta se ainda não tiver finalizado. */
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  get eMolaPhone(): string {
    return this.status?.eMolaPhone ?? '871964887';
  }

  get amount(): number {
    return this.status?.amount ?? 500;
  }
}
