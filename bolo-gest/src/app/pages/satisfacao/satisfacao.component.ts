import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-satisfacao',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './satisfacao.component.html',
  styleUrl: './satisfacao.component.scss',
})
export class SatisfacaoComponent {}
