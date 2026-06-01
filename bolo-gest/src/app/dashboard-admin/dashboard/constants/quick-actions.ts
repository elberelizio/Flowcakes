import type { QuickAction } from '../models';

/** Admin dashboard quick actions (single source of truth). */
export const ADMIN_QUICK_ACTIONS: QuickAction[] = [
  { route: '/license-management', title: 'Licenças', desc: 'Licenças activas, pendentes e expiradas — editar, bloquear, desbloquear' },
  { route: '/admin-new-users', title: 'Pendentes de aprovação', desc: 'Aprovar ou rejeitar pagamentos de quem entrou no sistema' },
  { route: '/admin-profiles', title: 'Utilizadores e perfis', desc: 'Lista de utilizadores, dados e histórico de pagamentos' },
  { route: '/admin-orders', title: 'Todas as encomendas', desc: 'Visualizar encomendas de todos os utilizadores' },
  { route: '/admin-ranking', title: 'Ranking', desc: 'Classificação por encomendas e receita' },
  { route: '/notification-management', title: 'Notificações do sistema', desc: 'Enviar avisos aos utilizadores' },
  { route: '/admin-settings', title: 'Configurações', desc: 'Logs, segurança, sugestões e definições da plataforma' },
];
