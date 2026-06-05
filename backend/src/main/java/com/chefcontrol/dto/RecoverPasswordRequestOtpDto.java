package com.chefcontrol.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RecoverPasswordRequestOtpDto {

    @NotBlank(message = "Telefone é obrigatório")
    @Pattern(regexp = "^[0-9]{9}$", message = "Telefone deve ter 9 dígitos (Moçambique)")
    private String phone;

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
