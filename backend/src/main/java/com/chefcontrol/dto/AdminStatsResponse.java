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
}
