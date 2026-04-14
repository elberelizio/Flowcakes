package com.chefcontrol.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "reminders")
public class ReminderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "client_name", nullable = false, length = 200)
    private String clientName;

    @Column(length = 500)
    private String address;

    @Column(name = "delivery_date", nullable = false)
    private LocalDate deliveryDate;

    @Column(length = 1000)
    private String description;

    /** Começar a notificar quando faltarem N dias ou menos até à data (0 = só no dia). */
    @Column(name = "notify_days_before", nullable = false)
    private int notifyDaysBefore = 5;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getNotifyDaysBefore() { return notifyDaysBefore; }
    public void setNotifyDaysBefore(int notifyDaysBefore) { this.notifyDaysBefore = notifyDaysBefore; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
