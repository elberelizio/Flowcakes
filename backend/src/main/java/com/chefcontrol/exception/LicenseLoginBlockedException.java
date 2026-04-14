package com.chefcontrol.exception;

import java.time.Instant;

/**
 * Credenciais válidas mas a licença não permite iniciar sessão (trial expirado, pendente, subscrição expirada).
 */
public class LicenseLoginBlockedException extends RuntimeException {

    private final String code;
    private final Instant validUntil;

    public LicenseLoginBlockedException(String code, String message, Instant validUntil) {
        super(message);
        this.code = code;
        this.validUntil = validUntil;
    }

    public String getCode() {
        return code;
    }

    public Instant getValidUntil() {
        return validUntil;
    }
}
