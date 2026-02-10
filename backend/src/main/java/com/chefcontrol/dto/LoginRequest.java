package com.chefcontrol.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    @NotBlank(message = "Telefone é obrigatório")
    private String phone;

    @NotBlank(message = "Senha é obrigatória")
    private String password;

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
