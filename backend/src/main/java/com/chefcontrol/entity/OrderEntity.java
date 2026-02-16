package com.chefcontrol.entity;

import com.chefcontrol.dto.VariableExpense;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "client_name", nullable = false, length = 200)
    private String clientName;

    @Column(length = 20)
    private String category; // "doces" | "salgados"

    @Column(length = 100)
    private String subcategory;

    @Column(name = "product_name", length = 200)
    private String productName;

    @Column(length = 50)
    private String size;

    @Column(name = "quantity_kg", precision = 10, scale = 2)
    private BigDecimal quantityKg;

    @Column(name = "units_per_kg")
    private Integer unitsPerKg;

    @Column(name = "value_charged", nullable = false, precision = 12, scale = 2)
    private BigDecimal valueCharged;

    @Column(name = "value_paid", nullable = false, precision = 12, scale = 2)
    private BigDecimal valuePaid;

    @Column(name = "cost_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal costTotal;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal profit;

    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus; // "pendente" | "parcial" | "pago"

    @Column(nullable = false)
    private boolean delivered;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_ingredient_ids", joinColumns = @JoinColumn(name = "order_id"))
    @Column(name = "ingredient_id")
    private List<String> ingredientIds = new ArrayList<>();

    @Column(length = 1000)
    private String observations;

    @Column(name = "cake_name", length = 200)
    private String cakeName;

    @Column(name = "cake_size", length = 50)
    private String cakeSize;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "has_delivery", nullable = false)
    private boolean hasDelivery = false;

    @Column(name = "delivery_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal deliveryCost = BigDecimal.ZERO;

    @Column(name = "order_status", nullable = false, length = 20)
    private String orderStatus = "ordered"; // "ordered" | "in_progress" | "completed" | "cancelled"

    @Column(name = "is_cancelled", nullable = false)
    private boolean isCancelled = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "variable_expenses", columnDefinition = "jsonb")
    private List<VariableExpense> variableExpenses = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    // getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
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
    public void setIngredientIds(List<String> ingredientIds) { this.ingredientIds = ingredientIds != null ? ingredientIds : new ArrayList<>(); }
    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }
    public String getCakeName() { return cakeName; }
    public void setCakeName(String cakeName) { this.cakeName = cakeName; }
    public String getCakeSize() { return cakeSize; }
    public void setCakeSize(String cakeSize) { this.cakeSize = cakeSize; }
    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }
    public boolean isHasDelivery() { return hasDelivery; }
    public void setHasDelivery(boolean hasDelivery) { this.hasDelivery = hasDelivery; }
    public BigDecimal getDeliveryCost() { return deliveryCost; }
    public void setDeliveryCost(BigDecimal deliveryCost) { this.deliveryCost = deliveryCost != null ? deliveryCost : BigDecimal.ZERO; }
    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus != null ? orderStatus : "ordered"; }
    public boolean isCancelled() { return isCancelled; }
    public void setCancelled(boolean cancelled) { isCancelled = cancelled; }
    public List<VariableExpense> getVariableExpenses() { return variableExpenses; }
    public void setVariableExpenses(List<VariableExpense> variableExpenses) { 
        this.variableExpenses = variableExpenses != null ? variableExpenses : new ArrayList<>(); 
    }
    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
}
