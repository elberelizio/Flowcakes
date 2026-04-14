package com.chefcontrol.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public class LicensePaymentDto {

    private String id;
    private String createdAt;
    private BigDecimal amount;
    private Integer durationMonths;
    @JsonProperty("eMolaTransactionId")
    private String eMolaTransactionId;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public Integer getDurationMonths() { return durationMonths; }
    public void setDurationMonths(Integer durationMonths) { this.durationMonths = durationMonths; }
    public String geteMolaTransactionId() { return eMolaTransactionId; }
    public void setEMolaTransactionId(String eMolaTransactionId) { this.eMolaTransactionId = eMolaTransactionId; }
}
