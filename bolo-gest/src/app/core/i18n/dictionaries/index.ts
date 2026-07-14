/**
 * Dicionário de traduções PT/EN.
 *
 * Cada módulo abaixo exporta um objecto `pt` e `en` com uma única chave de topo
 * (o namespace do módulo/feature). Ficheiros novos devem seguir o mesmo padrão
 * e ser adicionados aqui — isto evita conflitos quando várias pessoas/tarefas
 * mexem em módulos diferentes ao mesmo tempo.
 */
import { common } from './common.dict';
import { shell } from './shell.dict';
import { publicSite } from './public-site.dict';
import { auth } from './auth.dict';
import { dashboardUser } from './dashboard-user.dict';
import { landing } from './landing.dict';
import { register } from './register.dict';

export interface Dict {
  [key: string]: string | Dict;
}

const modules = [common, shell, publicSite, auth, dashboardUser, landing, register];

export const PT: Dict = Object.assign({}, ...modules.map((m) => m.pt));
export const EN: Dict = Object.assign({}, ...modules.map((m) => m.en));
