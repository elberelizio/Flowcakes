package com.chefcontrol.dto;

/**
 * Referência do pagamento (ex: número da transacção e-Mola) para teste ou webhook.
 */
public class ConfirmPaymentRequest {

    private String paymentReference;

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
}
