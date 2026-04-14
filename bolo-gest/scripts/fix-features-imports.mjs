import fs from 'fs';
import path from 'path';

const appRoot = path.join('src', 'app');
const pageRoots = ['login', 'register', 'pagamento-licenca', 'public', 'dashboard-admin', 'dashboard-user'];
const roots = ['core', 'services', 'models', 'guards', 'modals', 'validators', 'components', 'ui'];

function walk(dir, cb) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, cb);
    else if (/\.(ts|html|scss)$/.test(e.name)) cb(p);
  }
}

function fixFile(file) {
  let s = fs.readFileSync(file, 'utf8');
  const rel = path.relative(appRoot, path.dirname(file));
  const depth = rel.split(path.sep).filter(Boolean).length;
  const need = '../'.repeat(depth);
  let changed = false;
  for (const r of roots) {
    const re = new RegExp(`from (['"])((?:\\.\\./)+)(${r}/)`, 'g');
    s = s.replace(re, (m, q, pfx, rest) => {
      if (pfx === need) return m;
      changed = true;
      return `from ${q}${need}${rest}`;
    });
    const re2 = new RegExp(`@import (['"])((?:\\.\\./)+)(${r}/)`, 'g');
    s = s.replace(re2, (m, q, pfx, rest) => {
      if (pfx === need) return m;
      changed = true;
      return `@import ${q}${need}${rest}`;
    });
  }
  if (changed) {
    fs.writeFileSync(file, s);
    console.log('fixed', file);
  }
}

for (const name of pageRoots) {
  const root = path.join(appRoot, name);
  if (fs.existsSync(root)) {
    walk(root, fixFile);
  }
}
