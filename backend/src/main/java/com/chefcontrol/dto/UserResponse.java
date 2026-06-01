package com.chefcontrol.dto;

import java.time.Instant;
import java.util.UUID;

public class UserResponse {

    private UUID id;
    private String phone;
    private Instant createdAt;
    private String fullName;
    private String documentType;
    private String documentNumber;
    private String province;
    private String email;
    /** EN: pending | trial | paid. PT: pendente | teste | pago. */
    private String licenseStatus;
    private Boolean accountFinalized;
    private Boolean admin;
    private Long licenseDaysRemaining;
    private Boolean showLicenseExpiryWarning;
    /** True na primeira sessão até concluir o popup de boas-vindas (utilizadores normais). */
    private Boolean showWelcomeOnboarding;

    public static UserResponse fromEntity(com.chefcontrol.entity.UserEntity u) {
        return fromEntity(u, null);
    }

    public static UserResponse fromEntity(com.chefcontrol.entity.UserEntity u, String licenseStatus) {
        UserResponse r = new UserResponse();
        r.setId(u.getId());
        r.setPhone(u.getPhone());
        r.setFullName(u.getFullName());
        r.setDocumentType(u.getDocumentType());
        r.setDocumentNumber(u.getDocumentNumber());
        r.setProvince(u.getProvince());
        r.setEmail(u.getEmail());
        r.setCreatedAt(u.getCreatedAt());
        r.setLicenseStatus(licenseStatus);
        r.setAccountFinalized("paid".equals(licenseStatus) || "trial".equals(licenseStatus));
        r.setAdmin(u.isAdmin());
        r.setShowWelcomeOnboarding(!u.isAdmin() && u.getOnboardingCompletedAt() == null);
        return r;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }
    public String getDocumentNumber() { return documentNumber; }
    public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }
    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getLicenseStatus() { return licenseStatus; }
    public void setLicenseStatus(String licenseStatus) { this.licenseStatus = licenseStatus; }
    public Boolean getAccountFinalized() { return accountFinalized; }
    public void setAccountFinalized(Boolean accountFinalized) { this.accountFinalized = accountFinalized; }
    public Boolean getAdmin() { return admin; }
    public void setAdmin(Boolean admin) { this.admin = admin; }
    public Long getLicenseDaysRemaining() { return licenseDaysRemaining; }
    public void setLicenseDaysRemaining(Long licenseDaysRemaining) { this.licenseDaysRemaining = licenseDaysRemaining; }
    public Boolean getShowLicenseExpiryWarning() { return showLicenseExpiryWarning; }
    public void setShowLicenseExpiryWarning(Boolean showLicenseExpiryWarning) { this.showLicenseExpiryWarning = showLicenseExpiryWarning; }
    public Boolean getShowWelcomeOnboarding() { return showWelcomeOnboarding; }
    public void setShowWelcomeOnboarding(Boolean showWelcomeOnboarding) { this.showWelcomeOnboarding = showWelcomeOnboarding; }
}
