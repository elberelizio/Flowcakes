package com.chefcontrol.dto;

import java.math.BigDecimal;

public class TreasuryCategoryAmountDto {

    private String category;
    private BigDecimal amountThisMonth;

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public BigDecimal getAmountThisMonth() { return amountThisMonth; }
    public void setAmountThisMonth(BigDecimal amountThisMonth) { this.amountThisMonth = amountThisMonth; }
}
