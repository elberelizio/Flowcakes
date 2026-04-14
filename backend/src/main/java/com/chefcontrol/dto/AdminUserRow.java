package com.chefcontrol.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Linha para listagem admin: utilizador e estado da licença (pagamento aprovado ou não).
 */
public class AdminUserRow {

    private UUID id;
    private String fullName;
    private String phone;
    private String documentType;   // BI | NUIT
    private String documentNumber; // número do documento
    private String province;
    private String email;
    private Instant createdAt;
    private String licenseStatus; // pending | paid
    private String licenseToken;
    /** Token opaco para construir o link de ativação (não é o código da licença). */
    private String licenseActivationToken;
    private Instant licenseValidUntil;
    private Instant licensePaidAt;
    private BigDecimal licenseAmount;
    private String licensePaymentReference;
    private Instant licenseRejectedAt;
    private boolean blocked;
    private boolean admin;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getDocumentNumber() { return documentNumber; }
    public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }
    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }
    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public String getLicenseStatus() { return licenseStatus; }
    public void setLicenseStatus(String licenseStatus) { this.licenseStatus = licenseStatus; }
    public String getLicenseToken() { return licenseToken; }
    public void setLicenseToken(String licenseToken) { this.licenseToken = licenseToken; }
    public String getLicenseActivationToken() { return licenseActivationToken; }
    public void setLicenseActivationToken(String licenseActivationToken) { this.licenseActivationToken = licenseActivationToken; }
    public Instant getLicenseValidUntil() { return licenseValidUntil; }
    public void setLicenseValidUntil(Instant licenseValidUntil) { this.licenseValidUntil = licenseValidUntil; }
    public Instant getLicensePaidAt() { return licensePaidAt; }
    public void setLicensePaidAt(Instant licensePaidAt) { this.licensePaidAt = licensePaidAt; }
    public BigDecimal getLicenseAmount() { return licenseAmount; }
    public void setLicenseAmount(BigDecimal licenseAmount) { this.licenseAmount = licenseAmount; }
    public String getLicensePaymentReference() { return licensePaymentReference; }
    public void setLicensePaymentReference(String licensePaymentReference) { this.licensePaymentReference = licensePaymentReference; }
    public Instant getLicenseRejectedAt() { return licenseRejectedAt; }
    public void setLicenseRejectedAt(Instant licenseRejectedAt) { this.licenseRejectedAt = licenseRejectedAt; }
    public boolean isBlocked() { return blocked; }
    public void setBlocked(boolean blocked) { this.blocked = blocked; }
    public boolean isAdmin() { return admin; }
    public void setAdmin(boolean admin) { this.admin = admin; }
}
