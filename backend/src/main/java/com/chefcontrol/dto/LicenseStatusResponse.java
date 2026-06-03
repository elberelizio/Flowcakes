package com.chefcontrol.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class LicenseStatusResponse {

    /** EN: pending | trial | paid. Pt: pendente | teste | pago. */
    private String status;
    private BigDecimal amount;
    private String eMolaPhone;
    private String mpesaPhone;
    private String supportWhatsapp;
    private String licenseToken; // quando pago
    private boolean accountFinalized;
    private Instant validUntil;  // data de expiração da licença
    private Long daysRemaining;
    private boolean showLicenseExpiryWarning;
    /** Último pedido de transferência manual foi rejeitado pelo administrador. */
    private boolean lastPaymentRejected;
    private String paymentRejectionReason;
    private Instant paymentRejectedAt;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String geteMolaPhone() { return eMolaPhone; }
    public void setEMolaPhone(String eMolaPhone) { this.eMolaPhone = eMolaPhone; }
    public String getMpesaPhone() { return mpesaPhone; }
    public void setMpesaPhone(String mpesaPhone) { this.mpesaPhone = mpesaPhone; }
    public String getSupportWhatsapp() { return supportWhatsapp; }
    public void setSupportWhatsapp(String supportWhatsapp) { this.supportWhatsapp = supportWhatsapp; }
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
    public boolean isLastPaymentRejected() { return lastPaymentRejected; }
    public void setLastPaymentRejected(boolean lastPaymentRejected) { this.lastPaymentRejected = lastPaymentRejected; }
    public String getPaymentRejectionReason() { return paymentRejectionReason; }
    public void setPaymentRejectionReason(String paymentRejectionReason) { this.paymentRejectionReason = paymentRejectionReason; }
    public Instant getPaymentRejectedAt() { return paymentRejectedAt; }
    public void setPaymentRejectedAt(Instant paymentRejectedAt) { this.paymentRejectedAt = paymentRejectedAt; }
}
