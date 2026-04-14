import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StoreSettingsService } from '../../services/store-settings.service';
import { StoreContextService } from '../../services/store-context.service';
import { FormsModule } from '@angular/forms';
import {
  DOCES_SUBCATEGORIES,
  DOCES_SIZES_BY_NAME,
  DOCES_SIZES_BY_NUMBER,
  SALGADOS_SUBCATEGORIES,
  type OrderCategory,
} from '../../models/order.model';
import { WEB_STORE_URL_SEGMENT } from './web-store.routes.const';

@Component({
  selector: 'app-web-store-contact',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './web-store-contact.component.html',
  styleUrl: './web-store-contact.component.scss',
})
export class WebStoreContactComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private storeSettings = inject(StoreSettingsService);
  storeContext = inject(StoreContextService);

  readonly docesSubcategories = DOCES_SUBCATEGORIES;
  readonly salgadosSubcategories = SALGADOS_SUBCATEGORIES;
  readonly docesSizesByName = DOCES_SIZES_BY_NAME;
  readonly docesSizesByNumber = DOCES_SIZES_BY_NUMBER;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? this.route.snapshot.parent?.paramMap.get('slug');
    if (slug) {
      this.storeSettings.getStoreBySlug(slug).then(s => this.storeContext.setStore(s)).catch(() => this.storeContext.setStore(null));
    } else {
      this.storeContext.setStore(null);
    }
  }

  category = signal<OrderCategory | null>(null);
  sizeType: 'nome' | 'numero' | null = null;
  isSubmitted = signal(false);

  formData = {
    clientName: '',
    clientContact: '',
    email: '',
    clientAddress: '',
    subcategory: '',
    productName: '',
    size: '',
    sizeNumberCustom: null as number | null,
    quantityKg: null as number | null,
    unitsPerKg: null as number | null,
    deliveryDate: '',
    deliveryTime: '',
    hasDelivery: null as boolean | null,
    deliveryAddress: '',
    deliveryCost: null as number | null,
    observations: '',
  };

  setCategory(cat: OrderCategory): void {
    this.category.set(cat);
    this.sizeType = null;
    this.formData.subcategory = '';
    this.formData.size = '';
    this.formData.sizeNumberCustom = null;
    this.formData.quantityKg = null;
    this.formData.unitsPerKg = null;
  }

  setSizeType(type: 'nome' | 'numero'): void {
    this.sizeType = type;
    this.formData.size = '';
    this.formData.sizeNumberCustom = null;
  }

  setHasDelivery(value: boolean): void {
    this.formData.hasDelivery = value;
    if (!value) {
      this.formData.deliveryAddress = '';
      this.formData.deliveryCost = null;
    }
  }

  get isDoces(): boolean {
    return this.category() === 'doces';
  }

  get isSalgados(): boolean {
    return this.category() === 'salgados';
  }

  publicStoreBasePath(): string[] {
    const slug = this.storeContext.storeSlug();
    const root = `/${WEB_STORE_URL_SEGMENT}`;
    return slug ? [root, slug] : [root];
  }

  /** Substitui newlines por <br> para innerHTML */
  nl2br(text: string): string {
    return (text || '').replace(/\n/g, '<br>');
  }

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }

  submit(): void {
    this.isSubmitted.set(true);
    setTimeout(() => {
      this.isSubmitted.set(false);
      this.category.set(null);
      this.sizeType = null;
      this.formData = {
        clientName: '',
        clientContact: '',
        email: '',
        clientAddress: '',
        subcategory: '',
        productName: '',
        size: '',
        sizeNumberCustom: null,
        quantityKg: null,
        unitsPerKg: null,
        deliveryDate: '',
        deliveryTime: '',
        hasDelivery: null,
        deliveryAddress: '',
        deliveryCost: null,
        observations: '',
      };
    }, 4000);
  }
}
