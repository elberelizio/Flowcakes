package com.chefcontrol.dto;

public class ApproveSimulatedPaymentRequest {

    /** Últimos dígitos (ou ID completo) da transação M-Pesa / e-Mola no SMS ou comprovativo. */
    private String operatorTransactionRef;

    public String getOperatorTransactionRef() {
        return operatorTransactionRef;
    }

    public void setOperatorTransactionRef(String operatorTransactionRef) {
        this.operatorTransactionRef = operatorTransactionRef;
    }
}
