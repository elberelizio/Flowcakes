package com.chefcontrol.controller;

import com.chefcontrol.config.CurrentUserId;
import com.chefcontrol.entity.MpesaPaymentEntity;
import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.repository.MpesaPaymentRepository;
import com.chefcontrol.repository.UserRepository;
import com.chefcontrol.service.LicenseService;
import com.chefcontrol.service.SystemNotificationService;
import org.springframework.http.HttpStatus;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/mpesa")
public class MpesaController {

    private final MpesaPaymentRepository paymentRepo;
    private final LicenseService licenseService;
    private final UserRepository userRepository;
    private final SystemNotificationService systemNotificationService;

    public MpesaController(MpesaPaymentRepository paymentRepo, LicenseService licenseService,
                           UserRepository userRepository,
                           SystemNotificationService systemNotificationService) {
        this.paymentRepo = paymentRepo;
        this.licenseService = licenseService;
        this.userRepository = userRepository;
        this.systemNotificationService = systemNotificationService;
    }

    /** Verifica se o fluxo de pagamento manual está disponível. */
    @GetMapping("/available")
    public ResponseEntity<Map<String, Object>> available() {
        Map<String, Object> r = new LinkedHashMap<>();
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

    /**
     * Regista um pedido de pagamento por transferência manual (M-Pesa ou e-Mola).
     * O administrador valida o pagamento antes de activar a licença.
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
        return runSimulatedPayment(userId, phone, months, parseSimulatedChannel(body), body);
    }

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

    private ResponseEntity<Map<String, Object>> runSimulatedPayment(
        UUID userId, String mpesaPhone, int months, String channel, Map<String, Object> body) {
        if (months < 1) {
            months = 1;
        }
        if (months > 12) {
            months = 12;
        }

        channel = "emola".equalsIgnoreCase(channel) ? "emola" : "mpesa";
        mpesaPhone = normalizeWalletPhone(mpesaPhone);
        validateWalletPhone(mpesaPhone, channel);

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
        systemNotificationService.upsertPaymentPendingAdminReminder(payment, uName);

        boolean canUseApp = licenseService.canUseAppWhilePaymentPending(userId);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("success", true);
        r.put("simulated", true);
        r.put("manualTransfer", true);
        r.put("simulatedChannel", channel);
        r.put("destinationPhone", destinationPhone);
        r.put("canUseAppWhilePending", canUseApp);
        r.put("message", canUseApp
            ? "Pedido registado. Pode continuar a usar o sistema — a licença será actualizada assim que o administrador confirmar o pagamento."
            : "Pedido registado. Aguarde a confirmação do administrador para voltar a aceder ao sistema.");
        r.put("paymentId", payment.getId().toString());
        r.put("conversationId", payment.getConversationId());
        r.put("pendingPaymentValidation", true);
        return ResponseEntity.ok(r);
    }

    /** Verifica o estado de um pagamento pendente do utilizador. */
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
            String reason = latest.getAdminRejectionReason();
            r.put("rejectionReason", reason != null && !reason.isBlank()
                ? reason.trim()
                : "O pagamento não foi confirmado. Pode efectuar uma nova transferência.");
            r.put("supportWhatsapp", licenseService.getSupportWhatsapp());
            r.put("rejectedAt", latest.getRejectedAt() != null ? latest.getRejectedAt().toString() : null);
            if (latest.getSimulationChannel() != null && !latest.getSimulationChannel().isBlank()) {
                r.put("simulatedChannel", latest.getSimulationChannel());
                r.put("manualTransfer", true);
            }
            return ResponseEntity.ok(r);
        }

        r.put("hasRejected", false);
        var opt = paymentRepo.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, "pending");
        if (opt.isEmpty()) {
            r.put("hasPending", false);
            return ResponseEntity.ok(r);
        }
        MpesaPaymentEntity p = opt.get();
        r.put("hasPending", true);
        r.put("pendingPaymentValidation", true);
        r.put("canUseAppWhilePending", licenseService.canUseAppWhilePaymentPending(userId));
        r.put("paymentId", p.getId().toString());
        r.put("status", p.getStatus());
        r.put("amount", p.getAmount());
        r.put("createdAt", p.getCreatedAt().toString());
        r.put("manualTransfer", true);
        if (p.getSimulationChannel() != null && !p.getSimulationChannel().isBlank()) {
            r.put("simulatedChannel", p.getSimulationChannel());
        }
        if (p.getMpesaResponseDesc() != null) {
            r.put("description", p.getMpesaResponseDesc());
        }
        return ResponseEntity.ok(r);
    }

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
