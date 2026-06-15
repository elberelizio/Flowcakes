import { Component, Input } from '@angular/core';

/** Texto «Flow Cakes» com Flow cinza e Cakes teal (como Chef Control). */
@Component({
  selector: 'app-brand-wordmark',
  standalone: true,
  template: `
    <span class="brand-wordmark" [class.brand-wordmark--on-dark]="onDark" [class.brand-wordmark--lg]="size === 'lg'">
      <span class="brand-wordmark__flow">Flow</span><span class="brand-wordmark__cakes">Cakes</span>
    </span>
  `,
  styleUrl: './brand-wordmark.component.scss',
})
export class BrandWordmarkComponent {
  /** Texto sobre fundo escuro (sidebar). */
  @Input() onDark = false;
  @Input() size: 'md' | 'lg' = 'md';
}
