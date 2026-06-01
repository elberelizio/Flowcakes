package com.chefcontrol.dto;

public class AccessLogUserSummaryDto {
    private String userId;
    private String userPhone;
    private String userFullName;
    private boolean admin;
    private long totalLogins;
    private String firstLoginAt;
    private String lastLoginAt;
    private String lastIpAddress;

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserPhone() { return userPhone; }
    public void setUserPhone(String userPhone) { this.userPhone = userPhone; }
    public String getUserFullName() { return userFullName; }
    public void setUserFullName(String userFullName) { this.userFullName = userFullName; }
    public boolean isAdmin() { return admin; }
    public void setAdmin(boolean admin) { this.admin = admin; }
    public long getTotalLogins() { return totalLogins; }
    public void setTotalLogins(long totalLogins) { this.totalLogins = totalLogins; }
    public String getFirstLoginAt() { return firstLoginAt; }
    public void setFirstLoginAt(String firstLoginAt) { this.firstLoginAt = firstLoginAt; }
    public String getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(String lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    public String getLastIpAddress() { return lastIpAddress; }
    public void setLastIpAddress(String lastIpAddress) { this.lastIpAddress = lastIpAddress; }
}
