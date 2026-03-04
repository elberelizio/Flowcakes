package com.chefcontrol.dto;

import java.math.BigDecimal;

public class VariableExpense {
    private String name;
    private BigDecimal amount;

    public VariableExpense() {
    }

    public VariableExpense(String name, BigDecimal amount) {
        this.name = name;
        this.amount = amount;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
