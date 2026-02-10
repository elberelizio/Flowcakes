package com.chefcontrol.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Pedido para listagem admin: dados do pedido + utilizador associado.
 */
public class AdminOrderResponse {

    private UUID id;
    private String createdAt;
    private String clientName;
    private String category;
    private String subcategory;
    private String productName;
    private String size;
    private BigDecimal quantityKg;
    private Integer unitsPerKg;
    private BigDecimal valueCharged;
    private BigDecimal valuePaid;
    private BigDecimal costTotal;
    private BigDecimal profit;
    private String paymentStatus;
    private boolean delivered;
    private List<String> ingredientIds;
    private String observations;
    private String cakeName;
    private String cakeSize;

    private String userPhone;
    private String userFullName;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSubcategory() { return subcategory; }
    public void setSubcategory(String subcategory) { this.subcategory = subcategory; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }
    public BigDecimal getQuantityKg() { return quantityKg; }
    public void setQuantityKg(BigDecimal quantityKg) { this.quantityKg = quantityKg; }
    public Integer getUnitsPerKg() { return unitsPerKg; }
    public void setUnitsPerKg(Integer unitsPerKg) { this.unitsPerKg = unitsPerKg; }
    public BigDecimal getValueCharged() { return valueCharged; }
    public void setValueCharged(BigDecimal valueCharged) { this.valueCharged = valueCharged; }
    public BigDecimal getValuePaid() { return valuePaid; }
    public void setValuePaid(BigDecimal valuePaid) { this.valuePaid = valuePaid; }
    public BigDecimal getCostTotal() { return costTotal; }
    public void setCostTotal(BigDecimal costTotal) { this.costTotal = costTotal; }
    public BigDecimal getProfit() { return profit; }
    public void setProfit(BigDecimal profit) { this.profit = profit; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public boolean isDelivered() { return delivered; }
    public void setDelivered(boolean delivered) { this.delivered = delivered; }
    public List<String> getIngredientIds() { return ingredientIds; }
    public void setIngredientIds(List<String> ingredientIds) { this.ingredientIds = ingredientIds; }
    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }
    public String getCakeName() { return cakeName; }
    public void setCakeName(String cakeName) { this.cakeName = cakeName; }
    public String getCakeSize() { return cakeSize; }
    public void setCakeSize(String cakeSize) { this.cakeSize = cakeSize; }
    public String getUserPhone() { return userPhone; }
    public void setUserPhone(String userPhone) { this.userPhone = userPhone; }
    public String getUserFullName() { return userFullName; }
    public void setUserFullName(String userFullName) { this.userFullName = userFullName; }
}
