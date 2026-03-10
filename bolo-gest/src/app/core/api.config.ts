/**
 * URL base da API (backend Spring Boot).
 * Em rede local (telemóvel a aceder ao PC): usa o mesmo hostname com porta 8080.
 * Ex.: http://192.168.1.100:4200 → API em http://192.168.1.100:8080/api
 */
function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:8081/api';
  const { protocol, hostname } = window.location;
  const apiPort = 8081;
  return `${protocol}//${hostname}:${apiPort}/api`;
}
export const API_URL = getApiBaseUrl();
