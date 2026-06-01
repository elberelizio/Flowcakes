import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../ui/icon/icon.component';
import { SETTINGS_NAV } from './settings-nav';

@Component({
  selector: 'app-settings-hub',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './settings-hub.component.html',
  styleUrl: './settings-hub.component.scss',
})
export class SettingsHubComponent {
  readonly securityItems = SETTINGS_NAV.filter((i) => i.section === 'security');
  readonly communicationItems = SETTINGS_NAV.filter((i) => i.section === 'communication');
}
