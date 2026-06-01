package com.chefcontrol.dto;

public class UserActivityHistoryRowDto {
    private String id;
    private String sessionId;
    private String activityType;
    private String label;
    private String pagePath;
    private String operation;
    private String detail;
    private String ipAddress;
    private String sessionStartedAt;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getPagePath() { return pagePath; }
    public void setPagePath(String pagePath) { this.pagePath = pagePath; }
    public String getOperation() { return operation; }
    public void setOperation(String operation) { this.operation = operation; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getSessionStartedAt() { return sessionStartedAt; }
    public void setSessionStartedAt(String sessionStartedAt) { this.sessionStartedAt = sessionStartedAt; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
