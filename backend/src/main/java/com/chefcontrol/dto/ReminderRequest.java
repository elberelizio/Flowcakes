package com.chefcontrol.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class ReminderRequest {

    @NotBlank(message = "Nome do cliente é obrigatório")
    private String clientName;

    private String address;

    @NotNull(message = "Data de entrega é obrigatória")
    private LocalDate deliveryDate;

    private String description;

    @Min(value = 0, message = "Notificar: mínimo 0 dias (só no dia do lembrete)")
    @Max(value = 90, message = "Notificar: máximo 90 dias antes")
    private Integer notifyDaysBefore;

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getNotifyDaysBefore() { return notifyDaysBefore; }
    public void setNotifyDaysBefore(Integer notifyDaysBefore) { this.notifyDaysBefore = notifyDaysBefore; }
}
