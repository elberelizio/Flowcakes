package com.chefcontrol.dto;

import java.math.BigDecimal;

public class SimulatedPaymentPendingDto {
    private String paymentId;
    private String userId;
    private String userFullName;
    private String userPhone;
    private BigDecimal amount;
    private int durationMonths;
    /** Referência interna Chef Control (gerada automaticamente ao registar o pedido). */
    private String transactionRef;
    /** Referência opcional indicada pelo cliente no formulário. */
    private String userTransferReference;
    private String createdAt;
    /** mpesa ou emola (só simulação). */
    private String simulationChannel;

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserFullName() { return userFullName; }
    public void setUserFullName(String userFullName) { this.userFullName = userFullName; }
    public String getUserPhone() { return userPhone; }
    public void setUserPhone(String userPhone) { this.userPhone = userPhone; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public int getDurationMonths() { return durationMonths; }
    public void setDurationMonths(int durationMonths) { this.durationMonths = durationMonths; }
    public String getTransactionRef() { return transactionRef; }
    public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }
    public String getUserTransferReference() { return userTransferReference; }
    public void setUserTransferReference(String userTransferReference) { this.userTransferReference = userTransferReference; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getSimulationChannel() { return simulationChannel; }
    public void setSimulationChannel(String simulationChannel) { this.simulationChannel = simulationChannel; }
}
