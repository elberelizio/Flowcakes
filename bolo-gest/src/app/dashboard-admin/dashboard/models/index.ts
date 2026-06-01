/**
 * Modelos partilhados do painel de administração.
 */

export interface AdminStats {
  totalUsers: number;
  licensesPaid: number;
  licensesTrial?: number;
  licensesPending: number;
  loginsToday?: number;
  uniqueUsersToday?: number;
  usersOnline?: number;
  blockedUsers?: number;
  pendingApprovals?: number;
  licenseRevenueThisMonth?: number;
  licenseRevenueTotal?: number;
  topProfitUserName?: string | null;
  topProfitAmount?: number;
  avgLoginsPerUser30d?: number;
}

export interface RevenueByMonthDto {
  month: string;
  revenue: number;
}

export interface AdminRankingRow {
  rank: number;
  userId: string;
  fullName: string;
  phone: string;
  orderCount: number;
  totalProfit: number;
  loginCount: number;
  licenseStatus: string;
}

export interface KpiTile {
  id: string;
  label: string;
  value: string | number;
  meta: string;
  cssClass: string;
  route?: string;
}

export interface QuickAction {
  route: string;
  title: string;
  desc: string;
}
