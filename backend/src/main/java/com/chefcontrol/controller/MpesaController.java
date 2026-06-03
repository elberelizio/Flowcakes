package com.chefcontrol.controller;

import com.chefcontrol.config.CurrentUserId;
import com.chefcontrol.config.PaymentSimulationProperties;
import com.chefcontrol.entity.MpesaPaymentEntity;
import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.mpesa.MpesaConfig;
import com.chefcontrol.mpesa.MpesaException;
import com.chefcontrol.mpesa.MpesaService;
import com.chefcontrol.repository.MpesaPaymentRepository;
import com.chefcontrol.repository.UserRepository;
import com.chefcontrol.service.AuthService;
import com.chefcontrol.service.LicenseService;
import com.chefcontrol.service.SystemNotificationService;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/mpesa")
public class MpesaController {

    private static final Logger log = LoggerFactory.getLogger(MpesaController.class);

    private final MpesaService mpesaService;
    private final MpesaConfig mpesaConfig;
    private final MpesaPaymentRepository paymentRepo;
    private final LicenseService licenseService;
    private final UserRepository userRepository;
    private final PaymentSimulationProperties paymentSimulation;
    private final SystemNotificationService systemNotificationService;

    public MpesaController(MpesaService mpesaService, MpesaConfig mpesaConfig,
                           MpesaPaymentRepository paymentRepo, LicenseService licenseService,
                           UserRepository userRepository,
                           PaymentSimulationProperties paymentSimulation,
                           SystemNotificationService systemNotificationService) {
        this.mpesaService = mpesaService;
        this.mpesaConfig = mpesaConfig;
        this.paymentRepo = paymentRepo;
        this.licenseService = licenseService;
        this.userRepository = userRepository;
        this.paymentSimulation = paymentSimulation;
        this.systemNotificationService = systemNotificationService;
    }

    /** Verifica se a integração M-Pesa está disponível. */
    @GetMapping("/available")
    public ResponseEntity<Map<String, Object>> available() {
        try {
            Map<String, Object> r = new LinkedHashMap<>();
            boolean configured = mpesaConfig.isConfigured();
            String env = mpesaConfig.getEnvironment();
            r.put("environment", env != null ? env : "sandbox");
            r.put("configured", configured);
            if (paymentSimulation.isEnabled()) {
                r.put("available", true);
                r.put("simulated", true);
                r.put("manualTransfer", true);
                r.put("mpesaDestinationPhone", licenseService.getMpesaPhone());
                r.put("emolaDestinationPhone", licenseService.getEMolaPhone());
                r.put("supportWhatsapp", licenseService.getSupportWhatsapp());
                r.put("licenseAmountMzn", licenseService.getLicenseAmount());
                r.put("hint", "Transfira o valor para o número indicado (M-Pesa ou e-Mola) e confirme no formulário. O administrador valida o pagamento.");
                return ResponseEntity.ok(r);
            }
            r.put("simulated", false);
            r.put("available", mpesaService.isAvailable());
            if (!mpesaService.isAvailable()) {
                r.put("hint", "Pagamento indisponível. Contacte o administrador.");
            }
            return ResponseEntity.ok(r);
        } catch (Exception e) {
            log.warn("mpesa/available falhou: {}", e.getMessage());
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("available", false);
            r.put("configured", false);
            r.put("simulated", false);
            r.put("environment", "unknown");
            r.put("hint", "Não foi possível verificar o pagamento. Tente mais tarde ou contacte o administrador.");
            return ResponseEntity.ok(r);
        }
    }

    /**
     * Inicia um pagamento C2B via M-Pesa.
     * O utilizador recebe USSD push no telemóvel para confirmar com PIN.
     */
    @PostMapping("/pay")
    public ResponseEntity<Map<String, Object>> initiatePayment(
            @CurrentUserId UUID userId,
            @RequestBody Map<String, Object> body) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String phone = body.get("phone") != null ? body.get("phone").toString() : "";
        int months = parseMonths(body);
        return runMpesaPayment(userId, phone, months, parseSimulatedChannel(body), body);
    }

    /**
     * Inicia pagamento M-Pesa sem sessão: valida telefone e senha da conta (mesmo formato que no login).
     */
    @PostMapping("/pay-with-credentials")
    public ResponseEntity<Map<String, Object>> payWithCredentials(@RequestBody Map<String, Object> body) {
        String loginPhone = AuthService.normalizeLoginPhone(
            body.get("loginPhone") != null ? body.get("loginPhone").toString() : "");
        String password = body.get("password") != null ? body.get("password").toString() : "";
        if (loginPhone.isEmpty() || password.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telefone e senha são obrigatórios.");
        }
        UserEntity user = userRepository.findByPhone(loginPhone)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Telefone ou senha incorretos."));
        if (user.isBlocked()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conta bloqueada. Contacte o suporte.");
        }
        if (!user.getPasswordHash().equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Telefone ou senha incorretos.");
        }
        if (user.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Administradores não utilizam este fluxo.");
        }
        if (licenseService.isCommerciallyPaidLicense(user.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A sua licença já está activa. Inicie sessão normalmente.");
        }
        String mpesaPhone = body.get("mpesaPhone") != null ? body.get("mpesaPhone").toString()
            : (body.get("phone") != null ? body.get("phone").toString() : "");
        int months = parseMonths(body);
        return runMpesaPayment(user.getId(), mpesaPhone, months, parseSimulatedChannel(body), body);
    }

    /** Canal de simulação: mpesa (omissão) ou emola. Ignorado quando a simulação está desligada. */
    private static String parseSimulatedChannel(Map<String, Object> body) {
        if (body == null) {
            return "mpesa";
        }
        Object raw = body.get("simulatedChannel");
        if (raw == null) {
            raw = body.get("paymentChannel");
        }
        if (raw == null) {
            return "mpesa";
        }
        String s = raw.toString().trim().toLowerCase(Locale.ROOT);
        if ("emola".equals(s) || "e-mola".equals(s) || "e_mola".equals(s)) {
            return "emola";
        }
        return "mpesa";
    }

    private static int parseMonths(Map<String, Object> body) {
        int months = 1;
        if (body.get("months") != null) {
            try {
                months = Integer.parseInt(body.get("months").toString());
            } catch (NumberFormatException ignored) {}
        }
        if (months < 1 || months > 12) {
            months = 1;
        }
        return months;
    }

    private static String parseTransferReference(Map<String, Object> body) {
        if (body == null) return null;
        Object raw = body.get("transferReference");
        if (raw == null) raw = body.get("transactionReference");
        if (raw == null) return null;
        String s = raw.toString().trim();
        return s.isEmpty() ? null : s.substring(0, Math.min(s.length(), 120));
    }

    /** Carteira de origem: 9 dígitos; M-Pesa 84|85, e-Mola 86|87. */
    private static String normalizeWalletPhone(String raw) {
        if (raw == null) {
            return "";
        }
        String d = raw.replaceAll("\\D", "").trim();
        if (d.startsWith("258")) {
            d = d.length() > 3 ? d.substring(3) : "";
        }
        if (d.length() > 9) {
            d = d.substring(0, 9);
        }
        return d;
    }

    private static void validateWalletPhone(String wallet, String channel) {
        boolean emola = "emola".equalsIgnoreCase(channel);
        if (wallet.length() != 9) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                emola
                    ? "e-Mola: indique 9 dígitos começando por 86 ou 87 (ex.: 871234567)."
                    : "M-Pesa: indique 9 dígitos começando por 84 ou 85 (ex.: 841234567).");
        }
        boolean ok = emola
            ? (wallet.startsWith("86") || wallet.startsWith("87"))
            : (wallet.startsWith("84") || wallet.startsWith("85"));
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                emola
                    ? "e-Mola: o número deve começar por 86 ou 87."
                    : "M-Pesa: o número deve começar por 84 ou 85.");
        }
    }

    private ResponseEntity<Map<String, Object>> runMpesaPayment(
        UUID userId, String mpesaPhone, int months, String simulatedChannel, Map<String, Object> body) {
        if (months < 1) {
            months = 1;
        }
        if (months > 12) {
            months = 12;
        }

        String channel = "emola".equalsIgnoreCase(simulatedChannel) ? "emola" : "mpesa";
        mpesaPhone = normalizeWalletPhone(mpesaPhone);
        validateWalletPhone(mpesaPhone, channel);

        if (paymentSimulation.isEnabled()) {
            var existingPending = paymentRepo.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, "pending");
            if (existingPending.isPresent()
                && existingPending.get().getThirdPartyId() != null
                && existingPending.get().getThirdPartyId().startsWith("SIM-")) {
                Map<String, Object> dup = new LinkedHashMap<>();
                dup.put("success", false);
                dup.put("simulated", true);
                dup.put("message", "Já tem um pagamento pendente de validação. Aguarde a confirmação do administrador ou contacte o suporte.");
                dup.put("paymentId", existingPending.get().getId().toString());
                return ResponseEntity.ok(dup);
            }

            String channelLabel = "emola".equals(channel) ? "e-Mola" : "M-Pesa";
            String destinationPhone = "emola".equals(channel)
                ? licenseService.getEMolaPhone()
                : licenseService.getMpesaPhone();
            BigDecimal amount = licenseService.getLicenseAmount().multiply(BigDecimal.valueOf(months));
            String thirdPartyId = "SIM-" + UUID.randomUUID();
            String transactionId = generateSimulatedTransactionRef(channel);
            String transferRef = parseTransferReference(body);
            MpesaPaymentEntity payment = new MpesaPaymentEntity();
            payment.setUserId(userId);
            payment.setThirdPartyId(thirdPartyId);
            payment.setConversationId(thirdPartyId);
            payment.setTransactionId(transactionId);
            payment.setAmount(amount);
            payment.setDurationMonths(months);
            payment.setCustomerPhone(mpesaPhone != null ? mpesaPhone.trim() : "");
            payment.setStatus("pending");
            payment.setMpesaResponseCode("MANUAL");
            String desc = "Transferência manual " + channelLabel + " → " + destinationPhone
                + ". Utilizador confirmou envio.";
            if (transferRef != null && !transferRef.isBlank()) {
                payment.setUserTransferReference(transferRef.trim());
                desc += " Ref. indicada pelo cliente: " + transferRef.trim();
            }
            payment.setMpesaResponseDesc(desc);
            payment.setSimulationChannel(channel);
            paymentRepo.save(payment);

            UserEntity user = userRepository.findById(userId).orElse(null);
            String uName = user != null && user.getFullName() != null && !user.getFullName().isBlank()
                ? user.getFullName()
                : (user != null ? user.getPhone() : "—");
            String uPhone = user != null ? user.getPhone() : "";
            String walletPh = payment.getCustomerPhone() != null && !payment.getCustomerPhone().isBlank()
                ? payment.getCustomerPhone() : "—";
            String message = String.format(
                "Pedido de licença aguarda validação (transferência manual).%n"
                    + "Canal: %s%nNúmero de destino: %s%n"
                    + "Nome: %s%nTelefone da conta: %s%nNúmero de origem (carteira): %s%n"
                    + "Valor: %s MZN · %d %s%n"
                    + "ID do pedido: %s%nReferência interna: %s%n"
                    + "%s%n"
                    + "Em «Novos utilizadores» → «Pagamentos pendentes», confirme se o valor foi recebido.",
                channelLabel,
                destinationPhone,
                uName,
                uPhone.isEmpty() ? "—" : uPhone,
                walletPh,
                amount.toPlainString(),
                months,
                months == 1 ? "mês" : "meses",
                payment.getId(),
                transactionId,
                transferRef != null && !transferRef.isBlank() ? "Ref. do utilizador: " + transferRef.trim() : "");
            systemNotificationService.createSystemAlert(
                "[Licença] Pagamento pendente (" + channelLabel + ")",
                message,
                "warning");

            Map<String, Object> r = new LinkedHashMap<>();
            r.put("success", true);
            r.put("simulated", true);
            r.put("manualTransfer", true);
            r.put("simulatedChannel", channel);
            r.put("destinationPhone", destinationPhone);
            r.put("message",
                "Já registámos o seu pedido. Aguarde a confirmação do administrador ou contacte o suporte se demorar.");
            r.put("paymentId", payment.getId().toString());
            r.put("conversationId", payment.getConversationId());
            return ResponseEntity.ok(r);
        }

        if (!mpesaService.isAvailable()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Pagamento não está disponível de momento. Contacte o administrador."
            ));
        }

        BigDecimal amount = licenseService.getLicenseAmount().multiply(BigDecimal.valueOf(months));
        String reference = "LIC-" + userId.toString().substring(0, 8).toUpperCase();
        String description = "Licença Chef Control (" + months + " mês" + (months > 1 ? "es" : "") + ")";

        try {
            MpesaService.C2BResult result = mpesaService.initiateC2BPayment(mpesaPhone, amount, reference, description);

            MpesaPaymentEntity payment = new MpesaPaymentEntity();
            payment.setUserId(userId);
            payment.setThirdPartyId(result.getThirdPartyId());
            payment.setConversationId(result.getConversationId());
            payment.setTransactionId(result.getTransactionId());
            payment.setAmount(amount);
            payment.setDurationMonths(months);
            payment.setCustomerPhone(mpesaPhone);
            payment.setStatus("pending");
            payment.setMpesaResponseCode(result.getResponseCode());
            payment.setMpesaResponseDesc(result.getResponseDesc());
            paymentRepo.save(payment);

            Map<String, Object> r = new LinkedHashMap<>();
            r.put("success", true);
            r.put("simulated", false);
            r.put("message", "Pedido enviado. Verifique o telemóvel e confirme o pagamento com o seu PIN M-Pesa.");
            r.put("paymentId", payment.getId().toString());
            r.put("conversationId", result.getConversationId());
            return ResponseEntity.ok(r);

        } catch (MpesaException e) {
            log.warn("M-Pesa C2B falhou para user={}: {}", userId, e.getMessage());
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("success", false);
            r.put("message", e.getMessage());
            return ResponseEntity.ok(r);
        }
    }

    /**
     * Verifica o estado de um pagamento M-Pesa pendente do utilizador.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> paymentStatus(@CurrentUserId UUID userId) {
        Map<String, Object> r = new LinkedHashMap<>();
        var payments = paymentRepo.findByUserIdOrderByCreatedAtDesc(userId);
        if (payments.isEmpty()) {
            r.put("hasPending", false);
            r.put("hasRejected", false);
            return ResponseEntity.ok(r);
        }
        MpesaPaymentEntity latest = payments.get(0);
        if ("rejected".equals(latest.getStatus())) {
            r.put("hasPending", false);
            r.put("hasRejected", true);
            r.put("paymentId", latest.getId().toString());
            r.put("status", latest.getStatus());
            r.put("amount", latest.getAmount());
            r.put("rejectionReason", latest.getAdminRejectionReason());
            r.put("rejectedAt", latest.getRejectedAt() != null ? latest.getRejectedAt().toString() : null);
            if (latest.getSimulationChannel() != null && !latest.getSimulationChannel().isBlank()) {
                r.put("simulatedChannel", latest.getSimulationChannel());
                r.put("manualTransfer", true);
            }
            return ResponseEntity.ok(r);
        }
        var opt = paymentRepo.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, "pending");
        r.put("hasRejected", false);
        if (opt.isEmpty()) {
            r.put("hasPending", false);
            return ResponseEntity.ok(r);
        }
        MpesaPaymentEntity p = opt.get();
        r.put("hasPending", true);
        r.put("paymentId", p.getId().toString());
        r.put("status", p.getStatus());
        r.put("amount", p.getAmount());
        r.put("createdAt", p.getCreatedAt().toString());
        if (p.getSimulationChannel() != null && !p.getSimulationChannel().isBlank()) {
            r.put("simulatedChannel", p.getSimulationChannel());
            r.put("manualTransfer", true);
        }
        if (p.getMpesaResponseDesc() != null) {
            r.put("description", p.getMpesaResponseDesc());
        }
        return ResponseEntity.ok(r);
    }

    /**
     * Endpoint de callback chamado pelo M-Pesa quando o pagamento é concluído.
     * Este endpoint é público (sem autenticação) porque é chamado pelo servidor M-Pesa.
     */
    @PostMapping("/callback")
    public ResponseEntity<Void> callback(@RequestBody JsonNode payload) {
        log.info("M-Pesa callback recebido: {}", payload);

        try {
            String resultCode = payload.path("output_ResultCode").asText(
                payload.path("resultCode").asText(""));
            String resultDesc = payload.path("output_ResultDesc").asText(
                payload.path("resultDesc").asText(""));
            String conversationId = payload.path("output_ConversationID").asText(
                payload.path("conversationID").asText(""));
            String transactionId = payload.path("output_TransactionID").asText(
                payload.path("transactionID").asText(""));
            String thirdPartyId = payload.path("output_ThirdPartyConversationID").asText(
                payload.path("thirdPartyConversationID").asText(""));

            MpesaPaymentEntity payment = null;

            if (!thirdPartyId.isBlank()) {
                payment = paymentRepo.findByThirdPartyId(thirdPartyId).orElse(null);
            }
            if (payment == null && !conversationId.isBlank()) {
                payment = paymentRepo.findByConversationId(conversationId).orElse(null);
            }

            if (payment == null) {
                log.warn("M-Pesa callback: pagamento não encontrado (thirdPartyId={}, conversationId={})",
                        thirdPartyId, conversationId);
                return ResponseEntity.ok().build();
            }

            if (payment.getThirdPartyId() != null && payment.getThirdPartyId().startsWith("SIM-")) {
                log.info("M-Pesa callback: ignorado para pagamento simulado id={}", payment.getThirdPartyId());
                return ResponseEntity.ok().build();
            }

            if (!transactionId.isBlank()) {
                payment.setTransactionId(transactionId);
            }
            payment.setMpesaResponseCode(resultCode);
            payment.setMpesaResponseDesc(resultDesc);
            payment.setCompletedAt(Instant.now());

            boolean success = "INS-0".equals(resultCode) || "0".equals(resultCode);
            if (success) {
                payment.setStatus("completed");
                paymentRepo.save(payment);

                String txRef = !transactionId.isBlank() ? transactionId : payment.getThirdPartyId();
                String padded = txRef.length() < 18
                    ? txRef + "0".repeat(18 - txRef.length())
                    : txRef.substring(0, 18);

                try {
                    licenseService.confirmPayment(payment.getUserId(), padded, payment.getDurationMonths());
                    log.info("M-Pesa callback: licença confirmada automaticamente para user={}", payment.getUserId());
                } catch (Exception e) {
                    log.error("M-Pesa callback: erro ao confirmar licença para user={}: {}", payment.getUserId(), e.getMessage());
                }
            } else {
                payment.setStatus("failed");
                paymentRepo.save(payment);
                log.info("M-Pesa callback: pagamento falhou para user={}: {} - {}", payment.getUserId(), resultCode, resultDesc);
            }

        } catch (Exception e) {
            log.error("Erro ao processar callback M-Pesa: {}", e.getMessage(), e);
        }

        return ResponseEntity.ok().build();
    }

    /**
     * Referência alfanumérica de 18 caracteres (compatível com validação em {@link com.chefcontrol.service.LicenseService#confirmPayment}).
     * Prefixo SIM = fluxo simulado M-Pesa; EML = fluxo simulado e-Mola.
     */
    private static String generateSimulatedTransactionRef(String channel) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        String prefix = "emola".equalsIgnoreCase(channel) ? "EML" : "SIM";
        StringBuilder sb = new StringBuilder(prefix);
        for (int i = 0; i < 15; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
