import { Routes } from '@angular/router';

/** Rotas filhas do site público (dentro de `WebPageLayoutComponent`). */
export const webPageRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./landing/landing-page.component').then((m) => m.LandingPageComponent),
  },
  {
    path: 'contacto',
    loadComponent: () => import('./contact/contact-page.component').then((m) => m.ContactPageComponent),
  },
];
