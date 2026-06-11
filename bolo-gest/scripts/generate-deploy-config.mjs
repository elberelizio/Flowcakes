/**
 * Gera ficheiros de deploy a partir de variáveis de ambiente (Vercel / CI).
 *
 * CHEFCONTROL_API_BACKEND_ORIGIN — URL pública do Spring Boot (ex.: https://flowcakes-api.railway.app)
 *   Se definida, o Vercel faz proxy de /api/* para esse servidor.
 *
 * CHEFCONTROL_API_BASE_URL — URL base usada pelo browser (opcional).
 *   Por omissão com proxy: /api (mesmo domínio).
 *   Sem proxy: URL completa (ex.: https://flowcakes-api.railway.app/api).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function cleanEnv(value) {
  return String(value || '')
    .trim()
    .replace(/\\r\\n/g, '')
    .replace(/\r?\n/g, '')
    .replace(/^["']|["']$/g, '')
    .replace(/\/+$/, '');
}

const backendOrigin = cleanEnv(process.env.CHEFCONTROL_API_BACKEND_ORIGIN);
const apiBaseUrl = cleanEnv(process.env.CHEFCONTROL_API_BASE_URL || (backendOrigin ? '/api' : ''));

const generatedTs = `/** Gerado por scripts/generate-deploy-config.mjs — não editar à mão. */
export const DEPLOY_API_BASE_URL = ${JSON.stringify(apiBaseUrl)};
export const DEPLOY_API_BACKEND_ORIGIN = ${JSON.stringify(backendOrigin)};
`;

fs.writeFileSync(path.join(root, 'src/app/core/config/api-url.deploy.ts'), generatedTs);

const rewrites = backendOrigin
  ? [
      { source: '/api/:path*', destination: `${backendOrigin}/api/:path*` },
      { source: '/(.*)', destination: '/index.html' },
    ]
  : [{ source: '/(.*)', destination: '/index.html' }];

const vercelConfig = {
  buildCommand: 'npm run build',
  outputDirectory: 'dist/chef-control/browser',
  framework: null,
  rewrites,
};

fs.writeFileSync(path.join(root, 'vercel.json'), `${JSON.stringify(vercelConfig, null, 2)}\n`);

console.log(
  backendOrigin
    ? `[deploy-config] API proxy: /api/* -> ${backendOrigin}/api/*`
    : '[deploy-config] Sem CHEFCONTROL_API_BACKEND_ORIGIN — sem proxy /api (defina no Vercel para login em produção).',
);
if (apiBaseUrl) {
  console.log(`[deploy-config] API base no browser: ${apiBaseUrl}`);
}
