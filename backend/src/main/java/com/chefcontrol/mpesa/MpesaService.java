package com.chefcontrol.mpesa;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Serviço de integração com M-Pesa OpenAPI (sandbox e produção).
 * Gere sessões, inicia pagamentos C2B e processa callbacks.
 */
@Service
public class MpesaService {

    private static final Logger log = LoggerFactory.getLogger(MpesaService.class);

    private final MpesaConfig config;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private volatile String cachedSessionKey;
    private volatile Instant sessionExpiresAt;

    public MpesaService(MpesaConfig config) {
        this.config = config;
    }

    public boolean isAvailable() {
        return config.isConfigured();
    }

    /**
     * Obtém ou renova a Session Key a partir da API Key encriptada.
     * A sessão é cacheada durante 50 minutos (M-Pesa expira em ~60 min).
     */
    public synchronized String getSessionKey() {
        if (cachedSessionKey != null && sessionExpiresAt != null && Instant.now().isBefore(sessionExpiresAt)) {
            return cachedSessionKey;
        }

        String encryptedApiKey = MpesaCrypto.encrypt(config.getApiKey(), config.getPublicKey());
        String url = config.getBaseUrl() + "/getSession/";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + encryptedApiKey);
        headers.set("Origin", "*");

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            JsonNode body = objectMapper.readTree(response.getBody());

            String responseCode = body.path("output_ResponseCode").asText("");
            if (!"INS-0".equals(responseCode)) {
                String desc = body.path("output_ResponseDesc").asText("Erro desconhecido");
                log.error("M-Pesa getSession falhou: {} - {}", responseCode, desc);
                throw new MpesaException("Falha ao obter sessão M-Pesa: " + desc);
            }

            cachedSessionKey = body.path("output_SessionID").asText();
            sessionExpiresAt = Instant.now().plusSeconds(3000); // 50 minutos
            log.info("M-Pesa Session Key obtida com sucesso (expira em ~50 min)");
            return cachedSessionKey;
        } catch (MpesaException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao chamar M-Pesa getSession: {}", e.getMessage(), e);
            throw new MpesaException("Erro de comunicação com M-Pesa: " + e.getMessage(), e);
        }
    }

    /**
     * Inicia um pagamento C2B (Customer to Business).
     * O M-Pesa envia USSD push ao telemóvel do cliente.
     *
     * @param customerPhone  Número do cliente (ex: 258841234567)
     * @param amount         Valor em MZN
     * @param reference      Referência interna (ex: userId ou licenseId)
     * @param description    Descrição do pagamento
     * @return conversationId e transactionId do M-Pesa
     */
    public C2BResult initiateC2BPayment(String customerPhone, BigDecimal amount, String reference, String description) {
        String sessionKey = getSessionKey();
        String encryptedSessionKey = MpesaCrypto.encrypt(sessionKey, config.getPublicKey());
        String url = config.getBaseUrl() + "/c2bPayment/singleStage/";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + encryptedSessionKey);
        headers.set("Origin", "*");

        String thirdPartyId = "CHEF-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();

        Map<String, String> body = new LinkedHashMap<>();
        body.put("input_TransactionReference", reference);
        body.put("input_CustomerMSISDN", normalizePhone(customerPhone));
        body.put("input_Amount", amount.toPlainString());
        body.put("input_ThirdPartyConversationID", thirdPartyId);
        body.put("input_ServiceProviderCode", config.getServiceProviderCode());
        body.put("input_PurchasedItemsDesc", description);
        body.put("input_Country", "MOZ");
        body.put("input_Currency", "MZN");

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            JsonNode json = objectMapper.readTree(response.getBody());

            String responseCode = json.path("output_ResponseCode").asText("");
            String responseDesc = json.path("output_ResponseDesc").asText("");
            String conversationId = json.path("output_ConversationID").asText("");
            String transactionId = json.path("output_TransactionID").asText("");

            log.info("M-Pesa C2B resposta: code={} desc={} conversationId={} txId={}",
                    responseCode, responseDesc, conversationId, transactionId);

            if (!"INS-0".equals(responseCode)) {
                log.warn("M-Pesa C2B falhou: {} - {}", responseCode, responseDesc);
                throw new MpesaException("Pagamento M-Pesa falhou: " + responseDesc + " (" + responseCode + ")");
            }

            C2BResult result = new C2BResult();
            result.setConversationId(conversationId);
            result.setTransactionId(transactionId);
            result.setThirdPartyId(thirdPartyId);
            result.setResponseCode(responseCode);
            result.setResponseDesc(responseDesc);
            result.setSuccess(true);
            return result;
        } catch (MpesaException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao chamar M-Pesa C2B: {}", e.getMessage(), e);
            throw new MpesaException("Erro de comunicação com M-Pesa: " + e.getMessage(), e);
        }
    }

    /**
     * Normaliza o número de telefone para formato internacional (258XXXXXXXXX).
     */
    private String normalizePhone(String phone) {
        if (phone == null) return "";
        String clean = phone.replaceAll("[^0-9]", "");
        if (clean.startsWith("258")) return clean;
        if (clean.startsWith("0")) clean = clean.substring(1);
        if (clean.length() == 9) return "258" + clean;
        return clean;
    }

    /** Invalida a sessão cacheada (ex: após erro 401). */
    public synchronized void invalidateSession() {
        cachedSessionKey = null;
        sessionExpiresAt = null;
    }

    /**
     * Resultado de um pedido C2B.
     */
    public static class C2BResult {
        private String conversationId;
        private String transactionId;
        private String thirdPartyId;
        private String responseCode;
        private String responseDesc;
        private boolean success;

        public String getConversationId() { return conversationId; }
        public void setConversationId(String conversationId) { this.conversationId = conversationId; }
        public String getTransactionId() { return transactionId; }
        public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
        public String getThirdPartyId() { return thirdPartyId; }
        public void setThirdPartyId(String thirdPartyId) { this.thirdPartyId = thirdPartyId; }
        public String getResponseCode() { return responseCode; }
        public void setResponseCode(String responseCode) { this.responseCode = responseCode; }
        public String getResponseDesc() { return responseDesc; }
        public void setResponseDesc(String responseDesc) { this.responseDesc = responseDesc; }
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
    }
}
