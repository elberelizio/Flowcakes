package com.chefcontrol.dto;

public class RecoverPasswordVerifyOtpResponse {

    private String message;
    private String resetToken;
    private int resetTokenExpiresInSeconds;

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }

    public int getResetTokenExpiresInSeconds() { return resetTokenExpiresInSeconds; }
    public void setResetTokenExpiresInSeconds(int resetTokenExpiresInSeconds) {
        this.resetTokenExpiresInSeconds = resetTokenExpiresInSeconds;
    }
}
