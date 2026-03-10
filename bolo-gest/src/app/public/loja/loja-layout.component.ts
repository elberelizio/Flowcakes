import { Component, signal, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-loja-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './loja-layout.component.html',
  styleUrl: './loja-layout.component.scss',
})
export class LojaLayoutComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private sub: ReturnType<Router['events']['subscribe']> | null = null;

  isScrolled = signal(false);
  mobileMenuOpen = signal(false);
  currentYear = new Date().getFullYear();

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 100);
  }

  ngOnInit(): void {
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.scrollToFragmentFromUrl());
    // Tratar fragmento na carga inicial (ex.: /loja#produtos)
    setTimeout(() => this.scrollToFragmentFromUrl(), 100);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private scrollToFragmentFromUrl(): void {
    const frag = this.router.parseUrl(this.router.url).fragment;
    if (frag && this.isLojaHome()) {
      setTimeout(() => this.doScrollToSection(frag), 150);
    }
  }

  private isLojaHome(): boolean {
    const path = this.router.url.split('#')[0].split('?')[0].replace(/\/$/, '');
    return path === '/loja';
  }

  scrollToSection(id: string): void {
    this.mobileMenuOpen.set(false);
    this.doScrollToSection(id);
  }

  private doScrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Navega para uma secção: se já estamos na home da loja, faz só scroll; senão navega para /loja#fragment. */
  handleSectionClick(event: Event, sectionId: string): void {
    this.closeMobileMenu();
    if (this.isLojaHome()) {
      event.preventDefault();
      this.doScrollToSection(sectionId);
      this.router.navigate([], { fragment: sectionId, replaceUrl: true });
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
