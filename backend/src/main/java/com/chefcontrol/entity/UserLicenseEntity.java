package com.chefcontrol.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_licenses")
public class UserLicenseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, insertable = false, updatable = false)
    private UserEntity user;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /** EN: DB license state. PT: Estado na BD — pending | trial | paid. */
    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "license_token", unique = true, length = 100)
    private String licenseToken;

    /** Token opaco para o link de ativação (não é o código da licença). */
    @Column(name = "activation_token", unique = true, length = 64)
    private String activationToken;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "valid_until")
    private Instant validUntil;

    @Column(name = "payment_phone", length = 50)
    private String paymentPhone;

    @Column(name = "payment_reference", length = 200)
    private String paymentReference;

    /** Quando o admin rejeitou; null = não rejeitado. Rejeitados podem ser aprovados depois com ID de pagamento. */
    @Column(name = "rejected_at")
    private Instant rejectedAt;

    /** Última vez que o utilizador indicou ter efectuado transferência (e-Mola). */
    @Column(name = "payment_reported_at")
    private Instant paymentReportedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getLicenseToken() { return licenseToken; }
    public void setLicenseToken(String licenseToken) { this.licenseToken = licenseToken; }
    public String getActivationToken() { return activationToken; }
    public void setActivationToken(String activationToken) { this.activationToken = activationToken; }
    public Instant getPaidAt() { return paidAt; }
    public void setPaidAt(Instant paidAt) { this.paidAt = paidAt; }
    public Instant getValidUntil() { return validUntil; }
    public void setValidUntil(Instant validUntil) { this.validUntil = validUntil; }
    public String getPaymentPhone() { return paymentPhone; }
    public void setPaymentPhone(String paymentPhone) { this.paymentPhone = paymentPhone; }
    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
    public Instant getRejectedAt() { return rejectedAt; }
    public void setRejectedAt(Instant rejectedAt) { this.rejectedAt = rejectedAt; }
    public Instant getPaymentReportedAt() { return paymentReportedAt; }
    public void setPaymentReportedAt(Instant paymentReportedAt) { this.paymentReportedAt = paymentReportedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
