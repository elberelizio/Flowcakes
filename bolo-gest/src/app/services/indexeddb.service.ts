import { Injectable } from '@angular/core';

const DB_NAME = 'minhaencomenda_db';
const DB_VERSION = 1;

interface OrderDB {
  id: string;
  productName: string;
  quantity: number;
  paymentStatus: string; // 'paid' | 'not_paid'
  orderStatus: string; // 'ordered' | 'produced' | 'paid' | 'cancelled'
  totalPrice: number;
  profit: number;
  date: string; // ISO date
  deliveryDate?: string; // ISO date
  createdAt: string; // ISO date
  isCancelled: boolean;
  // Campos do frontend
  clientName: string;
  category?: string;
  subcategory?: string;
  size?: string;
  quantityKg?: number;
  unitsPerKg?: number;
  valueCharged: number;
  valuePaid: number;
  costTotal: number;
  delivered: boolean;
  ingredientIds: string[];
  observations?: string;
}

interface ProductDB {
  id: string;
  name: string;
  costPrice: number;
  salePrice: number;
  profitPerUnit: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class IndexedDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store de Orders
        if (!db.objectStoreNames.contains('orders')) {
          const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
          orderStore.createIndex('date', 'date', { unique: false });
          orderStore.createIndex('deliveryDate', 'deliveryDate', { unique: false });
          orderStore.createIndex('orderStatus', 'orderStatus', { unique: false });
          orderStore.createIndex('paymentStatus', 'paymentStatus', { unique: false });
        }

        // Store de Products
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('IndexedDB não inicializado');
    }
    return this.db;
  }

  // ========== ORDERS ==========

  async getAllOrders(): Promise<OrderDB[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['orders'], 'readonly');
      const store = transaction.objectStore('orders');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getOrder(id: string): Promise<OrderDB | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['orders'], 'readonly');
      const store = transaction.objectStore('orders');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveOrder(order: OrderDB): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      const request = store.put(order);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteOrder(id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearOrders(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ========== PRODUCTS ==========

  async getAllProducts(): Promise<ProductDB[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveProduct(product: ProductDB): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');
      const request = store.put(product);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProduct(id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
