import { AfterViewInit, Component, ElementRef, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { PublicPageMotionService } from './public-page-motion.service';

/** Shell das páginas públicas do site (marketing). Filhos em `web-page.routes` / `app.routes`. */
@Component({
  selector: 'app-web-page-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './web-page-layout.component.html',
  styleUrl: './web-page-layout.component.scss',
})
export class WebPageLayoutComponent implements AfterViewInit {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly motion = inject(PublicPageMotionService);

  ngAfterViewInit(): void {
    const stage = this.host.nativeElement.querySelector('.web-page-layout-stage') as HTMLElement | null;
    if (stage) {
      this.motion.bindOutletRouteTransitions(this.router, stage);
    }
  }
}
