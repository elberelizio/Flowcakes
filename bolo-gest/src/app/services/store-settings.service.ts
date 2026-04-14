import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../core/config/api.config';

export interface StoreSettings {
  storeName?: string;
  storeTagline?: string;
  storeDescription?: string;
  storePhone?: string;
  storeWhatsapp?: string;
  storeInstagram?: string;
  storeAddress?: string;
  storeEmail?: string;
  storeHours?: string;
  storeFooterTagline?: string;
  storeSlug?: string;
  storeUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class StoreSettingsService {

  constructor(private http: HttpClient) {}

  getMyStoreSettings(): Promise<StoreSettings> {
    return this.http.get<StoreSettings>(`${API_URL}/auth/store-settings`).toPromise().then(r => r ?? {});
  }

  updateStoreSettings(data: Partial<StoreSettings>): Promise<StoreSettings> {
    return this.http.put<StoreSettings>(`${API_URL}/auth/store-settings`, data).toPromise().then(r => r ?? {});
  }

  getStoreBySlug(slug: string): Promise<StoreSettings> {
    return this.http.get<StoreSettings>(`${API_URL}/public/store/${encodeURIComponent(slug)}`).toPromise().then(r => r ?? {});
  }
}
