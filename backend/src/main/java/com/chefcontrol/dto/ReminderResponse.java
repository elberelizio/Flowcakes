package com.chefcontrol.dto;

import com.chefcontrol.entity.ReminderEntity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class ReminderResponse {

    private UUID id;
    private String clientName;
    private String address;
    private LocalDate deliveryDate;
    private String description;
    private int notifyDaysBefore;
    private String createdAt; // ISO string for frontend

    public static ReminderResponse fromEntity(ReminderEntity e) {
        ReminderResponse r = new ReminderResponse();
        r.setId(e.getId());
        r.setClientName(e.getClientName());
        r.setAddress(e.getAddress());
        r.setDeliveryDate(e.getDeliveryDate());
        r.setDescription(e.getDescription());
        r.setNotifyDaysBefore(e.getNotifyDaysBefore());
        r.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        return r;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
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
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
