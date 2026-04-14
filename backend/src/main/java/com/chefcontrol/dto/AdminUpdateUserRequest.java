package com.chefcontrol.dto;

/**
 * Pedido para o admin actualizar dados do perfil de um utilizador.
 */
public class AdminUpdateUserRequest {

    private String fullName;
    private String phone;
    private String documentType;
    private String documentNumber;
    private String province;
    private String email;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }
    public String getDocumentNumber() { return documentNumber; }
    public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }
    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
