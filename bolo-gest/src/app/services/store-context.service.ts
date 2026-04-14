import { Injectable, signal, computed } from '@angular/core';
import { StoreSettings } from './store-settings.service';

@Injectable({ providedIn: 'root' })
export class StoreContextService {
  private readonly store = signal<StoreSettings | null>(null);

  readonly storeName = computed(() => this.store()?.storeName ?? 'Doce Sabor');
  readonly storeTagline = computed(() => this.store()?.storeTagline ?? '');
  readonly storeDescription = computed(() => this.store()?.storeDescription ?? '');
  readonly storePhone = computed(() => this.store()?.storePhone ?? '');
  readonly storeWhatsapp = computed(() => this.store()?.storeWhatsapp ?? '');
  readonly storeInstagram = computed(() => this.store()?.storeInstagram ?? '');
  readonly storeAddress = computed(() => this.store()?.storeAddress ?? '');
  readonly storeEmail = computed(() => this.store()?.storeEmail ?? '');
  readonly storeHours = computed(() => this.store()?.storeHours ?? '');
  readonly storeFooterTagline = computed(() => this.store()?.storeFooterTagline ?? '');
  readonly storeSlug = computed(() => this.store()?.storeSlug ?? null);
  readonly hasCustomStore = computed(() => !!this.store());

  setStore(s: StoreSettings | null): void {
    this.store.set(s);
  }
}
