package com.chefcontrol.dto;

public class SystemNotificationDto {
    private String id;
    private String title;
    private String message;
    private String type;
    private String createdAt;
    private String expiresAt;
    private boolean active;
    private String category;
    /** users | admins */
    private String audience;
    private String maintenanceStartAt;
    private String maintenanceEndAt;
    private boolean dismissed;
    /** scheduled | active | ended — apenas para manutenção */
    private String maintenancePhase;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getExpiresAt() { return expiresAt; }
    public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getAudience() { return audience; }
    public void setAudience(String audience) { this.audience = audience; }
    public String getMaintenanceStartAt() { return maintenanceStartAt; }
    public void setMaintenanceStartAt(String maintenanceStartAt) { this.maintenanceStartAt = maintenanceStartAt; }
    public String getMaintenanceEndAt() { return maintenanceEndAt; }
    public void setMaintenanceEndAt(String maintenanceEndAt) { this.maintenanceEndAt = maintenanceEndAt; }
    public boolean isDismissed() { return dismissed; }
    public void setDismissed(boolean dismissed) { this.dismissed = dismissed; }
    public String getMaintenancePhase() { return maintenancePhase; }
    public void setMaintenancePhase(String maintenancePhase) { this.maintenancePhase = maintenancePhase; }
}
