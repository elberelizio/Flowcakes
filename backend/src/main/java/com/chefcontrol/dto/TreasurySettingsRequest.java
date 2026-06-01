package com.chefcontrol.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class TreasurySettingsRequest {

    @NotNull
    @DecimalMin("0")
    private BigDecimal accountBalance;

    @Min(0) @Max(100)
    private int maintenancePercent;

    @Min(0) @Max(100)
    private int fixedExpensesPercent;

    @Min(0) @Max(100)
    private int reservePercent;

    @Min(0) @Max(100)
    private int payrollPercent;

    @Min(0) @Max(100)
    private int toolsPercent;

    @Min(1) @Max(50)
    private int payrollHeadcount;

    public BigDecimal getAccountBalance() { return accountBalance; }
    public void setAccountBalance(BigDecimal accountBalance) { this.accountBalance = accountBalance; }
    public int getMaintenancePercent() { return maintenancePercent; }
    public void setMaintenancePercent(int maintenancePercent) { this.maintenancePercent = maintenancePercent; }
    public int getFixedExpensesPercent() { return fixedExpensesPercent; }
    public void setFixedExpensesPercent(int fixedExpensesPercent) { this.fixedExpensesPercent = fixedExpensesPercent; }
    public int getReservePercent() { return reservePercent; }
    public void setReservePercent(int reservePercent) { this.reservePercent = reservePercent; }
    public int getPayrollPercent() { return payrollPercent; }
    public void setPayrollPercent(int payrollPercent) { this.payrollPercent = payrollPercent; }
    public int getToolsPercent() { return toolsPercent; }
    public void setToolsPercent(int toolsPercent) { this.toolsPercent = toolsPercent; }
    public int getPayrollHeadcount() { return payrollHeadcount; }
    public void setPayrollHeadcount(int payrollHeadcount) { this.payrollHeadcount = payrollHeadcount; }
}
