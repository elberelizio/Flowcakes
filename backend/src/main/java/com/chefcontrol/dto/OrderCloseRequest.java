package com.chefcontrol.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class OrderCloseRequest {

    @NotBlank(message = "Motivo é obrigatório")
    private String closureReason;

    private String closureNote;

    @NotBlank(message = "Estado de produção é obrigatório")
    private String productionStage;

    @NotBlank(message = "Tipo de devolução é obrigatório")
    private String refundType;

    @DecimalMin("0")
    private BigDecimal valuePaidAfterClose;

    @DecimalMin("0")
    private BigDecimal refundAmount;

    @DecimalMin("0")
    private BigDecimal lossAmount;

    public String getClosureReason() { return closureReason; }
    public void setClosureReason(String closureReason) { this.closureReason = closureReason; }
    public String getClosureNote() { return closureNote; }
    public void setClosureNote(String closureNote) { this.closureNote = closureNote; }
    public String getProductionStage() { return productionStage; }
    public void setProductionStage(String productionStage) { this.productionStage = productionStage; }
    public String getRefundType() { return refundType; }
    public void setRefundType(String refundType) { this.refundType = refundType; }
    public BigDecimal getValuePaidAfterClose() { return valuePaidAfterClose; }
    public void setValuePaidAfterClose(BigDecimal valuePaidAfterClose) { this.valuePaidAfterClose = valuePaidAfterClose; }
    public BigDecimal getRefundAmount() { return refundAmount; }
    public void setRefundAmount(BigDecimal refundAmount) { this.refundAmount = refundAmount; }
    public BigDecimal getLossAmount() { return lossAmount; }
    public void setLossAmount(BigDecimal lossAmount) { this.lossAmount = lossAmount; }
}
