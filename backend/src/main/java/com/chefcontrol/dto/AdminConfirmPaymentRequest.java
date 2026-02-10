package com.chefcontrol.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

/**
 * Corpo do pedido para o admin confirmar pagamento de uma licença.
 * Obrigatório: ID da transacção e-Mola. Duração em meses (1 a 12).
 */
public class AdminConfirmPaymentRequest {

    @NotBlank(message = "ID da transacção e-Mola é obrigatório")
    private String eMolaTransactionId;

    @Min(1) @Max(12)
    private int durationMonths = 1;

    public String getEMolaTransactionId() { return eMolaTransactionId; }
    public void setEMolaTransactionId(String eMolaTransactionId) { this.eMolaTransactionId = eMolaTransactionId; }
    public int getDurationMonths() { return durationMonths; }
    public void setDurationMonths(int durationMonths) { this.durationMonths = durationMonths; }
}
