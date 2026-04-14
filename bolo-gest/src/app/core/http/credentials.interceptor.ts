import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_URL } from '../config/api.config';
import { AuthService } from '../../services/auth.service';

/**
 * Envia credenciais (cookies) e, quando logado, o header X-User-Id para a API.
 * O backend usa cookie para sessão; o header é fallback quando o cookie não chega.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isApi = req.url.startsWith(API_URL);
  if (!isApi) return next(req);
  const userId = auth.getUserId();
  const headers = userId
    ? req.headers.set('X-User-Id', userId)
    : req.headers;
  const apiReq = req.clone({ withCredentials: true, headers });
  return next(apiReq);
};
