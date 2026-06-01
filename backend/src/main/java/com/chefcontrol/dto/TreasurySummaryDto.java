package com.chefcontrol.dto;

import java.math.BigDecimal;
import java.util.List;

public class TreasurySummaryDto {

    private BigDecimal licenseRevenueTotal;
    private BigDecimal licenseRevenueThisMonth;
    private BigDecimal expensesTotal;
    private BigDecimal expensesThisMonth;
    private BigDecimal netProfitTotal;
    private BigDecimal netProfitThisMonth;
    private String bestMonth;
    private BigDecimal bestMonthNetProfit;
    private List<TreasuryMonthRowDto> monthlyRows;
    private BigDecimal maintenanceCashBalance;
    private BigDecimal maintenanceCashTarget;
    private BigDecimal salaryExpensesThisMonth;
    private BigDecimal salaryExpensesTotal;
    private BigDecimal availableAfterReserve;
    private List<TreasuryCategoryAmountDto> expensesByCategoryThisMonth;
    private BigDecimal accountBalance;
    private BigDecimal totalInvested;
    private String roiStatus;
    private BigDecimal amountToBreakEven;
    private BigDecimal profitAboveInvestment;
    private int allocationPercentTotal;
    private int payrollHeadcount;
    private BigDecimal payrollPerPersonSuggested;
    private List<TreasuryAllocationBucketDto> allocationBuckets;
    private long pendingSuggestionsCount;

    public BigDecimal getLicenseRevenueTotal() { return licenseRevenueTotal; }
    public void setLicenseRevenueTotal(BigDecimal licenseRevenueTotal) { this.licenseRevenueTotal = licenseRevenueTotal; }
    public BigDecimal getLicenseRevenueThisMonth() { return licenseRevenueThisMonth; }
    public void setLicenseRevenueThisMonth(BigDecimal licenseRevenueThisMonth) { this.licenseRevenueThisMonth = licenseRevenueThisMonth; }
    public BigDecimal getExpensesTotal() { return expensesTotal; }
    public void setExpensesTotal(BigDecimal expensesTotal) { this.expensesTotal = expensesTotal; }
    public BigDecimal getExpensesThisMonth() { return expensesThisMonth; }
    public void setExpensesThisMonth(BigDecimal expensesThisMonth) { this.expensesThisMonth = expensesThisMonth; }
    public BigDecimal getNetProfitTotal() { return netProfitTotal; }
    public void setNetProfitTotal(BigDecimal netProfitTotal) { this.netProfitTotal = netProfitTotal; }
    public BigDecimal getNetProfitThisMonth() { return netProfitThisMonth; }
    public void setNetProfitThisMonth(BigDecimal netProfitThisMonth) { this.netProfitThisMonth = netProfitThisMonth; }
    public String getBestMonth() { return bestMonth; }
    public void setBestMonth(String bestMonth) { this.bestMonth = bestMonth; }
    public BigDecimal getBestMonthNetProfit() { return bestMonthNetProfit; }
    public void setBestMonthNetProfit(BigDecimal bestMonthNetProfit) { this.bestMonthNetProfit = bestMonthNetProfit; }
    public List<TreasuryMonthRowDto> getMonthlyRows() { return monthlyRows; }
    public void setMonthlyRows(List<TreasuryMonthRowDto> monthlyRows) { this.monthlyRows = monthlyRows; }
    public BigDecimal getMaintenanceCashBalance() { return maintenanceCashBalance; }
    public void setMaintenanceCashBalance(BigDecimal maintenanceCashBalance) { this.maintenanceCashBalance = maintenanceCashBalance; }
    public BigDecimal getMaintenanceCashTarget() { return maintenanceCashTarget; }
    public void setMaintenanceCashTarget(BigDecimal maintenanceCashTarget) { this.maintenanceCashTarget = maintenanceCashTarget; }
    public BigDecimal getSalaryExpensesThisMonth() { return salaryExpensesThisMonth; }
    public void setSalaryExpensesThisMonth(BigDecimal salaryExpensesThisMonth) { this.salaryExpensesThisMonth = salaryExpensesThisMonth; }
    public BigDecimal getSalaryExpensesTotal() { return salaryExpensesTotal; }
    public void setSalaryExpensesTotal(BigDecimal salaryExpensesTotal) { this.salaryExpensesTotal = salaryExpensesTotal; }
    public BigDecimal getAvailableAfterReserve() { return availableAfterReserve; }
    public void setAvailableAfterReserve(BigDecimal availableAfterReserve) { this.availableAfterReserve = availableAfterReserve; }
    public List<TreasuryCategoryAmountDto> getExpensesByCategoryThisMonth() { return expensesByCategoryThisMonth; }
    public void setExpensesByCategoryThisMonth(List<TreasuryCategoryAmountDto> expensesByCategoryThisMonth) {
        this.expensesByCategoryThisMonth = expensesByCategoryThisMonth;
    }
    public BigDecimal getAccountBalance() { return accountBalance; }
    public void setAccountBalance(BigDecimal accountBalance) { this.accountBalance = accountBalance; }
    public BigDecimal getTotalInvested() { return totalInvested; }
    public void setTotalInvested(BigDecimal totalInvested) { this.totalInvested = totalInvested; }
    public String getRoiStatus() { return roiStatus; }
    public void setRoiStatus(String roiStatus) { this.roiStatus = roiStatus; }
    public BigDecimal getAmountToBreakEven() { return amountToBreakEven; }
    public void setAmountToBreakEven(BigDecimal amountToBreakEven) { this.amountToBreakEven = amountToBreakEven; }
    public BigDecimal getProfitAboveInvestment() { return profitAboveInvestment; }
    public void setProfitAboveInvestment(BigDecimal profitAboveInvestment) { this.profitAboveInvestment = profitAboveInvestment; }
    public int getAllocationPercentTotal() { return allocationPercentTotal; }
    public void setAllocationPercentTotal(int allocationPercentTotal) { this.allocationPercentTotal = allocationPercentTotal; }
    public int getPayrollHeadcount() { return payrollHeadcount; }
    public void setPayrollHeadcount(int payrollHeadcount) { this.payrollHeadcount = payrollHeadcount; }
    public BigDecimal getPayrollPerPersonSuggested() { return payrollPerPersonSuggested; }
    public void setPayrollPerPersonSuggested(BigDecimal payrollPerPersonSuggested) { this.payrollPerPersonSuggested = payrollPerPersonSuggested; }
    public List<TreasuryAllocationBucketDto> getAllocationBuckets() { return allocationBuckets; }
    public void setAllocationBuckets(List<TreasuryAllocationBucketDto> allocationBuckets) { this.allocationBuckets = allocationBuckets; }
    public long getPendingSuggestionsCount() { return pendingSuggestionsCount; }
    public void setPendingSuggestionsCount(long pendingSuggestionsCount) { this.pendingSuggestionsCount = pendingSuggestionsCount; }
}
