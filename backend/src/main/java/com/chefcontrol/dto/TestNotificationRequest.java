package com.chefcontrol.dto;

import jakarta.validation.constraints.NotBlank;

public class TestNotificationRequest {

    @NotBlank(message = "O número de telefone é obrigatório")
    private String phone;

    private String message;

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
