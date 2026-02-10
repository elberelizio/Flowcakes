package com.chefcontrol.dto;

import java.util.UUID;

public class RegisterResponse {

    private UserResponse user;
    private boolean messageSent;
    private String message = "Sua conta foi criada com sucesso! Enviámos uma mensagem de confirmação para o seu WhatsApp/SMS.";

    public static RegisterResponse of(UserResponse user, boolean messageSent) {
        RegisterResponse r = new RegisterResponse();
        r.setUser(user);
        r.setMessageSent(messageSent);
        return r;
    }

    public UserResponse getUser() { return user; }
    public void setUser(UserResponse user) { this.user = user; }
    public boolean isMessageSent() { return messageSent; }
    public void setMessageSent(boolean messageSent) { this.messageSent = messageSent; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
