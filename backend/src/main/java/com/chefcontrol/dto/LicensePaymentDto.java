package com.chefcontrol.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public class LicensePaymentDto {

    private String id;
    private String createdAt;
    private BigDecimal amount;
    private Integer durationMonths;
    /** Dias de validade (durationMonths × 30). */
    private Integer durationDays;
    @JsonProperty("eMolaTransactionId")
    private String eMolaTransactionId;
    private String receiptNumber;
    private String validUntilAfter;
    /** Sempre confirmado para transacções em license_transactions. */
    private String paymentStatus = "confirmed";

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public Integer getDurationMonths() { return durationMonths; }
    public void setDurationMonths(Integer durationMonths) { this.durationMonths = durationMonths; }
    public Integer getDurationDays() { return durationDays; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }
    public String geteMolaTransactionId() { return eMolaTransactionId; }
    public void setEMolaTransactionId(String eMolaTransactionId) { this.eMolaTransactionId = eMolaTransactionId; }
    public String getReceiptNumber() { return receiptNumber; }
    public void setReceiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; }
    public String getValidUntilAfter() { return validUntilAfter; }
    public void setValidUntilAfter(String validUntilAfter) { this.validUntilAfter = validUntilAfter; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
}
