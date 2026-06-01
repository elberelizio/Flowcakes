import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SETTINGS_SUBNAV } from './settings-nav';

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './settings-layout.component.html',
  styleUrl: './settings-layout.component.scss',
})
export class SettingsLayoutComponent {
  private readonly router = inject(Router);

  readonly subnav = SETTINGS_SUBNAV;

  isChildRoute(): boolean {
    const url = this.router.url.split('?')[0];
    return url !== '/admin-settings' && url.startsWith('/admin-settings/');
  }
}
