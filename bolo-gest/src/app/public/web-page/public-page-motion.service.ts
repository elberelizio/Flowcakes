import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const PUBLIC_PAGE_SELECTORS =
  'app-web-page-layout, app-landing-page, app-contact-page, app-legal-document-page, app-login, app-register, app-recover-password, app-post-register-plan';

@Injectable({ providedIn: 'root' })
export class PublicPageMotionService {
  private readonly platformId = inject(PLATFORM_ID);
  private gsapReady = false;
  private routerBound = false;
  private outletRouterBound = false;
  private previousUrl = '';

  prefersReducedMotion(): boolean {
    if (!isPlatformBrowser(this.platformId)) return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private ensureGsap(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    if (this.prefersReducedMotion()) return false;
    if (!this.gsapReady) {
      gsap.registerPlugin(ScrollTrigger);
      this.gsapReady = true;
    }
    return true;
  }

  /** Agrupa rotas do site marketing (landing, contacto, legais) no mesmo shell. */
  private marketingRoutePath(url: string): string {
    return url.split('?')[0].split('#')[0] || '/';
  }

  private isMarketingRoute(url: string): boolean {
    const path = this.marketingRoutePath(url);
    return path === '/' || path === '/contacto' || path === '/termos' || path === '/privacidade';
  }

  /** Chave de shell para animar só mudanças de «ecrã» (marketing vs login vs registo). */
  private routeShellKey(url: string): string {
    const path = this.marketingRoutePath(url);
    if (this.isMarketingRoute(url)) return 'marketing';
    if (path === '/login' || path.startsWith('/recover-password') || path === '/recuperar-senha') return 'auth';
    if (path === '/register' || path === '/registro' || path === '/choose-plan' || path === '/escolher-plano') {
      return 'register';
    }
    if (path === '/license-payment' || path.startsWith('/pagamento')) return 'license-payment';
    return path;
  }

  /** Transições dramáticas entre shells públicos (início ↔ login ↔ registo, etc.). */
  bindPublicRouteTransitions(router: Router): void {
    if (!isPlatformBrowser(this.platformId) || this.routerBound) return;
    this.routerBound = true;
    this.previousUrl = router.url;

    if (this.prefersReducedMotion()) return;
    this.ensureGsap();

    router.events
      .pipe(filter((e) => e instanceof NavigationStart || e instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          const fromShell = this.routeShellKey(this.previousUrl);
          const toShell = this.routeShellKey(event.url);
          if (fromShell !== toShell) {
            const leaving = this.findActivePublicHost();
            if (leaving) this.animatePageExit(leaving);
          }
          return;
        }
        const fromShell = this.routeShellKey(this.previousUrl);
        const toShell = this.routeShellKey(event.url);
        if (fromShell !== toShell) {
          requestAnimationFrame(() => {
            const entering = this.findActivePublicHost();
            if (entering) this.animatePageEnter(entering);
          });
        }
        this.previousUrl = event.url;
      });

    requestAnimationFrame(() => {
      const host = this.findActivePublicHost();
      if (host) this.animatePageEnter(host);
    });
  }

  findActivePublicHost(): HTMLElement | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return document.querySelector(PUBLIC_PAGE_SELECTORS) as HTMLElement | null;
  }

  /** Host activo dentro de um router-outlet (ex.: landing vs contacto no mesmo layout). */
  findOutletPageHost(containerEl: HTMLElement): HTMLElement | null {
    const outlet = containerEl.querySelector('router-outlet');
    if (!outlet) return null;
    let sibling = outlet.nextElementSibling;
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName !== 'ROUTER-OUTLET') {
        return sibling as HTMLElement;
      }
      sibling = sibling.nextElementSibling;
    }
    return null;
  }

  bindOutletRouteTransitions(router: Router, containerEl: HTMLElement): void {
    if (!isPlatformBrowser(this.platformId) || this.outletRouterBound) return;
    this.outletRouterBound = true;

    if (this.prefersReducedMotion()) return;
    this.ensureGsap();

    let previousPath = this.marketingRoutePath(router.url);

    router.events
      .pipe(filter((e) => e instanceof NavigationStart || e instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          const nextPath = this.marketingRoutePath(event.url);
          if (
            this.isMarketingRoute(previousPath) &&
            this.isMarketingRoute(event.url) &&
            previousPath !== nextPath
          ) {
            const host = this.findOutletPageHost(containerEl);
            if (host) this.animatePageExit(host);
          }
          return;
        }
        const nextPath = this.marketingRoutePath(event.url);
        if (
          this.isMarketingRoute(previousPath) &&
          this.isMarketingRoute(event.url) &&
          previousPath !== nextPath
        ) {
          requestAnimationFrame(() => {
            const next = this.findOutletPageHost(containerEl);
            if (next) this.animatePageEnter(next);
          });
        }
        previousPath = nextPath;
      });
  }

  animatePageEnter(host: HTMLElement): void {
    if (!this.ensureGsap()) {
      host.style.opacity = '1';
      return;
    }
    gsap.killTweensOf(host);
    gsap.fromTo(
      host,
      {
        opacity: 0,
        y: 72,
        scale: 0.94,
        rotateX: 6,
        filter: 'blur(14px)',
        transformOrigin: '50% 20%',
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        filter: 'blur(0px)',
        duration: 0.95,
        ease: 'power4.out',
        clearProps: 'filter,transform',
      },
    );
  }

  animatePageExit(host: HTMLElement): void {
    if (!this.ensureGsap()) return;
    gsap.killTweensOf(host);
    gsap.to(host, {
      opacity: 0,
      y: -56,
      scale: 0.96,
      rotateX: -4,
      filter: 'blur(10px)',
      duration: 0.42,
      ease: 'power3.in',
      transformOrigin: '50% 30%',
    });
  }

  /** Hero + secções com reveal ao scroll na landing. Devolve função de limpeza. */
  initLandingMotion(root: HTMLElement): () => void {
    if (!this.ensureGsap()) {
      root.querySelectorAll('[data-landing-reveal-child]').forEach((el) => {
        (el as HTMLElement).classList.add('landing-reveal--visible');
      });
      return () => undefined;
    }

    const triggers: ScrollTrigger[] = [];
    const tweens: gsap.core.Tween[] = [];

    const hero = root.querySelector('[data-landing-hero]');
    if (hero) {
      const heroChildren = hero.querySelectorAll('[data-landing-reveal-child]');
      gsap.set(heroChildren, {
        opacity: 0,
        y: 88,
        scale: 0.9,
        rotateX: 14,
        transformPerspective: 900,
        transformOrigin: '50% 80%',
      });
      const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      heroTl.to(heroChildren, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        duration: 1.15,
        stagger: 0.14,
      });
      tweens.push(...heroTl.getChildren() as gsap.core.Tween[]);

      const mock = hero.querySelector('.lp-dashboard-mock');
      if (mock) {
        gsap.to(mock, {
          y: -10,
          rotation: -2,
          duration: 2.8,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
      }
    }

    const sections = Array.from(root.querySelectorAll('[data-landing-reveal]:not([data-landing-hero])'));
    sections.forEach((section) => {
      const children = section.querySelectorAll('[data-landing-reveal-child]');
      if (!children.length) return;

      gsap.set(children, {
        opacity: 0,
        y: 64,
        scale: 0.94,
        rotateX: 10,
        transformPerspective: 800,
        transformOrigin: '50% 100%',
      });

      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top 86%',
        once: true,
        onEnter: () => {
          gsap.to(children, {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateX: 0,
            duration: 1.15,
            stagger: 0.11,
            ease: 'power4.out',
            overwrite: 'auto',
          });
        },
      });
      triggers.push(st);
    });

    const featureCards = root.querySelectorAll('.lp-feature-card');
    featureCards.forEach((card) => {
      const st = ScrollTrigger.create({
        trigger: card,
        start: 'top 92%',
        toggleActions: 'play none none reverse',
        onEnter: () => {
          gsap.fromTo(
            card,
            { boxShadow: '0 0 0 rgba(13,148,136,0)' },
            {
              boxShadow: '0 12px 40px -16px rgba(13,148,136,0.35)',
              duration: 0.6,
              ease: 'power2.out',
            },
          );
        },
        onLeaveBack: () => {
          gsap.to(card, { boxShadow: '0 0 0 rgba(13,148,136,0)', duration: 0.35 });
        },
      });
      triggers.push(st);
    });

    ScrollTrigger.refresh();

    return () => {
      triggers.forEach((t) => t.kill());
      tweens.forEach((t) => t.kill());
      gsap.killTweensOf(root.querySelectorAll('[data-landing-reveal-child], .lp-dashboard-mock, .lp-feature-card'));
      ScrollTrigger.getAll().forEach((st) => {
        if (root.contains(st.trigger as Node)) st.kill();
      });
    };
  }
}
