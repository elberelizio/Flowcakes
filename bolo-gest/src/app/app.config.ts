import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { credentialsInterceptor } from './core/http/credentials.interceptor';
import { AuthService } from './services/auth.service';
// import { ThemeService } from './services/theme.service';
import { providePrimeNG } from 'primeng/config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withViewTransitions(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    // Sem withFetch(): o backend Fetch pode não completar o fluxo em 403/401 e o login ficava
    // eternamente a carregar sem mensagem (ex.: licença expirada).
    provideHttpClient(withInterceptors([credentialsInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG(),
{
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.initSession(),
      deps: [AuthService],
      multi: true
    },
    /* Dark mode / tema: inicialização desativada (tema fixo em theme.service + styles).
    {
      provide: APP_INITIALIZER,
      useFactory: (theme: ThemeService) => () => theme.init(),
      deps: [ThemeService],
      multi: true
    },
    */
    // IndexedDB e dados fictícios removidos - sistema agora usa apenas PostgreSQL via API
  ],
};
