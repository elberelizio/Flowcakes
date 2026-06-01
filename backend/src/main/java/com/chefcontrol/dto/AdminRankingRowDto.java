package com.chefcontrol.dto;

import java.math.BigDecimal;

public class AdminRankingRowDto {

    private int rank;
    private String userId;
    private String fullName;
    private String phone;
    private long orderCount;
    private BigDecimal totalProfit;
    private long loginCount;
    private String licenseStatus;

    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public long getOrderCount() { return orderCount; }
    public void setOrderCount(long orderCount) { this.orderCount = orderCount; }
    public BigDecimal getTotalProfit() { return totalProfit; }
    public void setTotalProfit(BigDecimal totalProfit) { this.totalProfit = totalProfit; }
    public long getLoginCount() { return loginCount; }
    public void setLoginCount(long loginCount) { this.loginCount = loginCount; }
    public String getLicenseStatus() { return licenseStatus; }
    public void setLicenseStatus(String licenseStatus) { this.licenseStatus = licenseStatus; }
}
