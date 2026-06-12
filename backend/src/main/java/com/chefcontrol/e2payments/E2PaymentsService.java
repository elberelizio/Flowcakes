package com.chefcontrol.e2payments;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Integração com a API e2Payments (OAuth + C2B M-Pesa + histórico).
 */
@Service
public class E2PaymentsService {

    private static final Logger log = LoggerFactory.getLogger(E2PaymentsService.class);

    private final E2PaymentsConfig config;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private volatile String cachedAccessToken;
    private volatile Instant tokenExpiresAt;

    private static final ThreadLocal<String> REQUEST_ORIGIN = new ThreadLocal<>();

    public E2PaymentsService(E2PaymentsConfig config, @Qualifier("e2PaymentsRestTemplate") RestTemplate e2PaymentsRestTemplate) {
        this.config = config;
        this.restTemplate = e2PaymentsRestTemplate;
    }

    public boolean isAvailable() {
        return config.isEnabled() && config.isConfigured();
    }

    /** Origin do browser (ex.: http://localhost:4200) para validação de Redirect URL. */
    public void bindRequestOrigin(String origin) {
        String normalized = normalizeRedirectOrigin(origin);
        if (normalized != null) {
            REQUEST_ORIGIN.set(normalized);
        }
    }

    public void clearRequestOrigin() {
        REQUEST_ORIGIN.remove();
    }

    public synchronized String getAccessToken() {
        if (cachedAccessToken != null && tokenExpiresAt != null && Instant.now().isBefore(tokenExpiresAt)) {
            return cachedAccessToken;
        }

        String url = config.getBaseUrl() + "/oauth/token";
        Map<String, String> body = new LinkedHashMap<>();
        body.put("grant_type", "client_credentials");
        body.put("client_id", config.getClientId());
        body.put("client_secret", config.getClientSecret());

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, apiHeaders(null));

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            JsonNode json = objectMapper.readTree(response.getBody());
            String token = json.path("access_token").asText("");
            if (token.isBlank()) {
                throw new E2PaymentsException("Resposta OAuth sem access_token");
            }
            long expiresIn = json.path("expires_in").asLong(3600);
            cachedAccessToken = token;
            tokenExpiresAt = Instant.now().plusSeconds(Math.max(60, expiresIn - 120));
            log.info("e2Payments: token OAuth obtido (expira em ~{} s)", expiresIn);
            return cachedAccessToken;
        } catch (E2PaymentsException e) {
            throw e;
        } catch (ResourceAccessException e) {
            String hint = connectionHint(e);
            log.error("e2Payments OAuth rede/DNS: {} — {}", e.getMessage(), hint, e);
            throw new E2PaymentsException("Sem ligação ao servidor e2Payments. " + hint, e);
        } catch (Exception e) {
            log.error("e2Payments OAuth falhou: {}", e.getMessage(), e);
            throw new E2PaymentsException("Falha ao obter token e2Payments: " + rootMessage(e), e);
        }
    }

    /** Testa ligação OAuth (útil para /available). */
    public boolean testConnection() {
        try {
            getAccessToken();
            return true;
        } catch (Exception e) {
            log.warn("e2Payments testConnection falhou: {}", rootMessage(e));
            return false;
        }
    }

    private static String connectionHint(ResourceAccessException e) {
        Throwable root = rootCause(e);
        String name = root != null ? root.getClass().getSimpleName() : "";
        if (name.contains("UnknownHost")) {
            return "Não foi possível resolver e2payments.explicador.co.mz (DNS/rede). Verifique internet e reinicie o backend.";
        }
        if (name.contains("ConnectException") || name.contains("Connection refused")) {
            return "Servidor inacessível. Tente mais tarde ou verifique firewall/VPN.";
        }
        if (name.contains("SocketTimeout")) {
            return "Tempo de ligação esgotado. Verifique a rede e tente novamente.";
        }
        return "Verifique ligação à internet e reinicie o backend (iniciar-backend.bat).";
    }

    private static Throwable rootCause(Throwable e) {
        Throwable cur = e;
        while (cur != null && cur.getCause() != null && cur.getCause() != cur) {
            cur = cur.getCause();
        }
        return cur;
    }

    private static String rootMessage(Throwable e) {
        Throwable root = rootCause(e);
        if (root != null && root.getMessage() != null && !root.getMessage().isBlank()) {
            return root.getMessage();
        }
        return e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
    }

    /**
     * Inicia pagamento C2B M-Pesa. O cliente recebe popup USSD no telemóvel indicado.
     */
    public C2BResult initiateC2BPayment(String customerPhone, BigDecimal amount, String reference) {
        String token = getAccessToken();
        String url = config.getBaseUrl() + "/v1/c2b/mpesa-payment/" + config.getWalletId();

        Map<String, String> body = new LinkedHashMap<>();
        body.put("client_id", config.getClientId());
        body.put("amount", amount.stripTrailingZeros().toPlainString());
        body.put("phone", normalizePhone9(customerPhone));
        body.put("reference", sanitizeReference(reference));

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, apiHeaders(token));

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            JsonNode json = objectMapper.readTree(response.getBody());
            log.info("e2Payments C2B resposta (Origin={}): {}", effectiveOrigin(), response.getBody());

            C2BResult result = new C2BResult();
            result.setReference(body.get("reference"));
            result.setRawResponse(json);
            result.setSuccess(true);
            result.setMessage(extractMessage(json, "Pedido enviado. Confirme o pagamento no telemóvel."));
            return result;
        } catch (HttpStatusCodeException e) {
            String msg = parseApiError(e);
            log.warn("e2Payments C2B HTTP {}: {}", e.getStatusCode(), msg);
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                invalidateToken();
            }
            throw new E2PaymentsException("Pagamento e2Payments falhou: " + msg);
        } catch (E2PaymentsException e) {
            throw e;
        } catch (Exception e) {
            log.error("e2Payments C2B erro: {}", e.getMessage(), e);
            throw new E2PaymentsException("Erro de comunicação com e2Payments: " + e.getMessage(), e);
        }
    }

    /**
     * Procura pagamento confirmado no histórico e2Payments pela referência (sem espaços).
     */
    public Optional<HistoryMatch> findCompletedPayment(String reference, BigDecimal expectedAmount) {
        String ref = sanitizeReference(reference);
        if (ref.isBlank()) {
            return Optional.empty();
        }

        String token = getAccessToken();
        String url = config.getBaseUrl() + "/v1/payments/mpesa/get/all/paginate/30";
        Map<String, String> body = Map.of("client_id", config.getClientId());
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, apiHeaders(token));

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode payments = resolvePaymentsArray(root);
            if (payments == null || !payments.isArray()) {
                return Optional.empty();
            }

            for (JsonNode p : payments) {
                String pRef = firstNonBlank(
                    p.path("reference").asText(""),
                    p.path("Reference").asText(""),
                    p.path("transaction_reference").asText("")
                );
                if (!ref.equalsIgnoreCase(sanitizeReference(pRef))) {
                    continue;
                }
                if (expectedAmount != null && !amountMatches(p, expectedAmount)) {
                    continue;
                }
                HistoryMatch match = new HistoryMatch();
                match.setReference(ref);
                match.setTransactionId(firstNonBlank(
                    p.path("transaction_id").asText(""),
                    p.path("transactionId").asText(""),
                    p.path("id").asText(""),
                    p.path("payment_id").asText("")
                ));
                match.setAmount(extractAmount(p));
                match.setRaw(p);
                return Optional.of(match);
            }
            return Optional.empty();
        } catch (HttpStatusCodeException e) {
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                invalidateToken();
            }
            log.warn("e2Payments histórico HTTP {}: {}", e.getStatusCode(), parseApiError(e));
            return Optional.empty();
        } catch (Exception e) {
            log.warn("e2Payments histórico falhou: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public static String buildReference(UUID userId) {
        String userPart = userId.toString().replace("-", "").substring(0, 4).toUpperCase();
        String randPart = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "LIC" + userPart + randPart;
    }

    public static String toLicenseTransactionId(UUID paymentId) {
        String raw = paymentId.toString().replace("-", "").toUpperCase();
        return ("E2" + raw).substring(0, 18);
    }

    public synchronized void invalidateToken() {
        cachedAccessToken = null;
        tokenExpiresAt = null;
    }

    private HttpHeaders apiHeaders(String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        if (bearerToken != null && !bearerToken.isBlank()) {
            headers.setBearerAuth(bearerToken);
        }
        headers.setAccept(MediaType.parseMediaTypes("application/json"));
        headers.setContentType(MediaType.APPLICATION_JSON);
        String origin = effectiveOrigin();
        headers.set("Origin", origin);
        // e2Payments compara exactamente com Redirect URL (sem barra final).
        headers.set("Referer", origin);
        return headers;
    }

    private String effectiveOrigin() {
        String fromRequest = REQUEST_ORIGIN.get();
        if (fromRequest != null && !fromRequest.isBlank()) {
            return normalizeRedirectOrigin(fromRequest);
        }
        return normalizeRedirectOrigin(config.getRedirectOrigin());
    }

    /** Remove barra final — credenciais e2Payments usam http://host:port sem /. */
    static String normalizeRedirectOrigin(String raw) {
        if (raw == null) {
            return null;
        }
        String s = raw.trim();
        while (s.endsWith("/")) {
            s = s.substring(0, s.length() - 1);
        }
        return s.isEmpty() ? null : s;
    }

    private static String normalizePhone9(String phone) {
        if (phone == null) return "";
        String d = phone.replaceAll("\\D", "");
        if (d.startsWith("258") && d.length() > 3) {
            d = d.substring(3);
        }
        if (d.length() > 9) {
            d = d.substring(0, 9);
        }
        return d;
    }

    /** Referência M-Pesa: sem espaços. */
    public static String sanitizeReference(String reference) {
        if (reference == null) return "";
        return reference.replaceAll("\\s+", "").trim();
    }

    private static JsonNode resolvePaymentsArray(JsonNode root) {
        if (root == null) return null;
        if (root.isArray()) return root;
        for (String key : new String[] {"data", "payments", "items", "results"}) {
            JsonNode node = root.path(key);
            if (node.isArray()) return node;
        }
        return null;
    }

    private static boolean amountMatches(JsonNode p, BigDecimal expected) {
        BigDecimal found = extractAmount(p);
        if (found == null) return true;
        return found.compareTo(expected) == 0;
    }

    private static BigDecimal extractAmount(JsonNode p) {
        for (String key : new String[] {"amount", "Amount", "value", "paid_amount"}) {
            JsonNode n = p.path(key);
            if (!n.isMissingNode() && !n.isNull()) {
                try {
                    if (n.isNumber()) return n.decimalValue();
                    String s = n.asText("").trim();
                    if (!s.isBlank()) return new BigDecimal(s);
                } catch (NumberFormatException ignored) {}
            }
        }
        return null;
    }

    private static String extractMessage(JsonNode json, String fallback) {
        for (String key : new String[] {"message", "msg", "description", "status"}) {
            String v = json.path(key).asText("").trim();
            if (!v.isBlank()) return v;
        }
        return fallback;
    }

    private String parseApiError(HttpStatusCodeException e) {
        try {
            JsonNode json = objectMapper.readTree(e.getResponseBodyAsString());
            String msg = extractMessage(json, e.getResponseBodyAsString());
            return msg != null && !msg.isBlank() ? msg : e.getStatusText();
        } catch (Exception ignored) {
            String body = e.getResponseBodyAsString();
            return body != null && !body.isBlank() ? body : e.getMessage();
        }
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v.trim();
        }
        return "";
    }

    public static class C2BResult {
        private String reference;
        private String message;
        private boolean success;
        private JsonNode rawResponse;

        public String getReference() { return reference; }
        public void setReference(String reference) { this.reference = reference; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public JsonNode getRawResponse() { return rawResponse; }
        public void setRawResponse(JsonNode rawResponse) { this.rawResponse = rawResponse; }
    }

    public static class HistoryMatch {
        private String reference;
        private String transactionId;
        private BigDecimal amount;
        private JsonNode raw;

        public String getReference() { return reference; }
        public void setReference(String reference) { this.reference = reference; }
        public String getTransactionId() { return transactionId; }
        public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public JsonNode getRaw() { return raw; }
        public void setRaw(JsonNode raw) { this.raw = raw; }
    }

}
