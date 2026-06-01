package com.chefcontrol.dto;

public class SystemNotificationRequest {
    private String title;
    private String message;
    private String type; // info | warning | success | error
    /** announcement | maintenance */
    private String category;
    /** ISO-8601 instant ou data local yyyy-MM-dd */
    private String maintenanceStartAt;
    private String maintenanceEndAt;
    /** standard | new_features | custom — só para category=maintenance */
    private String maintenanceTemplate;
    private String expiresAt;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getMaintenanceStartAt() { return maintenanceStartAt; }
    public void setMaintenanceStartAt(String maintenanceStartAt) { this.maintenanceStartAt = maintenanceStartAt; }
    public String getMaintenanceEndAt() { return maintenanceEndAt; }
    public void setMaintenanceEndAt(String maintenanceEndAt) { this.maintenanceEndAt = maintenanceEndAt; }
    public String getMaintenanceTemplate() { return maintenanceTemplate; }
    public void setMaintenanceTemplate(String maintenanceTemplate) { this.maintenanceTemplate = maintenanceTemplate; }
    public String getExpiresAt() { return expiresAt; }
    public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }
}
