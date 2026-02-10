package com.chefcontrol.dto;

import java.math.BigDecimal;

public class LicenseStatusResponse {

    private String status;       // "pending" | "paid"
    private BigDecimal amount;
    private String eMolaPhone;
    private String licenseToken; // quando pago
    private boolean accountFinalized;

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
}
