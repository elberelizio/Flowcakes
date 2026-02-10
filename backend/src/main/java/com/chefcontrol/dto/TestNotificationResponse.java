package com.chefcontrol.dto;

/**
 * Resultado do teste de envio de SMS e WhatsApp.
 * messagePreview: texto que seria/enviado (para copiar e enviar manualmente se não configurado).
 */
public class TestNotificationResponse {

    private boolean smsSent;
    private boolean whatsappSent;
    private String smsError;
    private String whatsappError;
    private String messagePreview;

    public static TestNotificationResponse of(boolean smsSent, boolean whatsappSent, String smsError, String whatsappError) {
        return of(smsSent, whatsappSent, smsError, whatsappError, null);
    }

    public static TestNotificationResponse of(boolean smsSent, boolean whatsappSent, String smsError, String whatsappError, String messagePreview) {
        TestNotificationResponse r = new TestNotificationResponse();
        r.setSmsSent(smsSent);
        r.setWhatsappSent(whatsappSent);
        r.setSmsError(smsError);
        r.setWhatsappError(whatsappError);
        r.setMessagePreview(messagePreview);
        return r;
    }

    public boolean isSmsSent() { return smsSent; }
    public void setSmsSent(boolean smsSent) { this.smsSent = smsSent; }
    public boolean isWhatsappSent() { return whatsappSent; }
    public void setWhatsappSent(boolean whatsappSent) { this.whatsappSent = whatsappSent; }
    public String getSmsError() { return smsError; }
    public void setSmsError(String smsError) { this.smsError = smsError; }
    public String getWhatsappError() { return whatsappError; }
    public void setWhatsappError(String whatsappError) { this.whatsappError = whatsappError; }
    public String getMessagePreview() { return messagePreview; }
    public void setMessagePreview(String messagePreview) { this.messagePreview = messagePreview; }
}
