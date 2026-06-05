package com.chefcontrol.dto;

public class RecoverPasswordRequestOtpResponse {

    private String message;
    private String phone;
    /** Modo simulação: OTP visível no ecrã (não enviado por SMS real). */
    private String simulationOtp;
    private int expiresInSeconds;

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSimulationOtp() { return simulationOtp; }
    public void setSimulationOtp(String simulationOtp) { this.simulationOtp = simulationOtp; }

    public int getExpiresInSeconds() { return expiresInSeconds; }
    public void setExpiresInSeconds(int expiresInSeconds) { this.expiresInSeconds = expiresInSeconds; }
}
