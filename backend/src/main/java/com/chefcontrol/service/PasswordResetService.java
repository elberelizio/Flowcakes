package com.chefcontrol.service;

import com.chefcontrol.dto.*;
import com.chefcontrol.entity.PasswordResetOtpEntity;
import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.repository.PasswordResetOtpRepository;
import com.chefcontrol.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetService {

    private static final int MAX_VERIFY_ATTEMPTS = 5;
    private static final SecureRandom OTP_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final SmsService smsService;
    private final SecurityEventService securityEventService;

    @Value("${app.password-reset.otp-expiry-minutes:10}")
    private int otpExpiryMinutes;

    @Value("${app.password-reset.reset-token-expiry-minutes:15}")
    private int resetTokenExpiryMinutes;

    @Value("${app.password-reset.simulation-expose-otp:true}")
    private boolean simulationExposeOtp;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetOtpRepository otpRepository,
            SmsService smsService,
            SecurityEventService securityEventService
    ) {
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.smsService = smsService;
        this.securityEventService = securityEventService;
    }

    @Transactional
    public RecoverPasswordRequestOtpResponse requestOtp(String rawPhone, String ipAddress, String userAgent) {
        String phone = AuthService.normalizeLoginPhone(rawPhone);
        if (phone.length() != 9 || !phone.chars().allMatch(Character::isDigit)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telefone deve ter 9 dígitos (Moçambique).");
        }

        Optional<UserEntity> userOpt = findUserByPhone(phone);
        if (userOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Não existe conta associada a este contacto.");
        }

        UserEntity user = userOpt.get();
        if (user.isBlocked()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conta bloqueada. Contacte o suporte.");
        }

        otpRepository.invalidateActiveForUser(user.getId());

        String otpCode = generateOtpCode();
        Instant expiresAt = Instant.now().plus(otpExpiryMinutes, ChronoUnit.MINUTES);

        PasswordResetOtpEntity entity = new PasswordResetOtpEntity();
        entity.setUserId(user.getId());
        entity.setPhone(phone);
        entity.setOtpCode(otpCode);
        entity.setExpiresAt(expiresAt);
        otpRepository.save(entity);

        smsService.sendOtp(phone, otpCode);

        securityEventService.log(
                SecurityEventService.EVENT_PASSWORD_RESET_OTP_REQUESTED,
                user,
                "OTP de recuperação de senha solicitado",
                ipAddress,
                userAgent
        );

        RecoverPasswordRequestOtpResponse response = new RecoverPasswordRequestOtpResponse();
        response.setPhone(phone);
        response.setMessage("Código OTP gerado. Introduza-o para continuar.");
        response.setExpiresInSeconds(otpExpiryMinutes * 60);
        if (simulationExposeOtp) {
            response.setSimulationOtp(otpCode);
        }
        return response;
    }

    @Transactional
    public RecoverPasswordVerifyOtpResponse verifyOtp(String rawPhone, String rawOtp, String ipAddress, String userAgent) {
        String phone = AuthService.normalizeLoginPhone(rawPhone);
        String otp = rawOtp == null ? "" : rawOtp.trim();

        if (phone.length() != 9 || otp.length() != 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telefone ou código OTP inválido.");
        }

        PasswordResetOtpEntity record = otpRepository
                .findTopByPhoneAndOtpCodeAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(phone, otp, Instant.now())
                .orElseThrow(() -> {
                    incrementFailedAttempt(phone);
                    return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código OTP inválido ou expirado.");
                });

        if (record.getVerifyAttempts() >= MAX_VERIFY_ATTEMPTS) {
            record.setUsed(true);
            otpRepository.save(record);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Muitas tentativas. Solicite um novo código.");
        }

        UUID resetToken = UUID.randomUUID();
        Instant resetTokenExpires = Instant.now().plus(resetTokenExpiryMinutes, ChronoUnit.MINUTES);
        record.setVerifiedAt(Instant.now());
        record.setResetToken(resetToken);
        record.setResetTokenExpiresAt(resetTokenExpires);
        otpRepository.save(record);

        userRepository.findById(record.getUserId()).ifPresent(user ->
                securityEventService.log(
                        SecurityEventService.EVENT_PASSWORD_RESET_OTP_VERIFIED,
                        user,
                        "OTP de recuperação validado",
                        ipAddress,
                        userAgent
                )
        );

        RecoverPasswordVerifyOtpResponse response = new RecoverPasswordVerifyOtpResponse();
        response.setMessage("Código confirmado. Defina a nova senha.");
        response.setResetToken(resetToken.toString());
        response.setResetTokenExpiresInSeconds(resetTokenExpiryMinutes * 60);
        return response;
    }

    @Transactional
    public void resetPassword(RecoverPasswordResetDto dto, String ipAddress, String userAgent) {
        String phone = AuthService.normalizeLoginPhone(dto.getPhone());
        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "As senhas não coincidem.");
        }

        UUID resetToken;
        try {
            resetToken = UUID.fromString(dto.getResetToken().trim());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token de recuperação inválido.");
        }

        PasswordResetOtpEntity record = otpRepository
                .findByResetTokenAndPhoneAndUsedFalseAndResetTokenExpiresAtAfter(resetToken, phone, Instant.now())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Sessão de recuperação inválida ou expirada. Solicite novo código."));

        if (record.getVerifiedAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Confirme o código OTP antes de alterar a senha.");
        }

        UserEntity user = userRepository.findById(record.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado."));

        user.setPasswordHash(dto.getNewPassword());
        userRepository.save(user);

        record.setUsed(true);
        otpRepository.save(record);
        otpRepository.invalidateActiveForUser(user.getId());

        securityEventService.log(
                SecurityEventService.EVENT_PASSWORD_RESET_COMPLETED,
                user,
                "Senha alterada via recuperação OTP",
                ipAddress,
                userAgent
        );
    }

    /** OTP numérico de 6 dígitos, imprevisível (SecureRandom). */
    private String generateOtpCode() {
        return String.format("%06d", OTP_RANDOM.nextInt(1_000_000));
    }

    private void incrementFailedAttempt(String phone) {
        otpRepository
                .findTopByPhoneAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(phone, Instant.now())
                .ifPresent(record -> {
                    record.setVerifyAttempts(record.getVerifyAttempts() + 1);
                    if (record.getVerifyAttempts() >= MAX_VERIFY_ATTEMPTS) {
                        record.setUsed(true);
                    }
                    otpRepository.save(record);
                });
    }

    private Optional<UserEntity> findUserByPhone(String normalizedPhone) {
        Optional<UserEntity> direct = userRepository.findByPhone(normalizedPhone);
        if (direct.isPresent()) {
            return direct;
        }
        return userRepository.findByPhone("258" + normalizedPhone);
    }
}
