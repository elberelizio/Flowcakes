package com.chefcontrol.dto;

import java.math.BigDecimal;

public class TreasuryBillingPeriodDto {

    private String period;
    private int invoiceCount;
    private BigDecimal totalAmount;

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }
    public int getInvoiceCount() { return invoiceCount; }
    public void setInvoiceCount(int invoiceCount) { this.invoiceCount = invoiceCount; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
}
