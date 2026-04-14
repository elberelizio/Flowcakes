import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { QuickAction } from '../models';

/**
 * Secção de acções rápidas do painel admin: links para gestão de licenças, logs, encomendas, etc.
 */
@Component({
  selector: 'app-admin-quick-actions-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-quick-actions-section.component.html',
  styleUrl: './admin-quick-actions-section.component.scss',
})
export class AdminQuickActionsSectionComponent {
  actions = input.required<QuickAction[]>();
}
