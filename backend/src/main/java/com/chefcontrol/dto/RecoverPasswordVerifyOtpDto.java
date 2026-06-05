package com.chefcontrol.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class RecoverPasswordVerifyOtpDto {

    @NotBlank(message = "Telefone é obrigatório")
    @Pattern(regexp = "^[0-9]{9}$", message = "Telefone deve ter 9 dígitos (Moçambique)")
    private String phone;

    @NotBlank(message = "Código OTP é obrigatório")
    @Pattern(regexp = "^[0-9]{6}$", message = "O código OTP deve ter 6 dígitos")
    private String otp;

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
}
