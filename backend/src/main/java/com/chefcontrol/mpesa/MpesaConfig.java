package com.chefcontrol.mpesa;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "mpesa")
public class MpesaConfig {

    private String apiKey;
    private String publicKey;
    private String environment = "sandbox";
    private String market = "vodacomMOZ";
    private String serviceProviderCode = "171717";
    private String callbackBaseUrl = "http://localhost:8080";

    public String getBaseUrl() {
        String env = "openapi".equalsIgnoreCase(environment) ? "openapi" : "sandbox";
        return "https://openapi.m-pesa.com/" + env + "/ipg/v2/" + market;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getPublicKey() { return publicKey; }
    public void setPublicKey(String publicKey) { this.publicKey = publicKey; }
    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }
    public String getMarket() { return market; }
    public void setMarket(String market) { this.market = market; }
    public String getServiceProviderCode() { return serviceProviderCode; }
    public void setServiceProviderCode(String serviceProviderCode) { this.serviceProviderCode = serviceProviderCode; }
    public String getCallbackBaseUrl() { return callbackBaseUrl; }
    public void setCallbackBaseUrl(String callbackBaseUrl) { this.callbackBaseUrl = callbackBaseUrl; }
}
