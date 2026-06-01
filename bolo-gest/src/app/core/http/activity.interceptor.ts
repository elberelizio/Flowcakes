import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { API_URL } from '../config/api.config';
import { AuthService } from '../../services/auth.service';
import { UserActivityService, describeApiOperation } from '../activity/user-activity.service';

/** Regista operações (POST/PUT/PATCH/DELETE) bem-sucedidas na API. */
export const activityInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const activity = inject(UserActivityService);

  const isApi = req.url.startsWith(API_URL);
  const isActivityEndpoint = req.url.includes('/auth/activity');
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

  if (!isApi || !isMutation || isActivityEndpoint || !auth.getUserId()) {
    return next(req);
  }

  return next(req).pipe(
    tap((event) => {
      if (!(event instanceof HttpResponse) || event.status < 200 || event.status >= 300) {
        return;
      }
      const label = describeApiOperation(req.method, req.url);
      if (label) {
        activity.trackOperation(label);
      }
    }),
  );
};
