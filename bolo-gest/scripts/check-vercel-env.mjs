import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = fs.readFileSync(path.join(root, '.env.vercel.local'), 'utf8');
const m = env.match(/^CHEFCONTROL_API_BACKEND_ORIGIN=(.*)$/m);
if (!m) {
  console.log('MISSING');
  process.exit(1);
}
const v = m[1].replace(/^"|"$/g, '');
console.log('len', v.length);
console.log('hasCRLF', /[\r\n]/.test(v));
console.log('value', v);
