package com.chefcontrol.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class TreasuryCashReserveRequest {

    @NotNull
    @DecimalMin("0")
    private BigDecimal balance;

    @NotNull
    @DecimalMin("0")
    private BigDecimal target;

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
    public BigDecimal getTarget() { return target; }
    public void setTarget(BigDecimal target) { this.target = target; }
}
