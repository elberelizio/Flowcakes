package com.chefcontrol.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "license_transactions", uniqueConstraints = {
    @UniqueConstraint(name = "uq_e_mola_transaction", columnNames = "e_mola_transaction_id")
})
public class LicenseTransactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_license_id", nullable = false)
    private UUID userLicenseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_license_id", nullable = false, insertable = false, updatable = false)
    private UserLicenseEntity userLicense;

    @Column(name = "e_mola_transaction_id", nullable = false, length = 100)
    private String eMolaTransactionId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserLicenseId() { return userLicenseId; }
    public void setUserLicenseId(UUID userLicenseId) { this.userLicenseId = userLicenseId; }
    public UserLicenseEntity getUserLicense() { return userLicense; }
    public void setUserLicense(UserLicenseEntity userLicense) { this.userLicense = userLicense; }
    public String getEMolaTransactionId() { return eMolaTransactionId; }
    public void setEMolaTransactionId(String eMolaTransactionId) { this.eMolaTransactionId = eMolaTransactionId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
