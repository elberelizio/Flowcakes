/**
 * URL base da API (backend Spring Boot).
 * Por omissão: mesma máquina que o front, porta 8081 (alinhado a `backend/iniciar-backend.bat`).
 *
 * Se o backend correr na 8080 (omissão do `application.yml`), no consola do browser execute:
 * `localStorage.setItem('chefcontrol_api_base_url','http://localhost:8080/api'); location.reload()`
 * Para voltar ao automático: `localStorage.removeItem('chefcontrol_api_base_url'); location.reload()`
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
  const { protocol, hostname } = window.location;
  const apiPort = 8081;
  return `${protocol}//${hostname}:${apiPort}/api`;
}
export const API_URL = getApiBaseUrl();
