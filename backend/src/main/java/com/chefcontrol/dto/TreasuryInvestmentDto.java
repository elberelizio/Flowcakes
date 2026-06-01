package com.chefcontrol.dto;

import java.math.BigDecimal;

public class TreasuryInvestmentDto {

    private String id;
    private BigDecimal amount;
    private String investedAt;
    private String notes;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getInvestedAt() { return investedAt; }
    public void setInvestedAt(String investedAt) { this.investedAt = investedAt; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
