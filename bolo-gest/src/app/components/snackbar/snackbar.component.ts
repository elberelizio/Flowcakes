import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SnackbarNotification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  duration: number; // Sempre definido, não opcional
}

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="snackbar-container">
      @for (notification of visibleNotifications(); track notification.id) {
        <div 
          class="snackbar snackbar-{{ notification.type }}"
          [class.snackbar-show]="!isDismissing(notification.id)"
          [class.snackbar-dismissing]="isDismissing(notification.id)">
          <span class="snackbar-icon">
            @switch (notification.type) {
              @case ('warning') { ⚠️ }
              @case ('success') { ✅ }
              @case ('error') { ❌ }
              @default { ℹ️ }
            }
          </span>
          <span class="snackbar-message">{{ notification.message }}</span>
          <button 
            type="button" 
            class="snackbar-close"
            (click)="dismiss(notification.id)"
            aria-label="Fechar">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .snackbar-container {
      position: fixed;
      top: 80px;
      right: 1rem;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
      width: 100%;
    }

    .snackbar {
      background: var(--card-bg);
      border-radius: var(--radius-lg);
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.15);
      padding: 0.875rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-left: 4px solid;
      opacity: 0;
      transform: translateX(100%);
      transition: opacity 0.8s ease-out, transform 0.8s ease-out;
      animation: slideInRight 0.8s ease-out forwards;
    }

    .snackbar-show {
      opacity: 1;
      transform: translateX(0);
      animation: slideInRight 0.8s ease-out forwards;
    }

    .snackbar-dismissing {
      animation: slideOutRight 0.8s ease-out forwards;
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideOutRight {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }

    .snackbar-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .snackbar-message {
      flex: 1;
      font-size: 0.9rem;
      color: var(--text);
      line-height: 1.4;
    }

    .snackbar-close {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s, color 0.2s;
      flex-shrink: 0;
    }

    .snackbar-close:hover {
      background: rgba(0, 0, 0, 0.05);
      color: var(--text);
    }

    .snackbar-info {
      border-left-color: var(--primary);
      background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%);
    }

    .snackbar-warning {
      border-left-color: var(--warning);
      background: linear-gradient(135deg, #fef3c7 0%, #ffffff 100%);
    }

    .snackbar-success {
      border-left-color: var(--success);
      background: linear-gradient(135deg, #d1fae5 0%, #ffffff 100%);
    }

    .snackbar-error {
      border-left-color: var(--danger);
      background: linear-gradient(135deg, #fee2e2 0%, #ffffff 100%);
    }

    @media (max-width: 768px) {
      .snackbar-container {
        top: 60px;
        right: 0.5rem;
        left: 0.5rem;
        max-width: none;
        width: calc(100% - 1rem);
      }

      .snackbar {
        padding: 0.875rem 0.75rem;
        gap: 0.625rem;
        flex-wrap: wrap;
      }

      .snackbar-icon {
        font-size: 1.1rem;
      }

      .snackbar-message {
        font-size: 0.85rem;
        line-height: 1.3;
        flex: 1;
        min-width: 0;
      }

      .snackbar-close {
        width: 28px;
        height: 28px;
        font-size: 1.4rem;
        flex-shrink: 0;
      }
    }

    @media (max-width: 480px) {
      .snackbar-container {
        top: 50px;
        right: 0.25rem;
        left: 0.25rem;
        width: calc(100% - 0.5rem);
      }

      .snackbar {
        padding: 0.75rem;
        gap: 0.5rem;
      }

      .snackbar-icon {
        font-size: 1rem;
      }

      .snackbar-message {
        font-size: 0.8rem;
      }

      .snackbar-close {
        width: 24px;
        height: 24px;
        font-size: 1.25rem;
      }
    }
  `]
})
export class SnackbarComponent {
  private notifications = signal<SnackbarNotification[]>([]);
  private dismissingIds = signal<Set<string>>(new Set());
  visibleNotifications = computed(() => this.notifications());

  show(notification: Omit<SnackbarNotification, 'id' | 'duration'> & { duration?: number }): void {
    const id = `snack-${Date.now()}-${Math.random()}`;
    const duration = notification.duration ?? 5000;
    const newNotification: SnackbarNotification = {
      ...notification,
      id,
      duration,
    };

    this.notifications.update(list => [...list, newNotification]);

    // Auto-dismiss após duração
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  dismiss(id: string): void {
    // Marcar como sendo removido para aplicar animação de saída
    this.dismissingIds.update(set => {
      const newSet = new Set(set);
      newSet.add(id);
      return newSet;
    });

    // Aguardar animação de saída antes de remover do DOM
    setTimeout(() => {
      this.notifications.update(list => list.filter(n => n.id !== id));
      this.dismissingIds.update(set => {
        const newSet = new Set(set);
        newSet.delete(id);
        return newSet;
      });
    }, 800); // Tempo da animação de saída
  }

  isDismissing(id: string): boolean {
    return this.dismissingIds().has(id);
  }

  clear(): void {
    this.notifications.set([]);
  }
}
