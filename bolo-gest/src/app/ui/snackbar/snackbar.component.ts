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
          [class.snackbar-dismissing]="isDismissing(notification.id)"
          role="status">
          <span class="snackbar-icon-wrap" aria-hidden="true">
            <span class="snackbar-icon">
              @switch (notification.type) {
                @case ('warning') { ⚠️ }
                @case ('success') { ✓ }
                @case ('error') { ✕ }
                @default { ℹ️ }
              }
            </span>
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
      gap: 0.65rem;
      max-width: min(420px, calc(100vw - 2rem));
      width: 100%;
      pointer-events: none;
    }

    .snackbar {
      pointer-events: auto;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.06);
      padding: 0.75rem 0.85rem 0.75rem 0.75rem;
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      border-left: 4px solid;
      opacity: 0;
      transform: translateX(110%);
      transition: opacity 0.32s ease, transform 0.32s ease;
    }

    .snackbar-show {
      opacity: 1;
      transform: translateX(0);
    }

    .snackbar-dismissing {
      opacity: 0;
      transform: translateX(110%);
      transition: opacity 0.28s ease, transform 0.28s ease;
    }

    .snackbar-icon-wrap {
      flex-shrink: 0;
      width: 2rem;
      height: 2rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 0.05rem;
    }

    .snackbar-icon {
      font-size: 0.95rem;
      font-weight: 800;
      line-height: 1;
    }

    .snackbar-message {
      flex: 1;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text);
      line-height: 1.45;
      padding-top: 0.2rem;
    }

    .snackbar-close {
      background: transparent;
      border: none;
      font-size: 1.35rem;
      line-height: 1;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.1rem;
      width: 1.75rem;
      height: 1.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
    }

    .snackbar-close:hover {
      background: rgba(0, 0, 0, 0.06);
      color: var(--text);
    }

    .snackbar-info .snackbar-icon-wrap {
      background: rgba(13, 148, 136, 0.12);
      color: var(--primary);
    }

    .snackbar-warning .snackbar-icon-wrap {
      background: rgba(245, 158, 11, 0.15);
      color: #b45309;
    }

    .snackbar-success .snackbar-icon-wrap {
      background: rgba(16, 185, 129, 0.15);
      color: #047857;
    }

    .snackbar-error .snackbar-icon-wrap {
      background: rgba(239, 68, 68, 0.12);
      color: #b91c1c;
    }

    .snackbar-info {
      border-left-color: var(--primary);
    }

    .snackbar-warning {
      border-left-color: var(--warning);
    }

    .snackbar-success {
      border-left-color: var(--success);
    }

    .snackbar-error {
      border-left-color: var(--danger);
    }

    @media (max-width: 768px) {
      .snackbar-container {
        top: 60px;
        right: 0.5rem;
        left: 0.5rem;
        max-width: none;
        width: auto;
      }

      .snackbar {
        padding: 0.7rem 0.75rem;
      }

      .snackbar-message {
        font-size: 0.86rem;
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
    }, 320);
  }

  isDismissing(id: string): boolean {
    return this.dismissingIds().has(id);
  }

  clear(): void {
    this.notifications.set([]);
  }
}
