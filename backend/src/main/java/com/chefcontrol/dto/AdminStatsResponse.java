package com.chefcontrol.dto;

public class AdminStatsResponse {

    private long totalUsers;
    /** EN: Commercial paid only (excludes trial). PT: Só licenças pagas (exclui teste). */
    private long licensesPaid;
    /** EN: Active trial licenses. Pt: Licenças em período de teste activas. */
    private long licensesTrial;
    private long licensesPending;
    private long loginsToday;
    private long uniqueUsersToday;
    /** Sessões activas agora (utilizadores não-admin). */
    private long usersOnline;
    private long blockedUsers;
    /** Licenças pendentes + pagamentos simulados a aguardar aprovação. */
    private long pendingApprovals;
    /** Receita de licenças (MZN) no mês corrente. */
    private java.math.BigDecimal licenseRevenueThisMonth;
    /** Receita total de licenças confirmadas (MZN). */
    private java.math.BigDecimal licenseRevenueTotal;
    /** Cliente com maior lucro acumulado em encomendas. */
    private String topProfitUserName;
    private java.math.BigDecimal topProfitAmount;
    /** Média de logins por utilizador nos últimos 30 dias (indicador de uso). */
    private double avgLoginsPerUser30d;
    /** Total de encomendas não canceladas na plataforma. */
    private long totalOrders;

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
    public long getLicensesPaid() { return licensesPaid; }
    public void setLicensesPaid(long licensesPaid) { this.licensesPaid = licensesPaid; }
    public long getLicensesTrial() { return licensesTrial; }
    public void setLicensesTrial(long licensesTrial) { this.licensesTrial = licensesTrial; }
    public long getLicensesPending() { return licensesPending; }
    public void setLicensesPending(long licensesPending) { this.licensesPending = licensesPending; }
    public long getLoginsToday() { return loginsToday; }
    public void setLoginsToday(long loginsToday) { this.loginsToday = loginsToday; }
    public long getUniqueUsersToday() { return uniqueUsersToday; }
    public void setUniqueUsersToday(long uniqueUsersToday) { this.uniqueUsersToday = uniqueUsersToday; }
    public long getUsersOnline() { return usersOnline; }
    public void setUsersOnline(long usersOnline) { this.usersOnline = usersOnline; }
    public long getBlockedUsers() { return blockedUsers; }
    public void setBlockedUsers(long blockedUsers) { this.blockedUsers = blockedUsers; }
    public long getPendingApprovals() { return pendingApprovals; }
    public void setPendingApprovals(long pendingApprovals) { this.pendingApprovals = pendingApprovals; }
    public java.math.BigDecimal getLicenseRevenueThisMonth() { return licenseRevenueThisMonth; }
    public void setLicenseRevenueThisMonth(java.math.BigDecimal licenseRevenueThisMonth) { this.licenseRevenueThisMonth = licenseRevenueThisMonth; }
    public java.math.BigDecimal getLicenseRevenueTotal() { return licenseRevenueTotal; }
    public void setLicenseRevenueTotal(java.math.BigDecimal licenseRevenueTotal) { this.licenseRevenueTotal = licenseRevenueTotal; }
    public String getTopProfitUserName() { return topProfitUserName; }
    public void setTopProfitUserName(String topProfitUserName) { this.topProfitUserName = topProfitUserName; }
    public java.math.BigDecimal getTopProfitAmount() { return topProfitAmount; }
    public void setTopProfitAmount(java.math.BigDecimal topProfitAmount) { this.topProfitAmount = topProfitAmount; }
    public double getAvgLoginsPerUser30d() { return avgLoginsPerUser30d; }
    public void setAvgLoginsPerUser30d(double avgLoginsPerUser30d) { this.avgLoginsPerUser30d = avgLoginsPerUser30d; }
    public long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }
}
