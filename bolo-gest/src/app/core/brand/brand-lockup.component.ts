import { Component, Input } from '@angular/core';
import { BRAND_ASSETS } from '@app/core/config/brand-assets';
import { BrandWordmarkComponent } from './brand-wordmark.component';

/** Emblema transparente + texto «Flow Cakes» (Flow cinza, Cakes teal). */
@Component({
  selector: 'app-brand-lockup',
  standalone: true,
  imports: [BrandWordmarkComponent],
  template: `
    <div
      class="brand-lockup"
      [class.brand-lockup--stacked]="layout === 'stacked'"
      [class.brand-lockup--inline]="layout === 'inline'"
      [class.brand-lockup--compact]="layout === 'compact'"
    >
      <img
        [src]="emblemSrc"
        alt=""
        class="brand-lockup__emblem"
        [style.width.px]="emblemSize"
        [style.height.px]="emblemSize"
        decoding="async"
      />
      @if (showWordmark) {
        <app-brand-wordmark [onDark]="onDark" [size]="wordmarkSize" />
      }
    </div>
  `,
  styleUrl: './brand-lockup.component.scss',
})
export class BrandLockupComponent {
  @Input() layout: 'inline' | 'stacked' | 'compact' = 'inline';
  @Input() emblemSize = 40;
  @Input() wordmarkSize: 'md' | 'lg' = 'md';
  @Input() onDark = false;
  @Input() showWordmark = true;

  readonly emblemSrc = BRAND_ASSETS.logoEmblem;
}
