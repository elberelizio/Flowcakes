package com.chefcontrol.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class LicenseStatusResponse {

    /** EN: pending | trial | paid. Pt: pendente | teste | pago. */
    private String status;
    private BigDecimal amount;
    private String eMolaPhone;
    private String licenseToken; // quando pago
    private boolean accountFinalized;
    private Instant validUntil;  // data de expiração da licença
    private Long daysRemaining;
    private boolean showLicenseExpiryWarning;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String geteMolaPhone() { return eMolaPhone; }
    public void setEMolaPhone(String eMolaPhone) { this.eMolaPhone = eMolaPhone; }
    public String getLicenseToken() { return licenseToken; }
    public void setLicenseToken(String licenseToken) { this.licenseToken = licenseToken; }
    public boolean isAccountFinalized() { return accountFinalized; }
    public void setAccountFinalized(boolean accountFinalized) { this.accountFinalized = accountFinalized; }
    public Instant getValidUntil() { return validUntil; }
    public void setValidUntil(Instant validUntil) { this.validUntil = validUntil; }
    public Long getDaysRemaining() { return daysRemaining; }
    public void setDaysRemaining(Long daysRemaining) { this.daysRemaining = daysRemaining; }
    public boolean isShowLicenseExpiryWarning() { return showLicenseExpiryWarning; }
    public void setShowLicenseExpiryWarning(boolean showLicenseExpiryWarning) { this.showLicenseExpiryWarning = showLicenseExpiryWarning; }
}
