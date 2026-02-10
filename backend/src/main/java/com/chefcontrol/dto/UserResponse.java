package com.chefcontrol.dto;

import java.util.UUID;

public class UserResponse {

    private UUID id;
    private String phone;
    private String fullName;
    private String documentType;
    private String documentNumber;
    private String province;
    private String email;
    private String licenseStatus; // "pending" | "paid"
    private Boolean accountFinalized;
    private Boolean licenseCodeValidated;
    private Boolean admin;

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
        r.setLicenseStatus(licenseStatus);
        r.setAccountFinalized("paid".equals(licenseStatus));
        r.setAdmin(u.isAdmin());
        return r;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
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
    public Boolean getLicenseCodeValidated() { return licenseCodeValidated; }
    public void setLicenseCodeValidated(Boolean licenseCodeValidated) { this.licenseCodeValidated = licenseCodeValidated; }
    public Boolean getAdmin() { return admin; }
    public void setAdmin(Boolean admin) { this.admin = admin; }
}
