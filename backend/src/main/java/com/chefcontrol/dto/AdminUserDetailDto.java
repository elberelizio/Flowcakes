package com.chefcontrol.dto;

import java.time.Instant;

/**
 * Detalhes completos do utilizador para o admin: perfil, licença e histórico de uso.
 */
public class AdminUserDetailDto {

    private String id;
    private String fullName;
    private String phone;
    private String documentType;
    private String documentNumber;
    private String province;
    private String email;
    private Instant createdAt;

    // Licença
    private String licenseStatus;
    private String licenseToken;
    private String licenseActivationToken;
    private Instant licenseValidUntil;
    private Instant licensePaidAt;
    private String licensePaymentReference;
    private Instant licenseCreatedAt;

    private boolean blocked;

    // Uso do sistema
    private Long totalLogins;
    private Instant firstLoginAt;
    private Instant lastLoginAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }
    public String getDocumentNumber() { return documentNumber; }
    public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }
    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public boolean isBlocked() { return blocked; }
    public void setBlocked(boolean blocked) { this.blocked = blocked; }
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
    public String getLicensePaymentReference() { return licensePaymentReference; }
    public void setLicensePaymentReference(String licensePaymentReference) { this.licensePaymentReference = licensePaymentReference; }
    public Instant getLicenseCreatedAt() { return licenseCreatedAt; }
    public void setLicenseCreatedAt(Instant licenseCreatedAt) { this.licenseCreatedAt = licenseCreatedAt; }
    public Long getTotalLogins() { return totalLogins; }
    public void setTotalLogins(Long totalLogins) { this.totalLogins = totalLogins; }
    public Instant getFirstLoginAt() { return firstLoginAt; }
    public void setFirstLoginAt(Instant firstLoginAt) { this.firstLoginAt = firstLoginAt; }
    public Instant getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(Instant lastLoginAt) { this.lastLoginAt = lastLoginAt; }
}
