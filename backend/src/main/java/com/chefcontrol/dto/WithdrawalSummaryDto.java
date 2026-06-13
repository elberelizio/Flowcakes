package com.chefcontrol.dto;

import java.math.BigDecimal;

public class WithdrawalSummaryDto {

    private BigDecimal totalProfit;
    private BigDecimal totalWithdrawn;
    private BigDecimal availableProfit;

    public WithdrawalSummaryDto() {
    }

    public WithdrawalSummaryDto(BigDecimal totalProfit, BigDecimal totalWithdrawn, BigDecimal availableProfit) {
        this.totalProfit = totalProfit;
        this.totalWithdrawn = totalWithdrawn;
        this.availableProfit = availableProfit;
    }

    public BigDecimal getTotalProfit() {
        return totalProfit;
    }

    public void setTotalProfit(BigDecimal totalProfit) {
        this.totalProfit = totalProfit;
    }

    public BigDecimal getTotalWithdrawn() {
        return totalWithdrawn;
    }

    public void setTotalWithdrawn(BigDecimal totalWithdrawn) {
        this.totalWithdrawn = totalWithdrawn;
    }

    public BigDecimal getAvailableProfit() {
        return availableProfit;
    }

    public void setAvailableProfit(BigDecimal availableProfit) {
        this.availableProfit = availableProfit;
    }
}
