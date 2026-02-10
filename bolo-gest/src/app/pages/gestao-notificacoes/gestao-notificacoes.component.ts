import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-gestao-notificacoes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './gestao-notificacoes.component.html',
  styleUrl: './gestao-notificacoes.component.scss',
})
export class GestaoNotificacoesComponent {}
