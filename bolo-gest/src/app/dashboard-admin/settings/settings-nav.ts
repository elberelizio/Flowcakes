import type { IconName } from '../../ui/icon/icon-names';

export type SettingsAccent = 'teal' | 'amber' | 'slate';

/** Secções acessíveis a partir do hub de configurações (fora do sidebar principal). */
export interface SettingsNavItem {
  path: string;
  label: string;
  description: string;
  section: 'security' | 'communication' | 'platform';
  icon: IconName;
  accent: SettingsAccent;
}

export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    path: '/admin-settings/logs',
    label: 'Logs de acesso',
    description: 'Histórico de logins e sessões por utilizador.',
    section: 'security',
    icon: 'clock',
    accent: 'teal',
  },
  {
    path: '/admin-settings/access',
    label: 'Gestão de acessos',
    description: 'Tentativas falhadas, bloqueios e desbloqueio de contas.',
    section: 'security',
    icon: 'lock',
    accent: 'amber',
  },
  {
    path: '/admin-settings/suggestions',
    label: 'Sugestões e reclamações',
    description: 'Sugestões da landing e mensagens de contacto do site público.',
    section: 'communication',
    icon: 'file-text',
    accent: 'teal',
  },
];

export const SETTINGS_SUBNAV = SETTINGS_NAV.map(({ path, label }) => ({ path, label }));
