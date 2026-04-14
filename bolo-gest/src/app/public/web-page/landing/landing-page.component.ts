import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AuthService } from '@app/services/auth.service';
import { PublicSiteNavComponent } from '../public-site-nav/public-site-nav.component';

/** Página inicial pública (marketing). Parte do módulo de rotas `web-page`. */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicSiteNavComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private title = inject(Title);

  readonly currentYear = new Date().getFullYear();

  ngOnInit(): void {
    this.title.setTitle('ChefControl - Gestão para Confeiteiras');
    if (this.auth.isLoggedIn()) {
      if (this.auth.isAdmin()) {
        void this.router.navigate(['/gestao-licencas']);
        return;
      }
      void this.router.navigate(['/dashboard']);
      return;
    }
  }

  playDemo(): void {
    window.alert('Em breve: Vídeo demonstrativo completo do sistema!');
  }
}
