package com.chefcontrol.dto;

import com.chefcontrol.entity.WithdrawalEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class WithdrawalResponse {

    private UUID id;
    private BigDecimal amount;
    private LocalDate withdrawalDate;
    private String description;
    private String createdAt;

    public static WithdrawalResponse fromEntity(WithdrawalEntity e) {
        WithdrawalResponse r = new WithdrawalResponse();
        r.setId(e.getId());
        r.setAmount(e.getAmount());
        r.setWithdrawalDate(e.getWithdrawalDate());
        r.setDescription(e.getDescription());
        r.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        return r;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getWithdrawalDate() { return withdrawalDate; }
    public void setWithdrawalDate(LocalDate withdrawalDate) { this.withdrawalDate = withdrawalDate; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
