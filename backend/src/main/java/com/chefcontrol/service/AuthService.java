package com.chefcontrol.service;

import com.chefcontrol.dto.*;
import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.entity.PhoneChangeRequestEntity;
import com.chefcontrol.repository.PhoneChangeRequestRepository;
import com.chefcontrol.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final LicenseService licenseService;
    private final NotificationService notificationService;
    private final SmsService smsService;
    private final PhoneChangeRequestRepository phoneChangeRequestRepository;

    @Value("${app.trial-days:14}")
    private int trialDays;

    public AuthService(UserRepository userRepository, LicenseService licenseService, NotificationService notificationService,
                       SmsService smsService, PhoneChangeRequestRepository phoneChangeRequestRepository) {
        this.userRepository = userRepository;
        this.licenseService = licenseService;
        this.notificationService = notificationService;
        this.smsService = smsService;
        this.phoneChangeRequestRepository = phoneChangeRequestRepository;
    }

    /** Normaliza telefone: só dígitos; se começar com 258 e tiver 12 dígitos (Moçambique), usa os últimos 9. */
    public static String normalizeLoginPhone(String phone) {
        if (phone == null) return "";
        String digits = phone.replaceAll("\\D", "").trim();
        if (digits.startsWith("258") && digits.length() == 12) {
            return digits.substring(3);
        }
        return digits;
    }

    /**
     * Telefone já normalizado (9 dígitos nacionais ou outro formato guardado na BD).
     * Aceita contas antigas gravadas com prefixo 258…
     */
    private Optional<UserEntity> findUserByNormalizedPhone(String normalizedPhone) {
        Optional<UserEntity> direct = userRepository.findByPhone(normalizedPhone);
        if (direct.isPresent()) {
            return direct;
        }
        if (normalizedPhone.length() == 9 && normalizedPhone.chars().allMatch(Character::isDigit)) {
            return userRepository.findByPhone("258" + normalizedPhone);
        }
        return Optional.empty();
    }

    private boolean phoneAlreadyRegistered(String normalized) {
        if (userRepository.existsByPhone(normalized)) {
            return true;
        }
        return normalized.length() == 9
                && normalized.chars().allMatch(Character::isDigit)
                && userRepository.existsByPhone("258" + normalized);
    }

    public UserResponse login(LoginRequest request) {
        String phone = normalizeLoginPhone(request.getPhone());
        if (phone.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telefone inválido");
        }
        UserEntity user = findUserByNormalizedPhone(phone)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Conta não encontrada"));
        if (user.isBlocked()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conta bloqueada. Contacte o suporte.");
        }
        if (!user.getPasswordHash().equals(request.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Telefone ou senha incorretos");
        }
        boolean isAdmin = user.isAdmin();
        licenseService.assertLicenseAllowsLogin(user.getId(), isAdmin);
        String licenseStatus = isAdmin ? "paid" : licenseService.findByUserId(user.getId()).map(l -> l.getStatus()).orElse("pending");
        UserResponse resp = UserResponse.fromEntity(user, licenseStatus);
        if (!isAdmin) {
            resp.setAccountFinalized(licenseService.isLicensePaid(user.getId()));
            licenseService.applyLicenseExpiryToUserResponse(user.getId(), resp);
        } else {
            resp.setAccountFinalized(true);
        }
        return resp;
    }

    public RegisterResponse register(RegisterRequest request) {
        String regPhone = normalizeLoginPhone(request.getPhone());
        if (regPhone.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telefone inválido");
        }
        if (phoneAlreadyRegistered(regPhone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma conta com este telefone");
        }
        UserEntity user = new UserEntity();
        user.setPhone(regPhone);
        user.setPasswordHash(request.getPassword());
        user.setFullName(request.getFullName());
        user.setProvince(request.getProvince());
        user.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        user = userRepository.save(user);

        licenseService.createTrialLicenseForUser(user.getId(), trialDays);

        boolean messageSent = notificationService.sendAccountCreatedConfirmation(user.getPhone(), user.getFullName());

        String licStatus = licenseService.findByUserId(user.getId()).map(l -> l.getStatus()).orElse("pending");
        UserResponse resp = UserResponse.fromEntity(user, licStatus);
        resp.setAccountFinalized(licenseService.isLicensePaid(user.getId()));
        licenseService.applyLicenseExpiryToUserResponse(user.getId(), resp);
        return RegisterResponse.of(resp, messageSent);
    }

    public void changePassword(UUID userId, ChangePasswordRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (!user.getPasswordHash().equals(request.getCurrentPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha atual incorreta");
        }
        user.setPasswordHash(request.getNewPassword());
        userRepository.save(user);
    }

    /**
     * Inicia o fluxo de alteração de telefone: valida a senha actual, gera OTP e envia por SMS.
     */
    public void startPhoneChange(UUID userId, String currentPassword, String newPhone) {
        if (newPhone == null || newPhone.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Novo contacto é obrigatório");
        }
        String normalized = normalizeLoginPhone(newPhone);
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Novo contacto inválido");
        }
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (!user.getPasswordHash().equals(currentPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha atual incorreta");
        }
        if (phoneAlreadyRegistered(normalized)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma conta com este contacto");
        }
        PhoneChangeRequestEntity req = new PhoneChangeRequestEntity();
        req.setUserId(userId);
        req.setNewPhone(normalized);
        String code = generateOtp();
        req.setCode(code);
        req.setExpiresAt(java.time.Instant.now().plusSeconds(600)); // 10 minutos
        phoneChangeRequestRepository.save(req);
        smsService.sendOtp(normalized, code);
    }

    /**
     * Confirma a alteração de telefone com base no OTP recebido por SMS.
     */
    public void confirmPhoneChange(UUID userId, String newPhone, String code) {
        if (newPhone == null || newPhone.isBlank() || code == null || code.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contacto e código são obrigatórios");
        }
        String normalized = normalizeLoginPhone(newPhone);
        PhoneChangeRequestEntity req = phoneChangeRequestRepository
            .findTopByUserIdAndNewPhoneAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                userId, normalized, java.time.Instant.now())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pedido de alteração não encontrado ou expirado"));
        if (!req.getCode().equals(code.trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código inválido");
        }
        if (phoneAlreadyRegistered(normalized)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma conta com este contacto");
        }
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        user.setPhone(normalized);
        userRepository.save(user);
        req.setUsed(true);
        phoneChangeRequestRepository.save(req);
    }

    private String generateOtp() {
        java.security.SecureRandom r = new java.security.SecureRandom();
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(r.nextInt(10));
        }
        return sb.toString();
    }

    public UserResponse getProfile(UUID userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        // Admin não precisa de licença paga
        boolean isAdmin = user.isAdmin();
        String licenseStatus = isAdmin ? "paid" : licenseService.findByUserId(userId).map(l -> l.getStatus()).orElse("pending");
        UserResponse resp = UserResponse.fromEntity(user, licenseStatus);
        if (!isAdmin) {
            resp.setAccountFinalized(licenseService.isLicensePaid(userId));
            licenseService.applyLicenseExpiryToUserResponse(userId, resp);
        } else {
            resp.setAccountFinalized(true);
        }
        return resp;
    }

    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (request.getFullName() != null) {
            String v = request.getFullName().trim();
            user.setFullName(v.isEmpty() ? null : v);
        }
        if (request.getDocumentType() != null) {
            String v = request.getDocumentType().trim();
            user.setDocumentType(v.isEmpty() ? null : v);
        }
        if (request.getDocumentNumber() != null) {
            String v = request.getDocumentNumber().trim();
            user.setDocumentNumber(v.isEmpty() ? null : v);
        }
        if (request.getProvince() != null) {
            String v = request.getProvince().trim();
            user.setProvince(v.isEmpty() ? null : v);
        }
        if (request.getEmail() != null) {
            String e = request.getEmail().trim();
            user.setEmail(e.isEmpty() ? null : e);
        }
        user = userRepository.save(user);
        boolean isAdmin = user.isAdmin();
        String licenseStatus = isAdmin ? "paid" : licenseService.findByUserId(userId).map(l -> l.getStatus()).orElse("pending");
        UserResponse resp = UserResponse.fromEntity(user, licenseStatus);
        if (!isAdmin) {
            resp.setAccountFinalized(licenseService.isLicensePaid(userId));
            licenseService.applyLicenseExpiryToUserResponse(userId, resp);
        } else {
            resp.setAccountFinalized(true);
        }
        return resp;
    }
}
