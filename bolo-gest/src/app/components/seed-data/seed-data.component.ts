import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeedLocalService } from '../../services/seed-local.service';
import { OrdersService } from '../../services/orders.service';

@Component({
  selector: 'app-seed-data',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="seed-data-panel">
      <h3>Dados Locais (IndexedDB)</h3>
      <p class="seed-description">
        Sistema usando armazenamento local temporário. Quando o backend estiver funcionando, os dados serão migrados automaticamente.
      </p>
      <div class="seed-actions">
        <button 
          type="button" 
          class="btn btn-primary" 
          (click)="populateData()"
          [disabled]="loading">
          {{ loading ? 'A popular...' : 'Popular Dados Fictícios' }}
        </button>
        <button 
          type="button" 
          class="btn btn-secondary" 
          (click)="clearData()"
          [disabled]="loading">
          Limpar Dados
        </button>
        <button 
          type="button" 
          class="btn btn-secondary" 
          (click)="reloadOrders()"
          [disabled]="loading">
          Recarregar
        </button>
      </div>
      @if (message) {
        <p class="seed-message" [class.error]="messageType === 'error'">
          {{ message }}
        </p>
      }
    </div>
  `,
  styles: [`
    .seed-data-panel {
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 8px;
      margin: 1rem 0;
    }

    .seed-data-panel h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .seed-description {
      margin: 0 0 1rem 0;
      color: #666;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .seed-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .seed-message {
      margin: 0.5rem 0 0 0;
      color: #16a34a;
      font-size: 0.9rem;
    }

    .seed-message.error {
      color: #dc2626;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      min-height: 44px;
      transition: background 0.2s;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1d4ed8;
    }

    .btn-secondary {
      background: #6b7280;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #4b5563;
    }

    @media (max-width: 768px) {
      .seed-data-panel {
        padding: 0.75rem;
        margin: 0.5rem 0;
      }

      .seed-data-panel h3 {
        font-size: 0.95rem;
      }

      .seed-description {
        font-size: 0.85rem;
      }

      .seed-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        margin-bottom: 0.5rem;
      }

      .btn:last-child {
        margin-bottom: 0;
      }
    }
  `]
})
export class SeedDataComponent {
  loading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private seedService: SeedLocalService,
    private ordersService: OrdersService
  ) {}

  async populateData(): Promise<void> {
    this.loading = true;
    this.message = '';
    try {
      await this.seedService.seedData();
      await this.reloadOrders();
      this.message = '✅ Dados populados com sucesso!';
      this.messageType = 'success';
    } catch (error: any) {
      this.message = `Erro: ${error.message || 'Erro ao popular dados'}`;
      this.messageType = 'error';
    } finally {
      this.loading = false;
    }
  }

  async clearData(): Promise<void> {
    if (!confirm('Tem certeza que deseja limpar todos os dados?')) {
      return;
    }
    this.loading = true;
    this.message = '';
    try {
      await this.seedService.clearData();
      await this.reloadOrders();
      this.message = '✅ Dados limpos com sucesso!';
      this.messageType = 'success';
    } catch (error: any) {
      this.message = `Erro: ${error.message || 'Erro ao limpar dados'}`;
      this.messageType = 'error';
    } finally {
      this.loading = false;
    }
  }

  async reloadOrders(): Promise<void> {
    await this.ordersService.loadOrders();
  }
}
