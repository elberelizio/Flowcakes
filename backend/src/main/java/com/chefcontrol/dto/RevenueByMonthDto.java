package com.chefcontrol.dto;

import java.math.BigDecimal;

/**
 * Receita agregada por mês (para relatórios admin e utilizador).
 */
public class RevenueByMonthDto {

    private String month;   // "yyyy-MM"
    private BigDecimal revenue;

    public RevenueByMonthDto() {}

    public RevenueByMonthDto(String month, BigDecimal revenue) {
        this.month = month;
        this.revenue = revenue != null ? revenue : BigDecimal.ZERO;
    }

    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }
    public BigDecimal getRevenue() { return revenue; }
    public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }
}
