package com.chefcontrol.dto;

/**
 * Pedido para estender o prazo da licença em N meses (admin).
 */
public class ExtendLicenseRequest {
    private int months = 1;

    public int getMonths() { return months; }
    public void setMonths(int months) { this.months = months; }
}
