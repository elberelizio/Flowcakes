import type { QuickAction } from '../models';

/** Lista de acções rápidas do painel admin. Centralizada aqui para um único sítio de edição. */
export const ADMIN_QUICK_ACTIONS: QuickAction[] = [
  { route: '/gestao-licencas', title: 'Licenças', desc: 'Licenças activas, pendentes e expiradas — editar, bloquear, desbloquear' },
  { route: '/admin-novos-utilizadores', title: 'Pendentes de aprovação', desc: 'Aprovar ou rejeitar pagamentos de quem entrou no sistema' },
  { route: '/admin-perfis', title: 'Utilizadores e perfis', desc: 'Lista de utilizadores, dados e histórico de pagamentos' },
  { route: '/admin-encomendas', title: 'Todas as encomendas', desc: 'Visualizar encomendas de todos os utilizadores' },
  { route: '/admin-ranking', title: 'Ranking', desc: 'Classificação por encomendas e receita' },
  { route: '/gestao-notificacoes', title: 'Notificações do sistema', desc: 'Enviar avisos aos utilizadores' },
  { route: '/admin-configuracoes', title: 'Configurações', desc: 'Logs, segurança, sugestões e definições da plataforma' },
];
