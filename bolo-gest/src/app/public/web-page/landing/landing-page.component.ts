import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@app/services/auth.service';
import { API_URL } from '@app/core/config/api.config';
import { PublicSiteNavComponent } from '../public-site-nav/public-site-nav.component';
import { RegistrationFlowService } from '@app/core/registration/registration-flow.service';
import { PublicPageMotionService } from '../public-page-motion.service';
import { BRAND_ASSETS } from '@app/core/config/brand-assets';

/** Página inicial pública (marketing). Parte do módulo de rotas `web-page`. */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicSiteNavComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly brand = BRAND_ASSETS;
  private auth = inject(AuthService);
  private router = inject(Router);
  private title = inject(Title);
  private http = inject(HttpClient);
  private host = inject(ElementRef<HTMLElement>);
  private platformId = inject(PLATFORM_ID);
  private registrationFlow = inject(RegistrationFlowService);
  private motion = inject(PublicPageMotionService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private teardownLandingMotion: (() => void) | null = null;
  private heroSlideTimer: ReturnType<typeof setInterval> | null = null;
  private heroTouchStartX = 0;
  private heroTouchStartY = 0;
  private readonly onHeroVisibilityChange = (): void => {
    if (document.hidden) {
      this.stopHeroSlideAutoplay();
      return;
    }
    this.startHeroSlideAutoplay();
  };

  readonly currentYear = new Date().getFullYear();

  /** Slideshow da secção «Haaa djo!» (lado direito). */
  readonly heroSlides = [
    { src: '/t.jpg', alt: 'Confeiteira a decorar bolos com o Flow Cakes na cozinha' },
    { src: '/t%20(1).jpg', alt: 'Confeiteira a gerir o negócio com o dashboard Flow Cakes' },
    { src: '/t%20(2).jpg', alt: 'Croissants frescos — produto de confeitaria' },
  ] as const;
  heroSlideIndex = 0;

  /** Depoimentos — slider vertical (6 confeiteiras; fotos locais em /public). */
  readonly testimonials = [
    {
      id: 'ana',
      quote:
        'Finalmente parei de usar cadernos e folhas de cálculo desorganizadas. Agora sei quanto lucro em cada encomenda e quem ainda me deve!',
      name: 'Ana Paula',
      role: '@doces_da_ana',
      stars: 5,
      avatar: '/t.jpg',
      avatarAlt: 'Ana Paula, confeiteira',
    },
    {
      id: 'bruna',
      quote:
        'Ao registar os custos dos ingredientes por pedido, percebi que estava a cobrar muito barato pelos meus bolos personalizados.',
      name: 'Bruna Silva',
      role: 'Confeitaria Artesanal',
      stars: 5,
      avatar: '/t%20(1).jpg',
      avatarAlt: 'Bruna Silva, confeiteira',
    },
    {
      id: 'carla',
      quote:
        'Suporte incrível e sistema muito intuitivo. Consigo ver o meu lucro real no final do mês sem dores de cabeça.',
      name: 'Carla Mendes',
      role: 'Carla Cakes',
      stars: 4.5,
      avatar: '/t%20(2).jpg',
      avatarAlt: 'Carla Mendes, confeiteira',
    },
    {
      id: 'maria',
      quote:
        'Com o Flow Cakes organizo entregas e pagamentos no mesmo dia. Já não perco encomendas por esquecimento no caderno.',
      name: 'Maria Fernandes',
      role: 'Doces da Maria · Maputo',
      stars: 5,
      avatar: '/t%20(3).jpg',
      avatarAlt: 'Maria Fernandes, confeiteira',
    },
    {
      id: 'joana',
      quote:
        'Os relatórios em MZN ajudam-me a planear compras de ingredientes e a saber quando posso retirar dinheiro do negócio.',
      name: 'Joana Costa',
      role: 'Joana Sweet Atelier',
      stars: 5,
      avatar: '/cofeiro.jpg',
      avatarAlt: 'Joana Costa, confeiteira',
    },
    {
      id: 'patricia',
      quote:
        'Controlo dívidas dos clientes com clareza. Quem deve e quanto falta receber aparece logo — isso mudou a minha caixa.',
      name: 'Patrícia Nhampossa',
      role: 'Paty Confeitos',
      stars: 5,
      avatar: '/t.jpg',
      avatarAlt: 'Patrícia Nhampossa, confeiteira',
    },
  ] as const;

  /** Avatares que falharam ao carregar → iniciais no lugar da foto. */
  readonly testimonialAvatarFailed = new Set<string>();

  testimonialIndex = 0;
  private testimonialTimer: ReturnType<typeof setInterval> | null = null;

  readonly maxSuggestionChars = 350;
  suggestionCharCount = 0;
  suggestionSending = false;
  suggestionPopup = { open: false, type: 'success' as 'success' | 'error', message: '' };
  private suggestionPopupTimer: any = null;

  ngOnInit(): void {
    this.title.setTitle('Flow Cakes - Gestão para Confeiteiras');
    if (this.auth.isLoggedIn()) {
      if (this.registrationFlow.mustCompleteOnboarding()) {
        this.redirectIncompleteRegistration();
        return;
      }
      if (this.auth.isAdmin()) {
        void this.router.navigate(['/license-management']);
        return;
      }
      void this.router.navigate(['/dashboard']);
      return;
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    requestAnimationFrame(() => {
      void this.motion.initLandingMotion(this.host.nativeElement).then((teardown) => {
        this.teardownLandingMotion = teardown;
      });
    });
    this.startHeroSlideAutoplay();
    this.startTestimonialAutoplay();
    document.addEventListener('visibilitychange', this.onHeroVisibilityChange);
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.onHeroVisibilityChange);
    this.teardownLandingMotion?.();
    this.teardownLandingMotion = null;
    this.stopHeroSlideAutoplay();
    this.stopTestimonialAutoplay();
  }

  goToTestimonial(index: number): void {
    const total = this.testimonials.length;
    this.testimonialIndex = ((index % total) + total) % total;
  }

  nextTestimonial(): void {
    this.goToTestimonial(this.testimonialIndex + 1);
  }

  prevTestimonial(): void {
    this.goToTestimonial(this.testimonialIndex - 1);
  }

  isTestimonialStarFilled(stars: number, position: number): boolean {
    return position <= Math.floor(stars);
  }

  isTestimonialStarHalf(stars: number, position: number): boolean {
    return stars % 1 !== 0 && position === Math.ceil(stars);
  }

  testimonialStarsLabel(stars: number): string {
    return Number.isInteger(stars) ? `${stars} estrelas` : `${stars} estrelas`;
  }

  testimonialInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  isTestimonialAvatarVisible(id: string): boolean {
    return !this.testimonialAvatarFailed.has(id);
  }

  onTestimonialAvatarError(id: string): void {
    this.testimonialAvatarFailed.add(id);
  }

  private startTestimonialAutoplay(): void {
    this.stopTestimonialAutoplay();
    if (!isPlatformBrowser(this.platformId)) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    this.testimonialTimer = setInterval(() => this.nextTestimonial(), 6000);
  }

  private stopTestimonialAutoplay(): void {
    if (this.testimonialTimer) {
      clearInterval(this.testimonialTimer);
      this.testimonialTimer = null;
    }
  }

  onTestimonialNav(index: number): void {
    this.goToTestimonial(index);
    this.startTestimonialAutoplay();
  }

  onTestimonialPrev(): void {
    this.prevTestimonial();
    this.startTestimonialAutoplay();
  }

  onTestimonialNext(): void {
    this.nextTestimonial();
    this.startTestimonialAutoplay();
  }

  goToHeroSlide(index: number): void {
    const total = this.heroSlides.length;
    this.heroSlideIndex = ((index % total) + total) % total;
    this.cdr.markForCheck();
    this.startHeroSlideAutoplay();
  }

  private nextHeroSlide(): void {
    this.goToHeroSlide(this.heroSlideIndex + 1);
  }

  onHeroSliderTouchStart(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    if (!touch) return;
    this.heroTouchStartX = touch.clientX;
    this.heroTouchStartY = touch.clientY;
  }

  onHeroSliderTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - this.heroTouchStartX;
    const deltaY = touch.clientY - this.heroTouchStartY;
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX < 0) {
      this.nextHeroSlide();
      return;
    }
    this.goToHeroSlide(this.heroSlideIndex - 1);
  }

  private startHeroSlideAutoplay(): void {
    this.stopHeroSlideAutoplay();
    if (!isPlatformBrowser(this.platformId)) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    this.ngZone.runOutsideAngular(() => {
      this.heroSlideTimer = setInterval(() => {
        this.ngZone.run(() => {
          this.nextHeroSlide();
        });
      }, 5500);
    });
  }

  private stopHeroSlideAutoplay(): void {
    if (this.heroSlideTimer) {
      clearInterval(this.heroSlideTimer);
      this.heroSlideTimer = null;
    }
  }

  private redirectIncompleteRegistration(): void {
    const phone = this.registrationFlow.getPhone();
    if (this.registrationFlow.isChoosePlanPhase()) {
      void this.router.navigate(['/choose-plan'], {
        queryParams: phone ? { phone, registered: '1' } : { registered: '1' },
      });
      return;
    }
    if (this.registrationFlow.isFinalizePaid()) {
      void this.router.navigate(['/login'], {
        queryParams: phone ? { phone, finalize: '1' } : { finalize: '1' },
      });
      return;
    }
    this.auth.endSessionWithoutNavigation();
    void this.router.navigate(['/login'], {
      queryParams: phone ? { phone, trial: '1' } : { trial: '1' },
    });
  }

  playDemo(): void {
    window.alert('Em breve: Vídeo demonstrativo completo do sistema!');
  }

  async sendTeamSuggestion(name: string, message: string, textarea: HTMLTextAreaElement, nameInput: HTMLInputElement): Promise<void> {
    const personName = name.trim();
    const suggestion = message.trim();
    if (!personName) {
      this.showSuggestionPopup('error', 'Por favor, informe o seu nome.');
      return;
    }

    if (!suggestion) {
      this.showSuggestionPopup('error', 'Por favor, escreva a sua sugestão antes de enviar.');
      return;
    }

    if (suggestion.length > this.maxSuggestionChars) {
      this.showSuggestionPopup('error', `A sugestão deve ter no máximo ${this.maxSuggestionChars} caracteres.`);
      return;
    }

    const deviceId = this.getOrCreateDeviceId();
    const pageUrl = typeof window !== 'undefined' ? window.location.href : null;

    try {
      this.suggestionSending = true;
      await firstValueFrom(this.http.post(`${API_URL}/public/landing-suggestions`, {
        personName,
        message: suggestion,
        deviceId,
        pageUrl,
      }));

      this.showSuggestionPopup('success', 'Obrigado! A sua sugestão foi recebida pela nossa equipa.');
      nameInput.value = '';
      textarea.value = '';
      this.suggestionCharCount = 0;
    } catch {
      this.showSuggestionPopup('error', 'Não foi possível enviar a sugestão agora. Tente novamente em alguns instantes.');
    } finally {
      this.suggestionSending = false;
    }
  }

  handleSuggestionInput(textarea: HTMLTextAreaElement): void {
    if (textarea.value.length > this.maxSuggestionChars) {
      textarea.value = textarea.value.slice(0, this.maxSuggestionChars);
    }
    this.suggestionCharCount = textarea.value.length;
  }

  private getOrCreateDeviceId(): string {
    const key = 'chefcontrol_device_id';
    try {
      const existing = localStorage.getItem(key)?.trim();
      if (existing) return existing;

      const generated = this.generateDeviceId();
      localStorage.setItem(key, generated);
      return generated;
    } catch {
      return this.generateDeviceId();
    }
  }

  private generateDeviceId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    const randomPart = Math.random().toString(36).slice(2, 10);
    return `device-${Date.now()}-${randomPart}`;
  }

  closeSuggestionPopup(): void {
    this.suggestionPopup = { ...this.suggestionPopup, open: false };
    if (this.suggestionPopupTimer) {
      clearTimeout(this.suggestionPopupTimer);
      this.suggestionPopupTimer = null;
    }
  }

  private showSuggestionPopup(type: 'success' | 'error', message: string): void {
    this.suggestionPopup = { open: true, type, message };
    
    if (type === 'success') {
      this.createConfetti();
      // Auto-fechar após 10 segundos
      if (this.suggestionPopupTimer) {
        clearTimeout(this.suggestionPopupTimer);
      }
      this.suggestionPopupTimer = setTimeout(() => {
        this.closeSuggestionPopup();
      }, 10000);
    }
  }

  private createConfetti(): void {
    const confettiCount = 50;
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomDelay = Math.random() * 0.5;
      const randomDuration = 2 + Math.random() * 1;
      const randomLeft = Math.random() * 100;
      
      confetti.style.backgroundColor = randomColor;
      confetti.style.left = randomLeft + '%';
      confetti.style.setProperty('--duration', randomDuration + 's');
      confetti.style.animationDelay = randomDelay + 's';
      
      container.appendChild(confetti);
    }

    // Remover confetes após animação
    setTimeout(() => {
      container.remove();
    }, 3500);
  }
}
