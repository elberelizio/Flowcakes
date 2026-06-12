package com.chefcontrol.e2payments;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "e2payments")
public class E2PaymentsConfig {

    private boolean enabled = false;
    private String baseUrl = "https://e2payments.explicador.co.mz";
    private String clientId;
    private String clientSecret;
    private String walletId;
    /** Origin enviado à API (deve coincidir com um Redirect URL das credenciais). */
    private String redirectOrigin = "http://localhost:4200";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getBaseUrl() {
        return baseUrl != null ? baseUrl.replaceAll("/+$", "") : "https://e2payments.explicador.co.mz";
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public String getWalletId() {
        return walletId;
    }

    public void setWalletId(String walletId) {
        this.walletId = walletId;
    }

    public String getRedirectOrigin() {
        String raw = redirectOrigin != null && !redirectOrigin.isBlank()
            ? redirectOrigin.trim()
            : "http://localhost:4200";
        String normalized = E2PaymentsService.normalizeRedirectOrigin(raw);
        return normalized != null ? normalized : "http://localhost:4200";
    }

    public void setRedirectOrigin(String redirectOrigin) {
        this.redirectOrigin = redirectOrigin;
    }

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank()
            && clientSecret != null && !clientSecret.isBlank()
            && walletId != null && !walletId.isBlank();
    }
}
