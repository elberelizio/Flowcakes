package com.Flow Cakes.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Cliente simples para envio de SMS via API externa (ex.: Mozesms).
 * Os detalhes de endpoint e credenciais são configurados em application.yml / variáveis de ambiente.
 */
@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.sms.base-url:https://api.mozesms.com}")
    private String baseUrl;

    /**
     * Token Bearer da API de SMS.
     * NUNCA colocar o valor directamente no código-fonte; use variáveis de ambiente.
     */
    @Value("${app.sms.bearer-token:}")
    private String bearerToken;

    /**
     * Caminho relativo para envio de SMS (exemplo: /sms/send).
     * Ajustar conforme a documentação oficial do fornecedor.
     */
    @Value("${app.sms.send-path:/sms/send}")
    private String sendPath;

    public void sendOtp(String phone, String code) {
        if (bearerToken == null || bearerToken.isBlank()) {
            log.warn("SMS não configurado — OTP para {} (apenas diagnóstico local): {}", phone, code);
            return;
        }
        String url = baseUrl + sendPath;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(bearerToken);

        Map<String, Object> body = new HashMap<>();
        // Estes campos ("to", "message") devem ser alinhados com a API real.
        body.put("to", phone);
        body.put("message", "Seu código de verificação Flow Cakes: " + code);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            restTemplate.postForEntity(url, entity, String.class);
        } catch (Exception ignored) {
            // Em produção: registar/logar o erro para diagnóstico.
        }
    }
}

