import { DEPLOY_API_BASE_URL } from './api-url.deploy';

/**
 * URL base da API (backend Spring Boot).
 *
 * Local: porta 8081 (alinhado a `backend/iniciar-backend.bat`).
 * Vercel: definir `CHEFCONTROL_API_BACKEND_ORIGIN` no painel Vercel (proxy /api).
 *
 * Override manual no browser:
 * `localStorage.setItem('chefcontrol_api_base_url','https://SEU-BACKEND/api'); location.reload()`
 */
function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:8081/api';

  try {
    const raw = localStorage.getItem('chefcontrol_api_base_url')?.trim();
    if (raw) {
      const base = raw.replace(/\/+$/, '');
      if (/^https?:\/\/.+\/api$/.test(base)) {
        return base;
      }
    }
  } catch {
    /* ignore */
  }

  const { protocol, hostname, origin } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:8081/api`;
  }

  // Build Vercel/CI (scripts/generate-deploy-config.mjs)
  const deployApi = DEPLOY_API_BASE_URL.trim();
  if (deployApi) {
    if (deployApi.startsWith('/')) {
      return `${origin}${deployApi}`.replace(/\/+$/, '');
    }
    return deployApi.replace(/\/+$/, '');
  }

  // Produção sem backend configurado: evita /api no Vercel (devolve HTML → 405 no POST).
  return `${protocol}//${hostname}:8081/api`;
}

export const API_URL = getApiBaseUrl();
