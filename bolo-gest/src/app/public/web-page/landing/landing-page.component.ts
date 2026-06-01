import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@app/services/auth.service';
import { API_URL } from '@app/core/config/api.config';
import { PublicSiteNavComponent } from '../public-site-nav/public-site-nav.component';
import { RegistrationFlowService } from '@app/core/registration/registration-flow.service';

/** Página inicial pública (marketing). Parte do módulo de rotas `web-page`. */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicSiteNavComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private title = inject(Title);
  private http = inject(HttpClient);
  private host = inject(ElementRef<HTMLElement>);
  private platformId = inject(PLATFORM_ID);
  private registrationFlow = inject(RegistrationFlowService);
  private revealObserver: IntersectionObserver | null = null;
  private heroSlideTimer: ReturnType<typeof setInterval> | null = null;

  readonly currentYear = new Date().getFullYear();

  /** Slideshow da secção «Haaa djo!» (lado direito). */
  readonly heroSlides = [
    { src: '/t.jpg', alt: 'Confeiteira a decorar bolos com o ChefControl na cozinha' },
    { src: '/t%20(1).jpg', alt: 'Chef a gerir o negócio com o dashboard ChefControl' },
    { src: '/t%20(2).jpg', alt: 'Croissants frescos — produto de confeitaria' },
  ] as const;
  heroSlideIndex = 0;
  readonly maxSuggestionChars = 350;
  suggestionCharCount = 0;
  suggestionSending = false;
  suggestionPopup = { open: false, type: 'success' as 'success' | 'error', message: '' };
  private suggestionPopupTimer: any = null;

  ngOnInit(): void {
    this.title.setTitle('ChefControl - Gestão para Confeiteiras');
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
    this.initSectionReveals();
    this.startHeroSlideAutoplay();
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
    this.revealObserver = null;
    this.stopHeroSlideAutoplay();
  }

  goToHeroSlide(index: number): void {
    const total = this.heroSlides.length;
    this.heroSlideIndex = ((index % total) + total) % total;
  }

  nextHeroSlide(): void {
    this.goToHeroSlide(this.heroSlideIndex + 1);
  }

  prevHeroSlide(): void {
    this.goToHeroSlide(this.heroSlideIndex - 1);
  }

  private startHeroSlideAutoplay(): void {
    this.stopHeroSlideAutoplay();
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    this.heroSlideTimer = setInterval(() => this.nextHeroSlide(), 5500);
  }

  private stopHeroSlideAutoplay(): void {
    if (this.heroSlideTimer) {
      clearInterval(this.heroSlideTimer);
      this.heroSlideTimer = null;
    }
  }

  private initSectionReveals(): void {
    const root = this.host.nativeElement;
    const targets = Array.from(root.querySelectorAll('[data-landing-reveal]')) as HTMLElement[];
    if (!targets.length) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      targets.forEach((el) => el.classList.add('landing-reveal--visible'));
      return;
    }

    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('landing-reveal--visible', entry.isIntersecting);
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
    );

    targets.forEach((el) => {
      this.revealObserver!.observe(el);
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.92 && rect.bottom > window.innerHeight * 0.08;
      if (inView) {
        el.classList.add('landing-reveal--visible');
      }
    });
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
      void this.router.navigate(['/license-payment'], {
        queryParams: phone ? { phone, from: 'register' } : { from: 'register' },
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
