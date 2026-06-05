package com.chefcontrol.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RecoverPasswordResetDto {

    @NotBlank(message = "Telefone é obrigatório")
    @Pattern(regexp = "^[0-9]{9}$", message = "Telefone deve ter 9 dígitos (Moçambique)")
    private String phone;

    @NotBlank(message = "Token de recuperação é obrigatório")
    private String resetToken;

    @NotBlank(message = "Nova senha é obrigatória")
    @Size(min = 4, message = "A senha deve ter pelo menos 4 caracteres")
    private String newPassword;

    @NotBlank(message = "Confirmação de senha é obrigatória")
    private String confirmPassword;

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }

    public String getConfirmPassword() { return confirmPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
}
