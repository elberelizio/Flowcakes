package com.chefcontrol.exception;

/**
 * Senha incorrecta com tentativas restantes antes do bloqueio automático.
 */
public class InvalidPasswordException extends RuntimeException {

    private final int remainingAttempts;

    public InvalidPasswordException(String message, int remainingAttempts) {
        super(message);
        this.remainingAttempts = remainingAttempts;
    }

    public int getRemainingAttempts() {
        return remainingAttempts;
    }
}
