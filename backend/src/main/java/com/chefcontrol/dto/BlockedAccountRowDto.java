package com.chefcontrol.dto;

public class BlockedAccountRowDto {

    private String id;
    private String phone;
    private String fullName;
    private String blockReason;
    private int failedPasswordAttempts;
    private String blockedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getBlockReason() { return blockReason; }
    public void setBlockReason(String blockReason) { this.blockReason = blockReason; }
    public int getFailedPasswordAttempts() { return failedPasswordAttempts; }
    public void setFailedPasswordAttempts(int failedPasswordAttempts) { this.failedPasswordAttempts = failedPasswordAttempts; }
    public String getBlockedAt() { return blockedAt; }
    public void setBlockedAt(String blockedAt) { this.blockedAt = blockedAt; }
}
