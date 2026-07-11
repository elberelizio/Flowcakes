import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BRAND_ASSETS } from '@app/core/config/brand-assets';
import { BrandLockupComponent } from '@app/core/brand/brand-lockup.component';
import { TranslatePipe } from '@app/core/i18n/translate.pipe';
import { LanguageService } from '@app/services/language.service';

/** Barra de navegação partilhada entre a landing e páginas públicas (ex.: contacto). */
@Component({
  selector: 'app-public-site-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, BrandLockupComponent, TranslatePipe],
  templateUrl: './public-site-nav.component.html',
  styleUrl: './public-site-nav.component.scss',
  host: { class: 'block' },
})
export class PublicSiteNavComponent {
  readonly brand = BRAND_ASSETS;
  readonly lang = inject(LanguageService);
  navScrolled = false;
  mobileMenuOpen = false;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.navScrolled = window.scrollY > 50;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
}
