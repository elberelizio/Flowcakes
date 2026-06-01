package com.chefcontrol.dto;

import jakarta.validation.constraints.NotBlank;

public class ChangePhoneRequest {

    @NotBlank
    private String currentPassword;

    @NotBlank
    private String newPhone;

    public String getCurrentPassword() { return currentPassword; }
    public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
    public String getNewPhone() { return newPhone; }
    public void setNewPhone(String newPhone) { this.newPhone = newPhone; }
}
