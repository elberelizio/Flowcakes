package com.chefcontrol.dto;

import com.chefcontrol.entity.OrderEntity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class OrderResponse {

    private UUID id;
    private String createdAt; // ISO
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
    private String deliveryDate; // ISO date string
    private boolean hasDelivery;
    private BigDecimal deliveryCost;
    private String orderStatus;
    private boolean isCancelled;
    private List<VariableExpense> variableExpenses = new ArrayList<>();

    public static OrderResponse fromEntity(OrderEntity o) {
        OrderResponse r = new OrderResponse();
        r.setId(o.getId());
        r.setCreatedAt(o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);
        r.setClientName(o.getClientName());
        r.setCategory(o.getCategory());
        r.setSubcategory(o.getSubcategory());
        r.setProductName(o.getProductName());
        r.setSize(o.getSize());
        r.setQuantityKg(o.getQuantityKg());
        r.setUnitsPerKg(o.getUnitsPerKg());
        r.setValueCharged(o.getValueCharged());
        r.setValuePaid(o.getValuePaid());
        r.setCostTotal(o.getCostTotal());
        r.setProfit(o.getProfit());
        r.setPaymentStatus(o.getPaymentStatus());
        r.setDelivered(o.isDelivered());
        r.setIngredientIds(o.getIngredientIds());
        r.setObservations(o.getObservations());
        r.setCakeName(o.getCakeName());
        r.setCakeSize(o.getCakeSize());
        r.setDeliveryDate(o.getDeliveryDate() != null ? o.getDeliveryDate().toString() : null);
        r.setHasDelivery(o.isHasDelivery());
        r.setDeliveryCost(o.getDeliveryCost());
        r.setOrderStatus(o.getOrderStatus());
        r.setCancelled(o.isCancelled());
        r.setVariableExpenses(o.getVariableExpenses() != null ? o.getVariableExpenses() : new ArrayList<>());
        return r;
    }

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
    public String getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(String deliveryDate) { this.deliveryDate = deliveryDate; }
    public boolean isHasDelivery() { return hasDelivery; }
    public void setHasDelivery(boolean hasDelivery) { this.hasDelivery = hasDelivery; }
    public BigDecimal getDeliveryCost() { return deliveryCost; }
    public void setDeliveryCost(BigDecimal deliveryCost) { this.deliveryCost = deliveryCost; }
    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }
    public boolean isCancelled() { return isCancelled; }
    public void setCancelled(boolean cancelled) { isCancelled = cancelled; }
    public List<VariableExpense> getVariableExpenses() { return variableExpenses; }
    public void setVariableExpenses(List<VariableExpense> variableExpenses) { 
        this.variableExpenses = variableExpenses != null ? variableExpenses : new ArrayList<>(); 
    }
}
