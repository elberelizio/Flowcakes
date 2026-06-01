package com.chefcontrol.dto;

import java.util.List;

public class UserSessionDetailDto {
    private String id;
    private String startedAt;
    private String endedAt;
    private String ipAddress;
    private boolean active;
    private List<UserActivityItemDto> activities;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getStartedAt() { return startedAt; }
    public void setStartedAt(String startedAt) { this.startedAt = startedAt; }
    public String getEndedAt() { return endedAt; }
    public void setEndedAt(String endedAt) { this.endedAt = endedAt; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public List<UserActivityItemDto> getActivities() { return activities; }
    public void setActivities(List<UserActivityItemDto> activities) { this.activities = activities; }
}
