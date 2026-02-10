package com.chefcontrol.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

/**
 * Envia mensagens por SMS (operador nacional) e WhatsApp via Twilio.
 * Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER (SMS) e opcionalmente
 * TWILIO_WHATSAPP_FROM para WhatsApp (ex.: número sandbox whatsapp:+14155238886).
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final String TWILIO_MESSAGES_URL = "https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json";

    @Value("${app.twilio-account-sid:}")
    private String twilioAccountSid;

    @Value("${app.twilio-auth-token:}")
    private String twilioAuthToken;

    @Value("${app.twilio-from-number:}")
    private String twilioFromNumber;

    /** Número Twilio para WhatsApp (ex.: whatsapp:+14155238886 para sandbox). Se vazio, não envia WhatsApp. */
    @Value("${app.twilio-whatsapp-from:}")
    private String twilioWhatsappFrom;

    private final RestTemplate restTemplate = new RestTemplate();

    /** Número do admin (e-Mola) para notificar novas contas e receber pagamentos */
    @Value("${app.e-mola-phone:871964887}")
    private String adminPhone;

    /**
     * Envia ao utilizador: confirmação de conta criada e lembreta de credenciais (telefone + senha que definiu).
     * Envia ao admin (871964887): aviso de nova conta e credenciais de acesso.
     */
    public boolean sendAccountCreatedConfirmation(String phone, String fullName) {
        String messageToUser = buildAccountCreatedMessageToUser(fullName, phone);
        String messageToAdmin = buildNewAccountMessageToAdmin(phone, fullName);
        boolean userOk = true;
        boolean adminOk = true;
        if (isTwilioConfigured()) {
            userOk = sendSms(normalizePhone(phone), messageToUser);
            adminOk = sendSms(normalizePhone(adminPhone), messageToAdmin);
        } else {
            log.warn("SMS não configurado. Defina app.twilio-account-sid, app.twilio-auth-token e app.twilio-from-number para enviar confirmação ao utilizador e aviso ao admin ({}).", adminPhone);
            log.info("Mensagem que seria enviada ao utilizador {}: {}", phone, messageToUser);
            log.info("Mensagem que seria enviada ao admin: {}", messageToAdmin);
        }
        return userOk && adminOk;
    }

    private String buildAccountCreatedMessageToUser(String fullName, String phone) {
        String nome = (fullName != null && !fullName.isBlank()) ? fullName : "Utilizador";
        return String.format(
            "Chef Control: Olá %s! A sua conta foi criada com sucesso. Os seus dados de acesso: use o número %s e a senha que definiu. Para activar a conta, efectue 500 MZN para o número 871964887 (e-Mola). Obrigado!",
            nome.trim(), phone
        );
    }

    private String buildNewAccountMessageToAdmin(String phone, String fullName) {
        String nome = (fullName != null && !fullName.isBlank()) ? fullName : "-";
        return String.format(
            "Chef Control: Nova conta criada. Nome: %s. Telefone (login): %s. Credenciais de acesso: número %s e a senha que o cliente definiu. Peça ao cliente para pagar 500 MZN para este número (e-Mola) para activar.",
            nome, phone, phone
        );
    }

    private boolean isTwilioConfigured() {
        return twilioAccountSid != null && !twilioAccountSid.isBlank()
            && twilioAuthToken != null && !twilioAuthToken.isBlank()
            && twilioFromNumber != null && !twilioFromNumber.isBlank();
    }

    private String normalizePhone(String phone) {
        if (phone == null) return "";
        String p = phone.replaceAll("\\s", "");
        if (!p.startsWith("+")) {
            if (p.startsWith("87") && p.length() >= 9) p = "+258" + p.substring(2);
            else if (p.startsWith("258")) p = "+" + p;
            else if (p.length() == 9) p = "+258" + p;
            else p = "+258" + p;
        }
        return p;
    }

    /**
     * Envio de teste: SMS e WhatsApp com mensagem livre (para verificar se o serviço está a funcionar).
     * Retorna o resultado de cada canal.
     */
    public com.chefcontrol.dto.TestNotificationResponse sendTestMessage(String phone, String messageBody) {
        String body = (messageBody != null && !messageBody.isBlank()) ? messageBody.trim() : "Mensagem teste - Chef Control";
        String to = normalizePhone(phone);
        if (to.isEmpty()) {
            return com.chefcontrol.dto.TestNotificationResponse.of(false, false, "Número inválido", null);
        }
        boolean smsOk = false;
        String smsErr = null;
        if (isTwilioConfigured()) {
            smsOk = sendSms(to, body);
            if (!smsOk) smsErr = "Falha ao enviar SMS (verifique Twilio e número de origem).";
        } else {
            smsErr = "SMS não configurado (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER).";
        }
        boolean waOk = false;
        String waErr = null;
        if (isWhatsAppConfigured()) {
            waOk = sendWhatsApp(to, body);
            if (!waOk) waErr = "Falha ao enviar WhatsApp (verifique TWILIO_WHATSAPP_FROM e sandbox).";
        } else {
            waErr = "WhatsApp não configurado (TWILIO_WHATSAPP_FROM).";
        }
        return com.chefcontrol.dto.TestNotificationResponse.of(smsOk, waOk, smsErr, waErr, body);
    }

    /**
     * Envia o código da licença ao utilizador: SMS (operador nacional) e, se configurado, WhatsApp.
     * Chamado após o admin confirmar o pagamento.
     */
    public void sendLicenseCodeToUser(String userPhone, String licenseCode) {
        if (licenseCode == null || licenseCode.isBlank()) return;
        String phone = normalizePhone(userPhone);
        if (phone.isEmpty()) return;
        String message = String.format(
            "Chef Control: O seu código de licença é %s. Introduza na aplicação para activar a conta. Obrigado!",
            licenseCode.trim().toUpperCase()
        );
        if (isTwilioConfigured()) {
            boolean smsOk = sendSms(phone, message);
            if (smsOk) {
                log.info("SMS com código de licença enviado para {}", phone);
            } else {
                log.warn("Falha ao enviar SMS com código de licença para {}", phone);
            }
        } else {
            log.info("SMS não configurado. Código de licença que seria enviado a {}: {}", phone, licenseCode);
        }
        if (isWhatsAppConfigured()) {
            boolean waOk = sendWhatsApp(phone, message);
            if (waOk) {
                log.info("WhatsApp com código de licença enviado para {}", phone);
            } else {
                log.warn("Falha ao enviar WhatsApp com código de licença para {}", phone);
            }
        } else {
            log.debug("WhatsApp não configurado (app.twilio-whatsapp-from). Código seria: {}", licenseCode);
        }
    }

    private boolean isWhatsAppConfigured() {
        return isTwilioConfigured()
            && twilioWhatsappFrom != null
            && !twilioWhatsappFrom.isBlank()
            && (twilioWhatsappFrom.startsWith("whatsapp:") || twilioWhatsappFrom.startsWith("+"));
    }

    private String whatsappFrom() {
        if (twilioWhatsappFrom == null || twilioWhatsappFrom.isBlank()) return null;
        return twilioWhatsappFrom.startsWith("whatsapp:") ? twilioWhatsappFrom : "whatsapp:" + twilioWhatsappFrom.trim();
    }

    /** SMS para número E.164 (ex.: +258871234567) – entrega via operador nacional. */
    private boolean sendSms(String toE164, String body) {
        return sendTwilioMessage(toE164, twilioFromNumber, body, "SMS");
    }

    /** WhatsApp: From e To com prefixo whatsapp: (mesma API Twilio). */
    private boolean sendWhatsApp(String toE164, String body) {
        String from = whatsappFrom();
        if (from == null) return false;
        String to = toE164.startsWith("whatsapp:") ? toE164 : "whatsapp:" + toE164;
        return sendTwilioMessage(to, from, body, "WhatsApp");
    }

    private boolean sendTwilioMessage(String to, String from, String body, String channelLabel) {
        try {
            String url = String.format(TWILIO_MESSAGES_URL, twilioAccountSid);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBasicAuth(twilioAccountSid, twilioAuthToken);

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("To", to);
            params.add("From", from);
            params.add("Body", body);

            ResponseEntity<String> res = restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(params, headers), String.class);
            if (res.getStatusCode().is2xxSuccessful()) {
                log.info("{} enviado para {}", channelLabel, to);
                return true;
            }
            log.warn("Twilio {} respondeu com {}: {}", channelLabel, res.getStatusCode(), res.getBody());
            return false;
        } catch (Exception e) {
            log.error("Erro ao enviar {} via Twilio: {}", channelLabel, e.getMessage());
            return false;
        }
    }
}
