package com.chefcontrol.dto;

import java.math.BigDecimal;

public class TreasuryMonthRowDto {

    private String month;
    private BigDecimal licenseRevenue;
    private BigDecimal expenses;
    private BigDecimal netProfit;

    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }
    public BigDecimal getLicenseRevenue() { return licenseRevenue; }
    public void setLicenseRevenue(BigDecimal licenseRevenue) { this.licenseRevenue = licenseRevenue; }
    public BigDecimal getExpenses() { return expenses; }
    public void setExpenses(BigDecimal expenses) { this.expenses = expenses; }
    public BigDecimal getNetProfit() { return netProfit; }
    public void setNetProfit(BigDecimal netProfit) { this.netProfit = netProfit; }
}
