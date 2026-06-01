import { Component, signal, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { StoreContextService } from '../../services/store-context.service';
import { WEB_STORE_URL_SEGMENT } from './web-store.routes.const';

@Component({
  selector: 'app-web-store-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './web-store-layout.component.html',
  styleUrl: './web-store-layout.component.scss',
})
export class WebStoreLayoutComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  storeContext = inject(StoreContextService);
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
    setTimeout(() => this.scrollToFragmentFromUrl(), 100);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private scrollToFragmentFromUrl(): void {
    const frag = this.router.parseUrl(this.router.url).fragment;
    if (frag && this.isWebStoreHome()) {
      setTimeout(() => this.doScrollToSection(frag), 150);
    }
  }

  /** Base path: /store or /store/:slug */
  publicStoreBasePath(): string[] {
    const slug = this.storeContext.storeSlug();
    const root = `/${WEB_STORE_URL_SEGMENT}`;
    return slug ? [root, slug] : [root];
  }

  /** Contact route */
  contactRoute(): string[] {
    const slug = this.storeContext.storeSlug();
    const root = `/${WEB_STORE_URL_SEGMENT}`;
    return slug ? [root, slug, 'contato'] : [root, 'contato'];
  }

  /** Order tracking route */
  trackOrderRoute(): string[] {
    const slug = this.storeContext.storeSlug();
    const root = `/${WEB_STORE_URL_SEGMENT}`;
    return slug ? [root, slug, 'rastreio'] : [root, 'rastreio'];
  }

  nl2br(text: string): string {
    return (text || '').replace(/\n/g, '<br>');
  }

  private isWebStoreHome(): boolean {
    const path = this.router.url.split('#')[0].split('?')[0].replace(/\/$/, '');
    const base = `/${WEB_STORE_URL_SEGMENT}`;
    return path === base || path.startsWith(`${base}/`);
  }

  scrollToSection(id: string): void {
    this.mobileMenuOpen.set(false);
    this.doScrollToSection(id);
  }

  private doScrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  handleSectionClick(event: Event, sectionId: string): void {
    this.closeMobileMenu();
    if (this.isWebStoreHome()) {
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
