import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { AdminAlerts } from '../../services/admin-treasury.service';

@Component({
  selector: 'app-admin-alerts-bar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-alerts-bar.component.html',
  styleUrl: './admin-alerts-bar.component.scss',
})
export class AdminAlertsBarComponent {
  alerts = input<AdminAlerts | null>(null);

  healthClass(score: number): string {
    if (score >= 80) return 'good';
    if (score >= 50) return 'warn';
    return 'bad';
  }
}
