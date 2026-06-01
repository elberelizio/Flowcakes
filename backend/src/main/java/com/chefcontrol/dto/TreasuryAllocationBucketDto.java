package com.chefcontrol.dto;

import java.math.BigDecimal;

public class TreasuryAllocationBucketDto {

    private String key;
    private int percent;
    private BigDecimal allocatedAmount;
    private BigDecimal spentThisMonth;
    private BigDecimal remainingInBucket;

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public int getPercent() { return percent; }
    public void setPercent(int percent) { this.percent = percent; }
    public BigDecimal getAllocatedAmount() { return allocatedAmount; }
    public void setAllocatedAmount(BigDecimal allocatedAmount) { this.allocatedAmount = allocatedAmount; }
    public BigDecimal getSpentThisMonth() { return spentThisMonth; }
    public void setSpentThisMonth(BigDecimal spentThisMonth) { this.spentThisMonth = spentThisMonth; }
    public BigDecimal getRemainingInBucket() { return remainingInBucket; }
    public void setRemainingInBucket(BigDecimal remainingInBucket) { this.remainingInBucket = remainingInBucket; }
}
