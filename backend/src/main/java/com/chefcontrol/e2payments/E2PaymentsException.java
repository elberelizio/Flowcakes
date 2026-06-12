package com.chefcontrol.e2payments;

public class E2PaymentsException extends RuntimeException {

    public E2PaymentsException(String message) {
        super(message);
    }

    public E2PaymentsException(String message, Throwable cause) {
        super(message, cause);
    }
}
