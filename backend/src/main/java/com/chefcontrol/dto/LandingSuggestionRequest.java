package com.chefcontrol.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LandingSuggestionRequest {

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 120, message = "Nome deve ter no máximo 120 caracteres")
    private String personName;

    @NotBlank(message = "Mensagem é obrigatória")
    @Size(max = 350, message = "Mensagem deve ter no máximo 350 caracteres")
    private String message;

    @NotBlank(message = "Identificador do dispositivo é obrigatório")
    @Size(max = 120, message = "Identificador do dispositivo inválido")
    private String deviceId;

    @Size(max = 500, message = "URL da página inválida")
    private String pageUrl;

    public String getPersonName() {
        return personName;
    }

    public void setPersonName(String personName) {
        this.personName = personName;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getPageUrl() {
        return pageUrl;
    }

    public void setPageUrl(String pageUrl) {
        this.pageUrl = pageUrl;
    }
}
