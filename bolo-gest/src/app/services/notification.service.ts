import { Injectable } from '@angular/core';
import { SnackbarComponent } from '../ui/snackbar/snackbar.component';

interface QueuedNotification {
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackbar: SnackbarComponent | null = null;
  private notificationQueue: QueuedNotification[] = [];
  private isShowing = false;
  private currentTimeout: any = null;

  setSnackbar(snackbar: SnackbarComponent): void {
    this.snackbar = snackbar;
    // Processar fila se houver notificações pendentes
    if (this.notificationQueue.length > 0 && !this.isShowing) {
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (!this.snackbar || this.isShowing || this.notificationQueue.length === 0) {
      return;
    }

    this.isShowing = true;
    const notification = this.notificationQueue.shift()!;

    // Mostrar notificação
    this.snackbar.show({
      message: notification.message,
      type: notification.type,
      duration: notification.duration,
    });

    // Após a duração da notificação + 6 segundos de espera, mostrar a próxima
    const totalWait = notification.duration + 6000;
    this.currentTimeout = setTimeout(() => {
      this.isShowing = false;
      this.currentTimeout = null;
      // Processar próxima notificação na fila
      if (this.notificationQueue.length > 0) {
        this.processQueue();
      }
    }, totalWait);
  }

  private enqueue(notification: QueuedNotification): void {
    this.notificationQueue.push(notification);
    // Se não estiver mostrando nenhuma notificação, iniciar o processamento
    if (!this.isShowing && this.snackbar) {
      this.processQueue();
    }
  }

  showDeliveryAlert(clientName: string, productName: string, deliveryDate: string, daysUntil: number): void {
    let message = '';
    if (daysUntil === 0) {
      message = `Entrega hoje: ${productName} para ${clientName}`;
    } else if (daysUntil === 1) {
      message = `Entrega amanhã: ${productName} para ${clientName}`;
    } else {
      message = `Entrega em ${daysUntil} dias: ${productName} para ${clientName}`;
    }

    this.enqueue({
      message,
      type: daysUntil <= 1 ? 'warning' : 'info',
      duration: 6000,
    });
  }

  showInfo(message: string, duration = 4000): void {
    this.enqueue({ message, type: 'info', duration });
  }

  showSuccess(message: string, duration = 4000): void {
    this.enqueue({ message, type: 'success', duration });
  }

  showWarning(message: string, duration = 5000): void {
    this.enqueue({ message, type: 'warning', duration });
  }

  showError(message: string, duration = 6000): void {
    this.enqueue({ message, type: 'error', duration });
  }

  clearQueue(): void {
    this.notificationQueue = [];
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    this.isShowing = false;
    if (this.snackbar) {
      this.snackbar.clear();
    }
  }
}
