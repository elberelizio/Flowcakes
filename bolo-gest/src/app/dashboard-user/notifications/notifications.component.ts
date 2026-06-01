import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SystemNotificationsService, SystemNotification } from '../../services/system-notifications.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent implements OnInit {
  readonly systemNotifications = inject(SystemNotificationsService);

  readonly items = computed(() => this.systemNotifications.visibleItems());

  readonly unreadCount = computed(() => this.items().filter((n) => !n.dismissed).length);

  ngOnInit(): void {
    this.systemNotifications.load();
  }

  dismiss(id: string): void {
    this.systemNotifications.dismiss(id);
  }

  phaseLabel(n: SystemNotification): string {
    return this.systemNotifications.avisoPhaseLabel(n);
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}
