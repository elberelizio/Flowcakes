package com.chefcontrol.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ContactMessageRequest {

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 120, message = "Nome deve ter no máximo 120 caracteres")
    private String fullName;

    @Email(message = "E-mail inválido")
    @Size(max = 200, message = "E-mail deve ter no máximo 200 caracteres")
    private String email;

    @Size(max = 30, message = "Telefone deve ter no máximo 30 caracteres")
    private String phone;

    @NotBlank(message = "Mensagem é obrigatória")
    @Size(min = 15, max = 4000, message = "Mensagem deve ter entre 15 e 4000 caracteres")
    private String message;

    @Size(max = 500, message = "URL da página inválida")
    private String pageUrl;

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPageUrl() {
        return pageUrl;
    }

    public void setPageUrl(String pageUrl) {
        this.pageUrl = pageUrl;
    }
}
