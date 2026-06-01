package com.chefcontrol.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "system_notifications")
public class SystemNotificationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 20)
    private String type = "info"; // info | warning | success

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    /** announcement | maintenance */
    @Column(nullable = false, length = 30)
    private String category = "announcement";

    @Column(name = "maintenance_start_at")
    private Instant maintenanceStartAt;

    @Column(name = "maintenance_end_at")
    private Instant maintenanceEndAt;

    /** users = aviso aos clientes; admins = alerta interno */
    @Column(nullable = false, length = 20)
    private String audience = "users";

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Instant getMaintenanceStartAt() { return maintenanceStartAt; }
    public void setMaintenanceStartAt(Instant maintenanceStartAt) { this.maintenanceStartAt = maintenanceStartAt; }
    public Instant getMaintenanceEndAt() { return maintenanceEndAt; }
    public void setMaintenanceEndAt(Instant maintenanceEndAt) { this.maintenanceEndAt = maintenanceEndAt; }
    public String getAudience() { return audience; }
    public void setAudience(String audience) { this.audience = audience; }
}
