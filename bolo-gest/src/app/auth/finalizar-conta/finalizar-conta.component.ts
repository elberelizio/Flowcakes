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
      if (res?.accountFinalized) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  /** Recarrega o estado da licença. Após o admin confirmar o pagamento, o utilizador é redireccionado para o dashboard. */
  reloadStatus(): void {
    this.loadStatus();
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
