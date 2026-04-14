package com.chefcontrol.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

/**
 * Corpo do pedido para o admin confirmar pagamento de uma licença.
 * ID e-Mola: exatamente 18 caracteres alfanuméricos (letras e números). Duração em meses (1 a 12).
 * A validação do formato é feita no LicenseService para mensagens mais claras.
 */
public class AdminConfirmPaymentRequest {

    @JsonProperty("eMolaTransactionId")
    @NotBlank(message = "ID da transacção e-Mola é obrigatório")
    private String transactionId;

    @Min(1) @Max(12)
    private int durationMonths = 1;

    public String getEMolaTransactionId() { return transactionId; }
    @JsonSetter("eMolaTransactionId")
    public void setEMolaTransactionId(String v) {
        this.transactionId = v != null ? v.trim() : null;
    }
    public int getDurationMonths() { return durationMonths; }
    public void setDurationMonths(int durationMonths) { this.durationMonths = durationMonths; }
}
