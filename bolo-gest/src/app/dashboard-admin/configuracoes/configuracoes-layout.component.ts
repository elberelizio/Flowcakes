import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CONFIGURACOES_SUBNAV } from './configuracoes-nav';

@Component({
  selector: 'app-configuracoes-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './configuracoes-layout.component.html',
  styleUrl: './configuracoes-layout.component.scss',
})
export class ConfiguracoesLayoutComponent {
  private readonly router = inject(Router);

  readonly subnav = CONFIGURACOES_SUBNAV;

  isChildRoute(): boolean {
    const url = this.router.url.split('?')[0];
    return url !== '/admin-configuracoes' && url.startsWith('/admin-configuracoes/');
  }
}
