import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Shell das páginas públicas do site (marketing). Filhos em `web-page.routes` / `app.routes`. */
@Component({
  selector: 'app-web-page-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './web-page-layout.component.html',
  styleUrl: './web-page-layout.component.scss',
})
export class WebPageLayoutComponent {}
