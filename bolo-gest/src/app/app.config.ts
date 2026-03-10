import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { credentialsInterceptor } from './core/http-interceptor';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { providePrimeNG } from 'primeng/config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG(),
{
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.initSession(),
      deps: [AuthService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (theme: ThemeService) => () => theme.init(),
      deps: [ThemeService],
      multi: true
    },
    // IndexedDB e dados fictícios removidos - sistema agora usa apenas PostgreSQL via API
  ],
};
