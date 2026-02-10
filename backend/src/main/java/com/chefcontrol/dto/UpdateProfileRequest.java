package com.chefcontrol.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * Dados editáveis do perfil do utilizador (nome, documento, província, email).
 * O contacto (telefone) não é editável aqui por ser o identificador de login.
 */
public class UpdateProfileRequest {

    @Size(max = 200)
    private String fullName;

    @Size(max = 10)
    private String documentType; // "bi" | "nuit"

    @Size(max = 50)
    private String documentNumber;

    @Size(max = 100)
    private String province;

    @Email
    @Size(max = 255)
    private String email;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }
    public String getDocumentNumber() { return documentNumber; }
    public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }
    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
