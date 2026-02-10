package com.chefcontrol.dto;

import java.time.Instant;

/**
 * Resposta pública (link de ativação): nome do utilizador, código da licença e validade.
 */
public class LicenseInfoPublicDto {

    private String fullName;
    private String licenseToken;
    private Instant validUntil;
    private boolean expired;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getLicenseToken() { return licenseToken; }
    public void setLicenseToken(String licenseToken) { this.licenseToken = licenseToken; }
    public Instant getValidUntil() { return validUntil; }
    public void setValidUntil(Instant validUntil) { this.validUntil = validUntil; }
    public boolean isExpired() { return expired; }
    public void setExpired(boolean expired) { this.expired = expired; }
}
