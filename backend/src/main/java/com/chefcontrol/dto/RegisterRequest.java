package com.chefcontrol.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "Telefone é obrigatório")
    @Size(max = 50)
    private String phone;

    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 4, max = 100)
    private String password;

    @NotBlank(message = "Nome completo é obrigatório")
    @Size(max = 200)
    private String fullName;

    @NotBlank(message = "Província é obrigatória")
    @Size(max = 100)
    private String province;

    @Size(max = 255)
    private String email;

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
