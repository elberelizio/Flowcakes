import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../ui/icon/icon.component';
import { CONFIGURACOES_NAV } from './configuracoes-nav';

@Component({
  selector: 'app-configuracoes-hub',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './configuracoes.component.html',
  styleUrl: './configuracoes.component.scss',
})
export class ConfiguracoesHubComponent {
  readonly segurancaItems = CONFIGURACOES_NAV.filter((i) => i.section === 'seguranca');
  readonly comunicacaoItems = CONFIGURACOES_NAV.filter((i) => i.section === 'comunicacao');
}
