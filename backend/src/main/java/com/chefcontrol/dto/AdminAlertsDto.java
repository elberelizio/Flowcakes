package com.chefcontrol.dto;

import java.util.List;

public class AdminAlertsDto {

    private int healthScore;
    private boolean maintenanceDue;
    private String maintenanceMessage;
    private boolean feedbackThresholdReached;
    private long feedbackCount;
    private int feedbackThreshold;
    private long pendingApprovals;
    private long blockedUsers;
    private long usersOnline;
    private List<AdminAlertItemDto> items;

    public int getHealthScore() { return healthScore; }
    public void setHealthScore(int healthScore) { this.healthScore = healthScore; }
    public boolean isMaintenanceDue() { return maintenanceDue; }
    public void setMaintenanceDue(boolean maintenanceDue) { this.maintenanceDue = maintenanceDue; }
    public String getMaintenanceMessage() { return maintenanceMessage; }
    public void setMaintenanceMessage(String maintenanceMessage) { this.maintenanceMessage = maintenanceMessage; }
    public boolean isFeedbackThresholdReached() { return feedbackThresholdReached; }
    public void setFeedbackThresholdReached(boolean feedbackThresholdReached) { this.feedbackThresholdReached = feedbackThresholdReached; }
    public long getFeedbackCount() { return feedbackCount; }
    public void setFeedbackCount(long feedbackCount) { this.feedbackCount = feedbackCount; }
    public int getFeedbackThreshold() { return feedbackThreshold; }
    public void setFeedbackThreshold(int feedbackThreshold) { this.feedbackThreshold = feedbackThreshold; }
    public long getPendingApprovals() { return pendingApprovals; }
    public void setPendingApprovals(long pendingApprovals) { this.pendingApprovals = pendingApprovals; }
    public long getBlockedUsers() { return blockedUsers; }
    public void setBlockedUsers(long blockedUsers) { this.blockedUsers = blockedUsers; }
    public long getUsersOnline() { return usersOnline; }
    public void setUsersOnline(long usersOnline) { this.usersOnline = usersOnline; }
    public List<AdminAlertItemDto> getItems() { return items; }
    public void setItems(List<AdminAlertItemDto> items) { this.items = items; }
}
