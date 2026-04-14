import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StoreSettingsService } from '../../services/store-settings.service';
import { StoreContextService } from '../../services/store-context.service';
import { WEB_STORE_URL_SEGMENT } from './web-store.routes.const';

interface HeroSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  ctaRoute: string;
  ctaFragment: string | undefined;
  accentClass: string;
}

@Component({
  selector: 'app-web-store-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './web-store-home.component.html',
  styleUrl: './web-store-home.component.scss',
})
export class WebStoreHomeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private storeSettings = inject(StoreSettingsService);
  storeContext = inject(StoreContextService);

  currentSlide = signal(0);
  activeCategory = signal('todos');
  selectedProduct = signal<{ id: number; name: string; price: string; image: string; description: string; rating: number } | null>(null);
  selectedImage = signal<{ src: string; alt: string; category: string } | null>(null);
  selectedProject = signal<{ title: string; category: string; image: string; description: string; details: string; date: string; guests: string; highlights: string[] } | null>(null);
  currentTestimonial = signal(0);
  isVisible = signal(false);
  likedImages = signal<number[]>([]);

  /** Normaliza fragment para o RouterLink (aceita apenas string | undefined). */
  getFragment(slide: HeroSlide): string | undefined {
    return slide.ctaFragment ?? undefined;
  }

  getCtaRoute(slide: HeroSlide): string[] {
    const slug = this.storeContext.storeSlug();
    const contactPath = `/${WEB_STORE_URL_SEGMENT}/contato`;
    if (slide.ctaRoute === contactPath) {
      return this.contactRoute();
    }
    return this.publicStoreBasePath();
  }

  contactRoute(): string[] {
    const slug = this.storeContext.storeSlug();
    const root = `/${WEB_STORE_URL_SEGMENT}`;
    return slug ? [root, slug, 'contato'] : [root, 'contato'];
  }

  publicStoreBasePath(): string[] {
    const slug = this.storeContext.storeSlug();
    const root = `/${WEB_STORE_URL_SEGMENT}`;
    return slug ? [root, slug] : [root];
  }

  readonly slides: HeroSlide[] = [
    { id: 1, image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1920&q=80', title: 'Sabor que Encanta', subtitle: 'Qualidade que Surpreende!', description: 'Bolos artesanais feitos com amor e os melhores ingredientes para tornar seus momentos especiais ainda mais doces.', cta: 'FAÇA SEU PEDIDO', ctaRoute: `/${WEB_STORE_URL_SEGMENT}/contato`, ctaFragment: undefined, accentClass: 'gradient-pink-purple' },
    { id: 2, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1920&q=80', title: 'Doces Irresistíveis', subtitle: 'Para Toda Ocasião!', description: 'De aniversários a casamentos, criamos sobremesas personalizadas que encantam os olhos e o paladar.', cta: 'CONHEÇA NOSSOS PRODUTOS', ctaRoute: `/${WEB_STORE_URL_SEGMENT}`, ctaFragment: 'produtos', accentClass: 'gradient-purple-teal' },
    { id: 3, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1920&q=80', title: 'Momentos Doces', subtitle: 'Memórias Eternas!', description: 'Transforme seus eventos em experiências inesquecíveis com nossa seleção de doces e salgados artesanais.', cta: 'VER GALERIA', ctaRoute: `/${WEB_STORE_URL_SEGMENT}`, ctaFragment: 'galeria', accentClass: 'gradient-yellow-orange' },
  ];

  readonly products = [
    { id: 1, name: 'Bolo de Morango', category: 'bolos', price: '3 500 MZN', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80', description: 'Delicioso bolo de morango com camadas de creme e frutas frescas.', rating: 5, badge: 'Mais Vendido' },
    { id: 2, name: 'Brigadeiros Gourmet', category: 'doces', price: '250 MZN', image: 'https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=600&q=80', description: 'Brigadeiros artesanais com chocolate belga de alta qualidade.', rating: 5 },
    { id: 3, name: 'Cupcakes Coloridos', category: 'doces', price: '890 MZN', image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=600&q=80', description: 'Cupcakes decorados com buttercream em tons pastel.', rating: 4, badge: 'Novo' },
    { id: 4, name: 'Coxinhas Especiais', category: 'salgados', price: '450 MZN', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80', description: 'Coxinhas crocantes com recheio cremoso de frango.', rating: 5 },
    { id: 5, name: 'Docinhos Variados', category: 'doces', price: '180 MZN', image: 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=600&q=80', description: 'Seleção de docinhos tradicionais brasileiros.', rating: 5 },
    { id: 6, name: 'Mini Quiches', category: 'salgados', price: '690 MZN', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80', description: 'Mini quiches com diversos sabores e ingredientes frescos.', rating: 4 },
  ];

  readonly categories = [
    { id: 'todos', name: 'Todos' },
    { id: 'bolos', name: 'Bolos' },
    { id: 'doces', name: 'Doces' },
    { id: 'salgados', name: 'Salgados' },
  ];

  readonly galleryImages = [
    { id: 1, src: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80', alt: 'Red Velvet Cake', category: 'Bolos' },
    { id: 2, src: 'https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=600&q=80', alt: 'Cake Pops', category: 'Doces' },
    { id: 3, src: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80', alt: 'Naked Cake', category: 'Bolos' },
    { id: 4, src: 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=600&q=80', alt: 'Pastéis', category: 'Doces' },
    { id: 5, src: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80', alt: 'Drip Cake', category: 'Bolos' },
    { id: 6, src: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=600&q=80', alt: 'Torta', category: 'Tortas' },
  ];

  readonly galleryCategories = ['Todos', 'Bolos', 'Doces', 'Tortas'];

  readonly projects = [
    { id: 1, title: 'Aniversário de 15 Anos - Maria', category: 'Aniversário', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80', description: 'Uma festa de debutante inesquecível com tema rosa e dourado.', details: 'Mesa de doces com mais de 20 variedades, bolo de 4 andares e macarons personalizados. 150 convidados.', date: 'Dezembro 2024', guests: '150 convidados', highlights: ['Bolo de 4 andares', 'Mesa de doces', 'Macarons', 'Cupcakes'] },
    { id: 2, title: 'Casamento - Ana & João', category: 'Casamento', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', description: 'Um casamento dos sonhos com decoração romântica e elegante.', details: 'Bolo de casamento de 5 andares, mesa de doces sofisticada e sobremesas individuais.', date: 'Novembro 2024', guests: '200 convidados', highlights: ['Bolo de 5 andares', 'Docinhos finos', 'Torre de macarons'] },
    { id: 3, title: 'Evento Corporativo - TechCorp', category: 'Corporativo', image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80', description: 'Coffee break executivo para lançamento de produto.', details: 'Buffet completo com opções doces e salgadas, bolo personalizado com logo da empresa.', date: 'Outubro 2024', guests: '80 convidados', highlights: ['Bolo personalizado', 'Croissants', 'Docinhos gourmet'] },
  ];

  readonly testimonials = [
    { id: 1, name: 'Maria Silva', role: 'Cliente desde 2022', avatar: 'https://i.pravatar.cc/100?img=1', content: 'A Doce Sabor transformou o aniversário da minha filha em um dia mágico! O bolo estava não apenas lindo, mas delicioso.', rating: 5 },
    { id: 2, name: 'Ana Paula', role: 'Noiva', avatar: 'https://i.pravatar.cc/100?img=5', content: 'Não poderia ter escolhido melhor confeitaria para o meu casamento. O bolo dos sonhos se tornou realidade!', rating: 5 },
    { id: 3, name: 'Carlos Mendes', role: 'Empresário', avatar: 'https://i.pravatar.cc/100?img=3', content: 'Contratamos a Doce Sabor para um evento corporativo. A apresentação e o sabor foram impecáveis!', rating: 5 },
  ];

  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? this.route.snapshot.parent?.paramMap.get('slug');
    if (slug) {
      this.storeSettings.getStoreBySlug(slug).then(s => this.storeContext.setStore(s)).catch(() => this.storeContext.setStore(null));
    } else {
      this.storeContext.setStore(null);
    }

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) this.isVisible.set(true);
      },
      { threshold: 0.1 }
    );
    const el = document.querySelector('.web-store-home');
    if (el) this.observer.observe(el);

    setInterval(() => {
      this.currentSlide.set((this.currentSlide() + 1) % this.slides.length);
    }, 5000);
  }

  goToSlide(i: number): void {
    this.currentSlide.set(i);
  }

  nextSlide(): void {
    this.currentSlide.set((this.currentSlide() + 1) % this.slides.length);
  }

  prevSlide(): void {
    this.currentSlide.set((this.currentSlide() - 1 + this.slides.length) % this.slides.length);
  }

  setCategory(id: string): void {
    this.activeCategory.set(id);
  }

  filteredProducts() {
    const cat = this.activeCategory();
    if (cat === 'todos') return this.products;
    return this.products.filter((p) => p.category === cat);
  }

  openProduct(p: (typeof this.products)[0]): void {
    this.selectedProduct.set(p);
  }

  closeProduct(): void {
    this.selectedProduct.set(null);
  }

  openImage(img: { src: string; alt: string; category: string }): void {
    this.selectedImage.set(img);
  }

  closeImage(): void {
    this.selectedImage.set(null);
  }

  openProject(p: (typeof this.projects)[0]): void {
    this.selectedProject.set(p);
  }

  closeProject(): void {
    this.selectedProject.set(null);
  }

  nextTestimonial(): void {
    this.currentTestimonial.set((this.currentTestimonial() + 1) % this.testimonials.length);
  }

  prevTestimonial(): void {
    this.currentTestimonial.set((this.currentTestimonial() - 1 + this.testimonials.length) % this.testimonials.length);
  }

  toggleLike(id: number): void {
    this.likedImages.update((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]
    );
  }
}
