package com.chefcontrol.service;

import com.chefcontrol.dto.LicenseInfoPublicDto;
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
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class LicenseService {

    private static final String E_MOLA_PHONE = "871964887";

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

    public UserLicenseEntity createPendingLicenseForUser(UUID userId) {
        if (licenseRepository.findByUserId(userId).isPresent()) {
            return licenseRepository.findByUserId(userId).orElseThrow();
        }
        UserLicenseEntity lic = new UserLicenseEntity();
        lic.setUserId(userId);
        lic.setAmount(licenseAmount);
        lic.setStatus("pending");
        lic.setPaymentPhone(eMolaPhone);
        licenseRepository.save(lic);
        return lic;
    }

    public Optional<UserLicenseEntity> findByUserId(UUID userId) {
        return licenseRepository.findByUserId(userId);
    }

    /**
     * Valida o código da licença do utilizador (associado ao NUIT/documento).
     * O código é alfanumérico, máx. 9 caracteres, gerado ao confirmar pagamento.
     */
    public boolean validateLicenseCode(UUID userId, String code) {
        if (code == null || code.isBlank()) return false;
        String normalized = code.trim().toUpperCase();
        if (normalized.length() > 9) return false;
        Instant now = Instant.now();
        return licenseRepository.findByUserId(userId)
            .filter(lic -> "paid".equals(lic.getStatus()))
            .filter(lic -> lic.getValidUntil() == null || lic.getValidUntil().isAfter(now))
            .filter(lic -> normalized.equals(lic.getLicenseToken() != null ? lic.getLicenseToken().toUpperCase() : null))
            .isPresent();
    }

    /**
     * Conta está finalizada se: o utilizador é admin (não precisa de licença)
     * ou tem licença com status "paid" e valid_until no futuro (ou sem valid_until para licenças antigas).
     */
    public boolean isLicensePaid(UUID userId) {
        if (userRepository.findById(userId).map(UserEntity::isAdmin).orElse(false)) {
            return true;
        }
        Instant now = Instant.now();
        return licenseRepository.findByUserId(userId)
            .map(l -> "paid".equals(l.getStatus()) && (l.getValidUntil() == null || l.getValidUntil().isAfter(now)))
            .orElse(false);
    }

    private static final int DAYS_PER_MONTH = 30;

    /**
     * Confirma pagamento da licença com o ID da transacção e-Mola e duração em meses.
     * Regista o ID em license_transactions. Se já existir licença paga com valid_until no futuro,
     * soma o tempo restante + nova duração; senão define valid_until = now + duração.
     */
    public UserLicenseEntity confirmPayment(UUID userId, String eMolaTransactionId, int durationMonths) {
        String txId = eMolaTransactionId != null ? eMolaTransactionId.trim() : null;
        if (txId == null || txId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID da transacção e-Mola é obrigatório");
        }
        if (txId.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID da transacção demasiado longo");
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
        licenseTransactionRepository.save(tx);

        if ("paid".equals(lic.getStatus()) && lic.getValidUntil() != null && lic.getValidUntil().isAfter(now)) {
            // Renovação: soma tempo restante + nova duração (em dias)
            long extraDays = durationMonths * DAYS_PER_MONTH;
            lic.setValidUntil(lic.getValidUntil().plus(extraDays, ChronoUnit.DAYS));
            if (lic.getActivationToken() == null || lic.getActivationToken().isBlank()) {
                lic.setActivationToken(generateActivationToken());
            }
            return licenseRepository.save(lic);
        }

        // Primeira vez pago ou licença expirada: valid_until = now + duração
        lic.setStatus("paid");
        lic.setPaidAt(lic.getPaidAt() != null ? lic.getPaidAt() : now);
        lic.setPaymentReference(txId);
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
            .filter(lic -> "paid".equals(lic.getStatus()))
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
