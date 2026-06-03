package com.chefcontrol.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Regista cada tentativa de pagamento M-Pesa C2B para rastreio entre o pedido e o callback.
 */
@Entity
@Table(name = "mpesa_payments")
public class MpesaPaymentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "third_party_id", nullable = false, unique = true, length = 100)
    private String thirdPartyId;

    @Column(name = "conversation_id", length = 100)
    private String conversationId;

    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "duration_months", nullable = false)
    private int durationMonths = 1;

    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    /** pending, completed, failed */
    @Column(nullable = false, length = 20)
    private String status = "pending";

    @Column(name = "mpesa_response_code", length = 20)
    private String mpesaResponseCode;

    @Column(name = "mpesa_response_desc", length = 500)
    private String mpesaResponseDesc;

    /** Em modo simulação: mpesa ou emola; nulo para pagamentos reais. */
    @Column(name = "simulation_channel", length = 20)
    private String simulationChannel;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "admin_rejection_reason", length = 500)
    private String adminRejectionReason;

    @Column(name = "rejected_at")
    private Instant rejectedAt;

    /** Referência opcional que o cliente indicou (SMS, comprovativo, etc.). */
    @Column(name = "user_transfer_reference", length = 120)
    private String userTransferReference;

    /** ID da transação na operadora (ex.: últimos 6 dígitos), confirmado pelo admin. */
    @Column(name = "operator_transaction_ref", length = 32)
    private String operatorTransactionRef;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getThirdPartyId() { return thirdPartyId; }
    public void setThirdPartyId(String thirdPartyId) { this.thirdPartyId = thirdPartyId; }
    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public int getDurationMonths() { return durationMonths; }
    public void setDurationMonths(int durationMonths) { this.durationMonths = durationMonths; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMpesaResponseCode() { return mpesaResponseCode; }
    public void setMpesaResponseCode(String mpesaResponseCode) { this.mpesaResponseCode = mpesaResponseCode; }
    public String getMpesaResponseDesc() { return mpesaResponseDesc; }
    public void setMpesaResponseDesc(String mpesaResponseDesc) { this.mpesaResponseDesc = mpesaResponseDesc; }
    public String getSimulationChannel() { return simulationChannel; }
    public void setSimulationChannel(String simulationChannel) { this.simulationChannel = simulationChannel; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    public String getAdminRejectionReason() { return adminRejectionReason; }
    public void setAdminRejectionReason(String adminRejectionReason) { this.adminRejectionReason = adminRejectionReason; }
    public Instant getRejectedAt() { return rejectedAt; }
    public void setRejectedAt(Instant rejectedAt) { this.rejectedAt = rejectedAt; }
    public String getUserTransferReference() { return userTransferReference; }
    public void setUserTransferReference(String userTransferReference) { this.userTransferReference = userTransferReference; }
    public String getOperatorTransactionRef() { return operatorTransactionRef; }
    public void setOperatorTransactionRef(String operatorTransactionRef) { this.operatorTransactionRef = operatorTransactionRef; }
}
