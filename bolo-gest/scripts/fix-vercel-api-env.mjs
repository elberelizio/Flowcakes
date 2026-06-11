/**
 * Repõe CHEFCONTROL_API_BACKEND_ORIGIN no Vercel sem newline no valor.
 * Uso: node scripts/fix-vercel-api-env.mjs
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const backendUrl = 'https://chef-control-api-production.up.railway.app';
const tmp = path.join(root, 'scripts', '.env-value-tmp');

try {
  execSync('npx vercel env rm CHEFCONTROL_API_BACKEND_ORIGIN production --yes', {
    cwd: root,
    stdio: 'inherit',
  });
} catch {
  /* variável pode não existir */
}

fs.writeFileSync(tmp, backendUrl, { encoding: 'utf8' });
try {
  execSync(
    'npx vercel env add CHEFCONTROL_API_BACKEND_ORIGIN production < scripts/.env-value-tmp',
    { cwd: root, stdio: 'inherit', shell: true },
  );
} finally {
  fs.unlinkSync(tmp);
}

console.log('[fix-vercel-api-env] CHEFCONTROL_API_BACKEND_ORIGIN actualizado.');
