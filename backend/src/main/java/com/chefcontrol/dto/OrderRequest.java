package com.chefcontrol.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class OrderRequest {

    @NotBlank(message = "Nome do cliente é obrigatório")
    private String clientName;

    private String category;
    private String subcategory;
    private String productName;
    private String size;
    private BigDecimal quantityKg;
    private Integer unitsPerKg;

    @NotNull
    @DecimalMin("0")
    private BigDecimal valueCharged;

    @NotNull
    @DecimalMin("0")
    private BigDecimal valuePaid;

    @NotNull
    @DecimalMin("0")
    private BigDecimal costTotal;

    @NotNull
    private BigDecimal profit;

    @NotBlank
    private String paymentStatus; // pendente | parcial | pago

    private boolean delivered;
    private List<String> ingredientIds;
    private String observations;
    private String cakeName;
    private String cakeSize;
    private LocalDate deliveryDate;
    private String clientAddress;
    private String pickupAddress;
    private String deliveryAddress;
    private boolean hasDelivery = false;
    private BigDecimal deliveryCost = BigDecimal.ZERO;
    private String orderStatus = "ordered"; // "ordered" | "in_progress" | "completed" | "cancelled"
    private Boolean isCancelled; // null = não alterar, true/false = definir valor
    private List<VariableExpense> variableExpenses;

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
    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }
    public String getClientAddress() { return clientAddress; }
    public void setClientAddress(String clientAddress) { this.clientAddress = clientAddress; }
    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public boolean isHasDelivery() { return hasDelivery; }
    public void setHasDelivery(boolean hasDelivery) { this.hasDelivery = hasDelivery; }
    public BigDecimal getDeliveryCost() { return deliveryCost; }
    public void setDeliveryCost(BigDecimal deliveryCost) { this.deliveryCost = deliveryCost != null ? deliveryCost : BigDecimal.ZERO; }
    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus != null ? orderStatus : "ordered"; }
    public Boolean getIsCancelled() { return isCancelled; }
    public void setIsCancelled(Boolean isCancelled) { this.isCancelled = isCancelled; }
    public List<VariableExpense> getVariableExpenses() { return variableExpenses; }
    public void setVariableExpenses(List<VariableExpense> variableExpenses) { this.variableExpenses = variableExpenses; }
}
