import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_URL } from '../../core/config/api.config';

export interface TreasuryMonthRow {
  month: string;
  licenseRevenue: number;
  expenses: number;
  netProfit: number;
}

export interface TreasuryCategoryAmount {
  category: string;
  amountThisMonth: number;
}

export interface TreasuryAllocationBucket {
  key: string;
  percent: number;
  allocatedAmount: number;
  spentThisMonth: number;
  remainingInBucket: number;
}

export interface TreasurySummary {
  licenseRevenueTotal: number;
  licenseRevenueThisMonth: number;
  expensesTotal: number;
  expensesThisMonth: number;
  netProfitTotal: number;
  netProfitThisMonth: number;
  bestMonth: string | null;
  bestMonthNetProfit: number;
  monthlyRows: TreasuryMonthRow[];
  maintenanceCashBalance: number;
  maintenanceCashTarget: number;
  salaryExpensesThisMonth: number;
  salaryExpensesTotal: number;
  availableAfterReserve: number;
  expensesByCategoryThisMonth: TreasuryCategoryAmount[];
  accountBalance: number;
  totalInvested: number;
  roiStatus: 'loss' | 'break_even' | 'profit' | string;
  amountToBreakEven: number;
  profitAboveInvestment: number;
  allocationPercentTotal: number;
  payrollHeadcount: number;
  payrollPerPersonSuggested: number;
  allocationBuckets: TreasuryAllocationBucket[];
  pendingSuggestionsCount: number;
}

export interface TreasuryBillingEntry {
  id: string;
  invoiceNumber: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  durationMonths?: number;
  paymentReference: string;
  paidAt: string;
}

export interface TreasuryBillingPeriod {
  period: string;
  invoiceCount: number;
  totalAmount: number;
}

export interface TreasuryInvestment {
  id: string;
  amount: number;
  investedAt: string;
  notes?: string;
  createdAt?: string;
}

export interface TreasurySuggestion {
  id: string;
  suggestionType: string;
  title: string;
  message: string;
  proposedAllocations: Record<string, number>;
  status: string;
  createdAt?: string;
}

export interface OperationalExpense {
  id: string;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  createdAt?: string;
}

export interface TreasurySettingsBody {
  accountBalance: number;
  maintenancePercent: number;
  fixedExpensesPercent: number;
  reservePercent: number;
  payrollPercent: number;
  toolsPercent: number;
  payrollHeadcount: number;
}

export interface AdminAlertItem {
  id: string;
  type: string;
  title: string;
  message: string;
  route?: string;
}

export interface AdminAlerts {
  healthScore: number;
  maintenanceDue: boolean;
  maintenanceMessage: string;
  feedbackThresholdReached: boolean;
  feedbackCount: number;
  feedbackThreshold: number;
  pendingApprovals: number;
  blockedUsers: number;
  usersOnline: number;
  items: AdminAlertItem[];
}

export interface AdminLoginSummary {
  stats: Record<string, number>;
  treasury: TreasurySummary;
  alerts: AdminAlerts;
}

export type TreasuryTab =
  | 'overview'
  | 'billing'
  | 'investments'
  | 'allocations'
  | 'expenses'
  | 'payroll'
  | 'suggestions';

function num(v: unknown): number {
  if (v == null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeSummary(raw: TreasurySummary): TreasurySummary {
  return {
    ...raw,
    licenseRevenueTotal: num(raw.licenseRevenueTotal),
    licenseRevenueThisMonth: num(raw.licenseRevenueThisMonth),
    expensesTotal: num(raw.expensesTotal),
    expensesThisMonth: num(raw.expensesThisMonth),
    netProfitTotal: num(raw.netProfitTotal),
    netProfitThisMonth: num(raw.netProfitThisMonth),
    bestMonthNetProfit: num(raw.bestMonthNetProfit),
    maintenanceCashBalance: num(raw.maintenanceCashBalance),
    maintenanceCashTarget: num(raw.maintenanceCashTarget),
    salaryExpensesThisMonth: num(raw.salaryExpensesThisMonth),
    salaryExpensesTotal: num(raw.salaryExpensesTotal),
    availableAfterReserve: num(raw.availableAfterReserve),
    accountBalance: num(raw.accountBalance),
    totalInvested: num(raw.totalInvested),
    amountToBreakEven: num(raw.amountToBreakEven),
    profitAboveInvestment: num(raw.profitAboveInvestment),
    allocationPercentTotal: num(raw.allocationPercentTotal),
    payrollHeadcount: num(raw.payrollHeadcount) || 2,
    payrollPerPersonSuggested: num(raw.payrollPerPersonSuggested),
    pendingSuggestionsCount: num(raw.pendingSuggestionsCount),
    monthlyRows: (raw.monthlyRows ?? []).map((r) => ({
      ...r,
      licenseRevenue: num(r.licenseRevenue),
      expenses: num(r.expenses),
      netProfit: num(r.netProfit),
    })),
    expensesByCategoryThisMonth: (raw.expensesByCategoryThisMonth ?? []).map((c) => ({
      ...c,
      amountThisMonth: num(c.amountThisMonth),
    })),
    allocationBuckets: (raw.allocationBuckets ?? []).map((b) => ({
      ...b,
      percent: num(b.percent),
      allocatedAmount: num(b.allocatedAmount),
      spentThisMonth: num(b.spentThisMonth),
      remainingInBucket: num(b.remainingInBucket),
    })),
  };
}

@Injectable({ providedIn: 'root' })
export class AdminTreasuryService {
  private readonly http = inject(HttpClient);

  getLoginSummary(): Observable<AdminLoginSummary> {
    return this.http.get<AdminLoginSummary>(`${API_URL}/admin/login-summary`).pipe(
      map((r) => ({ ...r, treasury: normalizeSummary(r.treasury) }))
    );
  }

  getAlerts(): Observable<AdminAlerts> {
    return this.http.get<AdminAlerts>(`${API_URL}/admin/alerts`);
  }

  getSummary(): Observable<TreasurySummary> {
    return this.http
      .get<TreasurySummary>(`${API_URL}/admin/treasury/summary`)
      .pipe(map(normalizeSummary));
  }

  listBilling(year?: number, month?: number): Observable<TreasuryBillingEntry[]> {
    let params = new HttpParams();
    if (year != null) params = params.set('year', year);
    if (month != null) params = params.set('month', month);
    return this.http.get<TreasuryBillingEntry[]>(`${API_URL}/admin/treasury/billing`, { params });
  }

  listBillingPeriods(year?: number): Observable<TreasuryBillingPeriod[]> {
    let params = new HttpParams();
    if (year != null) params = params.set('year', year);
    return this.http.get<TreasuryBillingPeriod[]>(`${API_URL}/admin/treasury/billing/periods`, { params });
  }

  listInvestments(): Observable<TreasuryInvestment[]> {
    return this.http.get<TreasuryInvestment[]>(`${API_URL}/admin/treasury/investments`);
  }

  createInvestment(body: {
    amount: number;
    investedAt: string;
    notes?: string;
  }): Observable<TreasuryInvestment> {
    return this.http.post<TreasuryInvestment>(`${API_URL}/admin/treasury/investments`, body);
  }

  deleteInvestment(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/admin/treasury/investments/${id}`);
  }

  updateSettings(body: TreasurySettingsBody): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${API_URL}/admin/treasury/settings`, body);
  }

  listSuggestions(refresh = false): Observable<TreasurySuggestion[]> {
    const params = new HttpParams().set('refresh', String(refresh));
    return this.http.get<TreasurySuggestion[]>(`${API_URL}/admin/treasury/suggestions`, { params });
  }

  approveSuggestion(id: string, allocations?: Record<string, number>): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API_URL}/admin/treasury/suggestions/${id}/approve`, {
      allocations: allocations ?? null,
    });
  }

  rejectSuggestion(id: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API_URL}/admin/treasury/suggestions/${id}/reject`, {});
  }

  listExpenses(category?: string): Observable<OperationalExpense[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get<OperationalExpense[]>(`${API_URL}/admin/treasury/expenses`, { params });
  }

  createExpense(body: {
    title: string;
    category: string;
    amount: number;
    expenseDate: string;
    notes?: string;
  }): Observable<OperationalExpense> {
    return this.http.post<OperationalExpense>(`${API_URL}/admin/treasury/expenses`, body);
  }

  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/admin/treasury/expenses/${id}`);
  }
}
