import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import type gsap from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';

const PUBLIC_PAGE_SELECTORS =
  'app-web-page-layout, app-landing-page, app-contact-page, app-legal-document-page, app-login, app-register, app-recover-password, app-post-register-plan';

type GsapRuntime = {
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTriggerType;
};

@Injectable({ providedIn: 'root' })
export class PublicPageMotionService {
  private readonly platformId = inject(PLATFORM_ID);
  private runtime: GsapRuntime | null = null;
  private loadPromise: Promise<GsapRuntime | null> | null = null;
  private routerBound = false;
  private outletRouterBound = false;
  private previousUrl = '';

  prefersReducedMotion(): boolean {
    if (!isPlatformBrowser(this.platformId)) return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** Carrega GSAP sob demanda (chunk separado — não bloqueia login nem dashboard). */
  private loadGsap(): Promise<GsapRuntime | null> {
    if (!isPlatformBrowser(this.platformId) || this.prefersReducedMotion()) {
      return Promise.resolve(null);
    }
    if (this.runtime) return Promise.resolve(this.runtime);
    if (!this.loadPromise) {
      this.loadPromise = Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([gsapMod, stMod]) => {
        gsapMod.default.registerPlugin(stMod.ScrollTrigger);
        this.runtime = { gsap: gsapMod.default, ScrollTrigger: stMod.ScrollTrigger };
        return this.runtime;
      });
    }
    return this.loadPromise;
  }

  /** Agrupa rotas do site marketing (landing, contacto, legais) no mesmo shell. */
  private marketingRoutePath(url: string): string {
    return url.split('?')[0].split('#')[0] || '/';
  }

  private isMarketingRoute(url: string): boolean {
    const path = this.marketingRoutePath(url);
    return path === '/' || path === '/contacto' || path === '/termos' || path === '/privacidade';
  }

  /** Rotas da app autenticada — sem GSAP de entrada/saída (evita travamentos). */
  private isAppRoute(url: string): boolean {
    const path = this.marketingRoutePath(url);
    if (this.isMarketingRoute(url)) return false;
    if (path === '/login' || path.startsWith('/recover-password') || path === '/recuperar-senha') return false;
    if (path === '/register' || path === '/registro' || path === '/choose-plan' || path === '/escolher-plano') {
      return false;
    }
    if (path === '/license-payment' || path.startsWith('/pagamento')) return false;
    if (path.startsWith('/store') || path.startsWith('/loja')) return false;
    return true;
  }

  /** Chave de shell para transições entre ecrãs públicos (não inclui dashboard/admin). */
  private routeShellKey(url: string): string {
    if (this.isAppRoute(url)) return 'app';
    const path = this.marketingRoutePath(url);
    if (this.isMarketingRoute(url)) return 'marketing';
    if (path === '/login' || path.startsWith('/recover-password') || path === '/recuperar-senha') return 'auth';
    if (path === '/register' || path === '/registro' || path === '/choose-plan' || path === '/escolher-plano') {
      return 'register';
    }
    if (path === '/license-payment' || path.startsWith('/pagamento')) return 'license-payment';
    return 'public';
  }

  /** Só anima transições entre páginas de marketing (início ↔ contacto, etc.). */
  private shouldAnimateShellTransition(fromShell: string, toShell: string): boolean {
    if (fromShell === 'app' || toShell === 'app') return false;
    if (fromShell === toShell) return false;
    return fromShell === 'marketing' && toShell === 'marketing';
  }

  /** Troca de rota filha no layout marketing (landing ↔ contacto) — tratada pelo outlet. */
  private isMarketingChildRouteChange(fromUrl: string, toUrl: string): boolean {
    const fromPath = this.marketingRoutePath(fromUrl);
    const toPath = this.marketingRoutePath(toUrl);
    return this.isMarketingRoute(fromUrl) && this.isMarketingRoute(toUrl) && fromPath !== toPath;
  }

  /** Transições dramáticas entre shells públicos (início ↔ login ↔ registo, etc.). */
  bindPublicRouteTransitions(router: Router): void {
    if (!isPlatformBrowser(this.platformId) || this.routerBound) return;
    this.routerBound = true;
    this.previousUrl = router.url;

    if (this.prefersReducedMotion()) return;

    router.events
      .pipe(filter((e) => e instanceof NavigationStart || e instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          const fromShell = this.routeShellKey(this.previousUrl);
          const toShell = this.routeShellKey(event.url);
          if (this.isMarketingChildRouteChange(this.previousUrl, event.url)) {
            return;
          }
          if (this.shouldAnimateShellTransition(fromShell, toShell)) {
            const leaving = this.findActivePublicHost();
            if (leaving) void this.animateMarketingPageExit(leaving);
          } else {
            const leaving = this.findActivePublicHost();
            if (leaving) this.preparePublicHostEnter(leaving);
          }
          return;
        }
        const fromShell = this.routeShellKey(this.previousUrl);
        const toShell = this.routeShellKey(event.url);
        if (this.isMarketingChildRouteChange(this.previousUrl, event.url)) {
          this.previousUrl = event.url;
          return;
        }
        if (this.shouldAnimateShellTransition(fromShell, toShell)) {
          this.scheduleMarketingPageEnter(() => this.findActivePublicHost());
        } else {
          requestAnimationFrame(() => {
            const entering = this.findActivePublicHost();
            if (entering) this.preparePublicHostEnter(entering);
          });
        }
        this.previousUrl = event.url;
      });

    requestAnimationFrame(() => {
      const host = this.findActivePublicHost();
      if (host) this.preparePublicHostEnter(host);
    });
  }

  findActivePublicHost(): HTMLElement | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return document.querySelector(PUBLIC_PAGE_SELECTORS) as HTMLElement | null;
  }

  /** Host activo dentro de um router-outlet (ex.: landing vs contacto no mesmo layout). */
  findOutletPageHost(containerEl: HTMLElement): HTMLElement | null {
    const routed = containerEl.querySelector(
      'app-landing-page, app-contact-page, app-legal-document-page',
    ) as HTMLElement | null;
    if (routed) return routed;

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

  /** Duplo rAF: garante que o host do outlet já está no DOM (especialmente em mobile). */
  private scheduleMarketingPageEnter(resolveHost: () => HTMLElement | null): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const host = resolveHost();
        if (host) void this.animateMarketingPageEnter(host);
      });
    });
  }

  bindOutletRouteTransitions(router: Router, containerEl: HTMLElement): void {
    if (!isPlatformBrowser(this.platformId) || this.outletRouterBound) return;
    this.outletRouterBound = true;

    if (this.prefersReducedMotion()) return;

    void this.loadGsap();

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
            if (host) void this.animateMarketingPageExit(host);
          }
          return;
        }
        const nextPath = this.marketingRoutePath(event.url);
        if (
          this.isMarketingRoute(previousPath) &&
          this.isMarketingRoute(event.url) &&
          previousPath !== nextPath
        ) {
          this.scheduleMarketingPageEnter(() => this.findOutletPageHost(containerEl));
        }
        previousPath = nextPath;
      });
  }

  /** Login, registo e app: sem animação GSAP (evita página presa). */
  resetHostVisible(host: HTMLElement): void {
    this.runtime?.gsap.killTweensOf(host);
    host.style.opacity = '1';
    host.style.transform = '';
    host.style.filter = '';
  }

  /**
   * Prepara o host ao entrar: login usa fade-in CSS (não forçar opacity inline).
   */
  preparePublicHostEnter(host: HTMLElement): void {
    this.runtime?.gsap.killTweensOf(host);
    host.style.transform = '';
    host.style.filter = '';
    if (host.tagName === 'APP-LOGIN') {
      host.style.removeProperty('opacity');
      return;
    }
    host.style.opacity = '1';
  }

  /** Transição suave só entre páginas do site público (landing ↔ contacto). */
  async animateMarketingPageEnter(host: HTMLElement): Promise<void> {
    const rt = await this.loadGsap();
    if (!rt) {
      this.resetHostVisible(host);
      return;
    }
    const { gsap } = rt;
    gsap.killTweensOf(host);
    gsap.fromTo(
      host,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: 'power2.out',
        clearProps: 'transform',
      },
    );
  }

  async animateMarketingPageExit(host: HTMLElement): Promise<void> {
    const rt = await this.loadGsap();
    if (!rt) return;
    const { gsap } = rt;
    gsap.killTweensOf(host);
    gsap.to(host, {
      opacity: 0,
      y: -10,
      duration: 0.22,
      ease: 'power2.in',
    });
  }

  /** Hero + secções com reveal ao scroll na landing. Devolve função de limpeza. */
  async initLandingMotion(root: HTMLElement): Promise<() => void> {
    const rt = await this.loadGsap();
    if (!rt) {
      root.querySelectorAll('[data-landing-reveal-child]').forEach((el) => {
        (el as HTMLElement).classList.add('landing-reveal--visible');
      });
      return () => undefined;
    }

    const { gsap, ScrollTrigger } = rt;
    const triggers: InstanceType<typeof ScrollTrigger>[] = [];
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
      tweens.push(...(heroTl.getChildren() as gsap.core.Tween[]));

      const mock = hero.querySelector('.landing-hero__mock, .lp-dashboard-mock');
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
            onComplete: () => {
              children.forEach((child) => {
                if (child.querySelector('.hero-slider')) {
                  gsap.set(child, { clearProps: 'opacity,transform' });
                }
              });
            },
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

    const refreshScroll = () => ScrollTrigger.refresh();
    ScrollTrigger.refresh();
    window.addEventListener('resize', refreshScroll);
    window.addEventListener('orientationchange', refreshScroll);

    return () => {
      window.removeEventListener('resize', refreshScroll);
      window.removeEventListener('orientationchange', refreshScroll);
      triggers.forEach((t) => t.kill());
      tweens.forEach((t) => t.kill());
      gsap.killTweensOf(root.querySelectorAll('[data-landing-reveal-child], .lp-dashboard-mock, .lp-feature-card'));
      ScrollTrigger.getAll().forEach((st) => {
        if (root.contains(st.trigger as Node)) st.kill();
      });
    };
  }
}
