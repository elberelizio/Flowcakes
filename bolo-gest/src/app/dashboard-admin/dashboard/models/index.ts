/**
 * Modelos partilhados do painel de administração.
 * Um único ficheiro de tipos evita duplicação e conflitos quando várias pessoas trabalham na feature.
 */

export interface AdminStats {
  totalUsers: number;
  licensesPaid: number;
  licensesTrial?: number;
  licensesPending: number;
  loginsToday?: number;
  uniqueUsersToday?: number;
}

export interface RevenueByMonthDto {
  month: string;
  revenue: number;
}

export interface KpiTile {
  id: string;
  label: string;
  value: string | number;
  meta: string;
  cssClass: string;
}

export interface QuickAction {
  route: string;
  title: string;
  desc: string;
}
