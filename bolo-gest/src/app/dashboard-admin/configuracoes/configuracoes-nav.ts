import type { IconName } from '../../ui/icon/icon-names';

export type ConfiguracoesAccent = 'teal' | 'amber' | 'slate';

/** Secções acessíveis a partir do hub de configurações (fora do sidebar principal). */
export interface ConfiguracoesNavItem {
  path: string;
  label: string;
  description: string;
  section: 'seguranca' | 'comunicacao' | 'plataforma';
  icon: IconName;
  accent: ConfiguracoesAccent;
}

export const CONFIGURACOES_NAV: ConfiguracoesNavItem[] = [
  {
    path: '/admin-configuracoes/logs',
    label: 'Logs de acesso',
    description: 'Histórico de logins e sessões por utilizador.',
    section: 'seguranca',
    icon: 'clock',
    accent: 'teal',
  },
  {
    path: '/admin-configuracoes/acessos',
    label: 'Gestão de acessos',
    description: 'Tentativas falhadas, bloqueios e desbloqueio de contas.',
    section: 'seguranca',
    icon: 'lock',
    accent: 'amber',
  },
  {
    path: '/admin-configuracoes/sugestoes',
    label: 'Sugestões da landing',
    description: 'Pedidos de funcionalidades enviados pelo site público.',
    section: 'comunicacao',
    icon: 'file-text',
    accent: 'teal',
  },
];

export const CONFIGURACOES_SUBNAV = CONFIGURACOES_NAV.map(({ path, label }) => ({ path, label }));
