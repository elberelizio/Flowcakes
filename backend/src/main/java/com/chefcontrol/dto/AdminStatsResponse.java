package com.chefcontrol.dto;

public class AdminStatsResponse {

    private long totalUsers;
    private long licensesPaid;
    private long licensesPending;

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
    public long getLicensesPaid() { return licensesPaid; }
    public void setLicensesPaid(long licensesPaid) { this.licensesPaid = licensesPaid; }
    public long getLicensesPending() { return licensesPending; }
    public void setLicensesPending(long licensesPending) { this.licensesPending = licensesPending; }
}
