package com.chefcontrol.service;

import com.chefcontrol.dto.LicenseInfoPublicDto;
import com.chefcontrol.dto.LicensePaymentDto;
import com.chefcontrol.dto.LicenseStatusResponse;
import com.chefcontrol.dto.LicenseExpiringUserDto;
import com.chefcontrol.exception.LicenseLoginBlockedException;
import com.chefcontrol.entity.LicenseTransactionEntity;
import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.entity.UserLicenseEntity;
import com.chefcontrol.repository.LicenseTransactionRepository;
import com.chefcontrol.repository.UserLicenseRepository;
import com.chefcontrol.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LicenseService {

    private static final String E_MOLA_PHONE = "871964887";
    /** EN: Awaiting payment. PT: Aguarda pagamento. */
    public static final String STATUS_PENDING = "pending";
    /** EN: Free trial period. PT: Período de teste gratuito. */
    public static final String STATUS_TRIAL = "trial";
    /** EN: Paid subscription. PT: Subscrição paga. */
    public static final String STATUS_PAID = "paid";

    private final UserLicenseRepository licenseRepository;
    private final LicenseTransactionRepository licenseTransactionRepository;
    private final UserRepository userRepository;

    @Value("${app.license-amount:500}")
    private BigDecimal licenseAmount;

    @Value("${app.e-mola-phone:871964887}")
    private String eMolaPhone;

    public LicenseService(UserLicenseRepository licenseRepository,
                          LicenseTransactionRepository licenseTransactionRepository,
                          UserRepository userRepository) {
        this.licenseRepository = licenseRepository;
        this.licenseTransactionRepository = licenseTransactionRepository;
        this.userRepository = userRepository;
    }

    /**
     * Cria uma licença em estado "pending" para o utilizador (fluxo antigo / compatibilidade).
     */
    public UserLicenseEntity createPendingLicenseForUser(UUID userId) {
        if (licenseRepository.findByUserId(userId).isPresent()) {
            return licenseRepository.findByUserId(userId).orElseThrow();
        }
        UserLicenseEntity lic = new UserLicenseEntity();
        lic.setUserId(userId);
        applyBaseLicenseDefaults(lic);
        lic.setStatus(STATUS_PENDING);
        licenseRepository.save(lic);
        return lic;
    }

    private void applyBaseLicenseDefaults(UserLicenseEntity lic) {
        lic.setAmount(licenseAmount);
        lic.setPaymentPhone(eMolaPhone);
    }

    /**
     * EN: Trial license — immediate access for N days. PT: Licença de teste com acesso imediato.
     * Uses status {@value #STATUS_TRIAL} (not {@value #STATUS_PAID}) so admin UI shows trial vs paid.
     */
    public UserLicenseEntity createTrialLicenseForUser(UUID userId, int trialDays) {
        if (trialDays <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duração do período de teste deve ser positiva");
        }
        UserLicenseEntity lic = licenseRepository.findByUserId(userId).orElseGet(() -> {
            UserLicenseEntity n = new UserLicenseEntity();
            n.setUserId(userId);
            applyBaseLicenseDefaults(n);
            return n;
        });
        applyBaseLicenseDefaults(lic);
        Instant now = Instant.now();
        lic.setStatus(STATUS_TRIAL);
        lic.setPaidAt(lic.getPaidAt() != null ? lic.getPaidAt() : now);
        if (lic.getPaymentReference() == null || lic.getPaymentReference().isBlank()) {
            lic.setPaymentReference("TRIAL");
        }
        lic.setValidUntil(now.plus(trialDays, ChronoUnit.DAYS));
        return licenseRepository.save(lic);
    }

    public Optional<UserLicenseEntity> findByUserId(UUID userId) {
        return licenseRepository.findByUserId(userId);
    }

    /** Marca licença pendente como rejeitada. Pode ser aprovada depois com confirmPayment. */
    public UserLicenseEntity rejectPendingLicense(UUID userId) {
        UserLicenseEntity lic = licenseRepository.findByUserId(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Licença não encontrada"));
        if (!STATUS_PENDING.equals(lic.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Só licenças pendentes podem ser rejeitadas");
        }
        lic.setRejectedAt(Instant.now());
        return licenseRepository.save(lic);
    }

    /**
     * EN: User may use the app (trial or paid, not expired). PT: Acesso à app (teste ou pago, não expirado).
     * Legacy name {@link #isLicensePaid(UUID)} kept as alias for callers.
     */
    public boolean hasActiveLicenseAccess(UUID userId) {
        if (userRepository.findById(userId).map(UserEntity::isAdmin).orElse(false)) {
            return true;
        }
        Instant now = Instant.now();
        return licenseRepository.findByUserId(userId)
            .map(l -> (STATUS_PAID.equals(l.getStatus()) || STATUS_TRIAL.equals(l.getStatus()))
                && (l.getValidUntil() == null || l.getValidUntil().isAfter(now)))
            .orElse(false);
    }

    /** Alias of {@link #hasActiveLicenseAccess(UUID)} for existing callers. */
    public boolean isLicensePaid(UUID userId) {
        return hasActiveLicenseAccess(userId);
    }

    /**
     * EN: Commercially paid license (excludes trial). PT: Licença paga (exclui período de teste).
     */
    public boolean isCommerciallyPaidLicense(UUID userId) {
        if (userRepository.findById(userId).map(UserEntity::isAdmin).orElse(false)) {
            return true;
        }
        Instant now = Instant.now();
        return licenseRepository.findByUserId(userId)
            .map(l -> STATUS_PAID.equals(l.getStatus()) && (l.getValidUntil() == null || l.getValidUntil().isAfter(now)))
            .orElse(false);
    }

    /**
     * Se a licença não permite sessão (não-admin), lança excepção com código e data para o ecrã de login.
     */
    public void assertLicenseAllowsLogin(UUID userId, boolean isAdmin) {
        if (isAdmin || hasActiveLicenseAccess(userId)) {
            return;
        }
        Optional<UserLicenseEntity> opt = licenseRepository.findByUserId(userId);
        Instant now = Instant.now();
        if (opt.isEmpty()) {
            throw new LicenseLoginBlockedException(
                "LICENSE_PENDING",
                "Não existe licença associada à sua conta. Efectue o pagamento ou contacte o suporte.",
                null);
        }
        UserLicenseEntity lic = opt.get();
        if (STATUS_PENDING.equals(lic.getStatus())) {
            throw new LicenseLoginBlockedException(
                "LICENSE_PENDING",
                "A sua licença ainda não foi activada. Efectue o pagamento via M-Pesa para continuar.",
                null);
        }
        if (lic.getValidUntil() != null && lic.getValidUntil().isBefore(now)) {
            if (!hasCompletedPaidSubscriptionBeyondTrial(lic)) {
                throw new LicenseLoginBlockedException(
                    "LICENSE_TRIAL_ENDED",
                    "O seu período de teste terminou. Renove a licença via M-Pesa para voltar a aceder.",
                    lic.getValidUntil());
            }
            throw new LicenseLoginBlockedException(
                "LICENSE_EXPIRED",
                "A sua licença expirou. Renove via M-Pesa para voltar a aceder.",
                lic.getValidUntil());
        }
        throw new LicenseLoginBlockedException(
            "LICENSE_PENDING",
            "Não é possível iniciar sessão. Efectue o pagamento da licença ou contacte o suporte.",
            lic.getValidUntil());
    }

    /** True se já existe pagamento real (referência não-TRIAL ou transacção registada). */
    public boolean hasCompletedPaidSubscriptionBeyondTrial(UserLicenseEntity lic) {
        String ref = lic.getPaymentReference();
        boolean trialLike = ref == null || ref.isBlank() || "TRIAL".equalsIgnoreCase(ref.trim());
        if (!trialLike) {
            return true;
        }
        return licenseTransactionRepository.existsByUserLicenseId(lic.getId());
    }

    public void applyLicenseExpiryToUserResponse(UUID userId, com.chefcontrol.dto.UserResponse resp) {
        if (userRepository.findById(userId).map(UserEntity::isAdmin).orElse(false)) {
            return;
        }
        licenseRepository.findByUserId(userId).ifPresent(lic -> {
            Long days = computeDaysRemaining(lic);
            if (days != null) {
                resp.setLicenseDaysRemaining(days);
                boolean warn = days > 0 && days <= 10 && hasActiveLicenseAccess(userId);
                resp.setShowLicenseExpiryWarning(warn);
            }
        });
    }

    private Long computeDaysRemaining(UserLicenseEntity lic) {
        if (lic.getValidUntil() == null) {
            return null;
        }
        Instant now = Instant.now();
        ZoneId z = ZoneId.systemDefault();
        long days = ChronoUnit.DAYS.between(
            now.atZone(z).toLocalDate(),
            lic.getValidUntil().atZone(z).toLocalDate());
        return days;
    }

    public void fillLicenseStatusResponse(UUID userId, LicenseStatusResponse r) {
        r.setAmount(licenseAmount);
        r.setEMolaPhone(eMolaPhone);
        r.setAccountFinalized(hasActiveLicenseAccess(userId));
        licenseRepository.findByUserId(userId).ifPresent(lic -> {
            r.setStatus(lic.getStatus());
            r.setLicenseToken(lic.getLicenseToken());
            r.setValidUntil(lic.getValidUntil());
            Long days = computeDaysRemaining(lic);
            if (days != null) {
                r.setDaysRemaining(days);
                r.setShowLicenseExpiryWarning(days > 0 && days <= 10 && hasActiveLicenseAccess(userId));
            }
        });
        if (r.getStatus() == null) {
            r.setStatus(STATUS_PENDING);
        }
    }

    public List<LicensePaymentDto> listLicensePaymentsForUser(UUID userId) {
        if (userRepository.findById(userId).map(UserEntity::isAdmin).orElse(false)) {
            return List.of();
        }
        Optional<UserLicenseEntity> opt = licenseRepository.findByUserId(userId);
        if (opt.isEmpty()) {
            return List.of();
        }
        UserLicenseEntity lic = opt.get();
        return licenseTransactionRepository.findByUserLicenseIdOrderByCreatedAtDesc(lic.getId()).stream()
            .map(tx -> {
                LicensePaymentDto d = new LicensePaymentDto();
                d.setId(tx.getId() != null ? tx.getId().toString() : null);
                d.setCreatedAt(tx.getCreatedAt() != null ? tx.getCreatedAt().toString() : null);
                d.setAmount(tx.getAmount() != null ? tx.getAmount() : licenseAmount);
                d.setDurationMonths(tx.getDurationMonths() != null ? tx.getDurationMonths() : 1);
                d.setEMolaTransactionId(tx.getEMolaTransactionId());
                return d;
            })
            .collect(Collectors.toList());
    }

    public List<LicenseExpiringUserDto> findLicensesExpiringWithinDays(int days, UUID adminUserId) {
        UserEntity admin = userRepository.findById(adminUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (!admin.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso reservado a administradores");
        }
        if (days < 1 || days > 90) {
            days = 10;
        }
        Instant now = Instant.now();
        Instant until = now.plus(days, ChronoUnit.DAYS);
        return licenseRepository.findNonAdminPaidExpiringBetween(now, until).stream()
            .map(lic -> {
                UserEntity u = userRepository.findById(lic.getUserId()).orElse(null);
                LicenseExpiringUserDto dto = new LicenseExpiringUserDto();
                dto.setUserId(lic.getUserId());
                dto.setFullName(u != null ? u.getFullName() : null);
                dto.setPhone(u != null ? u.getPhone() : null);
                dto.setValidUntil(lic.getValidUntil());
                Long dr = computeDaysRemaining(lic);
                dto.setDaysRemaining(dr != null ? dr : 0L);
                return dto;
            })
            .collect(Collectors.toList());
    }

    private static final int DAYS_PER_MONTH = 30;

    /**
     * Confirma pagamento da licença com o ID da transacção e-Mola e duração em meses.
     * Regista o ID em license_transactions. Se já existir licença paga com valid_until no futuro,
     * soma o tempo restante + nova duração; senão define valid_until = now + duração.
     */
    public UserLicenseEntity confirmPayment(UUID userId, String eMolaTransactionId, int durationMonths) {
        String txId = eMolaTransactionId != null ? eMolaTransactionId.trim().replaceAll("[^A-Za-z0-9]", "").toUpperCase() : null;
        if (txId == null || txId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID da transacção e-Mola é obrigatório");
        }
        if (txId.length() != 18) {
            int faltam = 18 - txId.length();
            String msg = faltam > 0
                ? "Tem " + txId.length() + " caracteres. Faltam " + faltam + " para completar os 18."
                : "Tem " + txId.length() + " caracteres. O ID e-Mola deve ter exatamente 18 caracteres.";
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
        }
        if (durationMonths < 1 || durationMonths > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duração deve ser entre 1 e 12 meses");
        }
        if (licenseTransactionRepository.existsByEMolaTransactionId(txId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este ID de transacção já foi utilizado");
        }
        UserLicenseEntity lic = licenseRepository.findByUserId(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Licença não encontrada"));
        Instant now = Instant.now();
        LicenseTransactionEntity tx = new LicenseTransactionEntity();
        tx.setUserLicenseId(lic.getId());
        tx.setEMolaTransactionId(txId);
        tx.setAmount(licenseAmount.multiply(BigDecimal.valueOf(durationMonths)));
        tx.setDurationMonths(durationMonths);
        licenseTransactionRepository.save(tx);

        if ((STATUS_PAID.equals(lic.getStatus()) || STATUS_TRIAL.equals(lic.getStatus()))
                && lic.getValidUntil() != null && lic.getValidUntil().isAfter(now)) {
            // Renovação: soma tempo restante + nova duração (em dias)
            long extraDays = durationMonths * DAYS_PER_MONTH;
            lic.setValidUntil(lic.getValidUntil().plus(extraDays, ChronoUnit.DAYS));
            if (lic.getLicenseToken() == null || lic.getLicenseToken().isBlank()) {
                lic.setLicenseToken(generateLicenseToken());
            }
            if (lic.getActivationToken() == null || lic.getActivationToken().isBlank()) {
                lic.setActivationToken(generateActivationToken());
            }
            return licenseRepository.save(lic);
        }

        // Primeira vez pago ou licença expirada: valid_until = now + duração
        lic.setStatus(STATUS_PAID);
        lic.setPaidAt(lic.getPaidAt() != null ? lic.getPaidAt() : now);
        lic.setPaymentReference(txId);
        lic.setRejectedAt(null); // Limpar rejeição ao aprovar
        if (lic.getLicenseToken() == null || lic.getLicenseToken().isBlank()) {
            lic.setLicenseToken(generateLicenseToken());
        }
        if (lic.getActivationToken() == null || lic.getActivationToken().isBlank()) {
            lic.setActivationToken(generateActivationToken());
        }
        lic.setValidUntil(now.plus((long) durationMonths * DAYS_PER_MONTH, ChronoUnit.DAYS));
        return licenseRepository.save(lic);
    }

    /**
     * Informação pública da licença por token opaco do link (segurança: o código não vai na URL).
     * O código da licença vem apenas no corpo da resposta.
     */
    public Optional<LicenseInfoPublicDto> getLicenseInfoByActivationToken(String activationToken) {
        if (activationToken == null || activationToken.isBlank()) return Optional.empty();
        return licenseRepository.findByActivationToken(activationToken.trim())
            .filter(lic -> STATUS_PAID.equals(lic.getStatus()))
            .map(lic -> {
                UserEntity user = userRepository.findById(lic.getUserId()).orElse(null);
                LicenseInfoPublicDto dto = new LicenseInfoPublicDto();
                dto.setFullName(user != null ? user.getFullName() : null);
                dto.setLicenseToken(lic.getLicenseToken());
                dto.setValidUntil(lic.getValidUntil());
                Instant now = Instant.now();
                dto.setExpired(lic.getValidUntil() != null && lic.getValidUntil().isBefore(now));
                return dto;
            });
    }

    /**
     * Estende o prazo da licença em N meses. Se validUntil for null ou já expirada, conta a partir de now;
     * senão soma os meses ao validUntil actual.
     */
    public UserLicenseEntity extendLicense(UUID userId, int months) {
        if (months < 1 || months > 24) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duração deve ser entre 1 e 24 meses");
        }
        UserLicenseEntity lic = licenseRepository.findByUserId(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Licença não encontrada"));
        Instant now = Instant.now();
        Instant base = (lic.getValidUntil() != null && lic.getValidUntil().isAfter(now)) ? lic.getValidUntil() : now;
        lic.setValidUntil(base.plus((long) months * DAYS_PER_MONTH, ChronoUnit.DAYS));
        if (STATUS_PENDING.equals(lic.getStatus())) {
            lic.setStatus(STATUS_PAID);
            if (lic.getPaidAt() == null) lic.setPaidAt(now);
            if (lic.getLicenseToken() == null || lic.getLicenseToken().isBlank()) lic.setLicenseToken(generateLicenseToken());
            if (lic.getActivationToken() == null || lic.getActivationToken().isBlank()) lic.setActivationToken(generateActivationToken());
        }
        return licenseRepository.save(lic);
    }

    public String getEMolaPhone() {
        return eMolaPhone;
    }

    public BigDecimal getLicenseAmount() {
        return licenseAmount;
    }

    /** Código alfanumérico 9 caracteres (letras e números), difícil de adivinhar. */
    private String generateLicenseToken() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        SecureRandom r = new SecureRandom();
        StringBuilder sb = new StringBuilder(9);
        for (int i = 0; i < 9; i++) {
            sb.append(chars.charAt(r.nextInt(chars.length())));
        }
        return sb.toString();
    }

    /** Token opaco para o link (não revela o código da licença). 32 caracteres hex. */
    private String generateActivationToken() {
        SecureRandom r = new SecureRandom();
        byte[] bytes = new byte[16];
        r.nextBytes(bytes);
        StringBuilder sb = new StringBuilder(32);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b & 0xff));
        }
        return sb.toString();
    }
}
