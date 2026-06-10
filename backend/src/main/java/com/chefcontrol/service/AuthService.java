package com.Flow Cakes.service;

import com.Flow Cakes.dto.*;
import com.Flow Cakes.entity.UserEntity;
import com.Flow Cakes.exception.InvalidPasswordException;
import com.Flow Cakes.repository.UserRepository;
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
    private final AccountSecurityService accountSecurityService;
    private final SecurityEventService securityEventService;
    private final SystemNotificationService systemNotificationService;

    @Value("${app.trial-days:14}")
    private int trialDays;

    public AuthService(
            UserRepository userRepository,
            LicenseService licenseService,
            NotificationService notificationService,
            AccountSecurityService accountSecurityService,
            SecurityEventService securityEventService,
            SystemNotificationService systemNotificationService
    ) {
        this.userRepository = userRepository;
        this.licenseService = licenseService;
        this.notificationService = notificationService;
        this.accountSecurityService = accountSecurityService;
        this.securityEventService = securityEventService;
        this.systemNotificationService = systemNotificationService;
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

    public UserResponse login(LoginRequest request, String ipAddress, String userAgent) {
        String phone = normalizeLoginPhone(request.getPhone());
        if (phone.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telefone inválido");
        }
        Optional<UserEntity> userOpt = findUserByNormalizedPhone(phone);
        if (userOpt.isEmpty()) {
            securityEventService.log(
                    SecurityEventService.EVENT_LOGIN_FAILED_UNKNOWN_PHONE,
                    null,
                    phone,
                    null,
                    "Tentativa de login com contacto não registado",
                    ipAddress,
                    userAgent
            );
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Conta não encontrada");
        }
        UserEntity user = userOpt.get();
        if (user.isBlocked()) {
            securityEventService.log(
                    SecurityEventService.EVENT_LOGIN_BLOCKED_ATTEMPT,
                    user,
                    "Tentativa de login em conta bloqueada",
                    ipAddress,
                    userAgent
            );
            throw accountSecurityService.blockedException();
        }
        if (!user.getPasswordHash().equals(request.getPassword())) {
            try {
                accountSecurityService.registerFailedPassword(
                        user,
                        SecurityEventService.EVENT_LOGIN_FAILED_PASSWORD,
                        "Login com senha incorrecta",
                        ipAddress,
                        userAgent
                );
            } catch (InvalidPasswordException e) {
                throw e;
            }
            throw accountSecurityService.blockedException();
        }

        accountSecurityService.resetFailedAttempts(user);
        securityEventService.log(
                SecurityEventService.EVENT_LOGIN_SUCCESS,
                user,
                "Login com sucesso",
                ipAddress,
                userAgent
        );

        boolean isAdmin = user.isAdmin();
        licenseService.assertLoginAllowed(user.getId(), isAdmin);
        String licenseStatus = isAdmin ? "paid" : licenseService.findByUserId(user.getId()).map(l -> l.getStatus()).orElse("pending");
        UserResponse resp = UserResponse.fromEntity(user, licenseStatus);
        licenseService.enrichUserAccessFlags(user.getId(), resp);
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
        notifyAdminNewRegistration(user);

        boolean messageSent = notificationService.sendAccountCreatedConfirmation(user.getPhone(), user.getFullName());

        String licStatus = licenseService.findByUserId(user.getId()).map(l -> l.getStatus()).orElse("pending");
        UserResponse resp = UserResponse.fromEntity(user, licStatus);
        licenseService.enrichUserAccessFlags(user.getId(), resp);
        return RegisterResponse.of(resp, messageSent);
    }

    public void completeOnboarding(UUID userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (user.isAdmin()) {
            return;
        }
        if (user.getOnboardingCompletedAt() == null) {
            user.setOnboardingCompletedAt(java.time.Instant.now());
            userRepository.save(user);
        }
    }

    private void notifyAdminNewRegistration(UserEntity user) {
        String name = user.getFullName() != null && !user.getFullName().isBlank()
                ? user.getFullName()
                : user.getPhone();
        String message = String.format(
                "Nova conta registada.%nNome: %s%nTelefone: %s%nProvíncia: %s%n"
                    + "Em «Novos utilizadores» pode rever pendentes e licenças de teste.",
                name,
                user.getPhone(),
                user.getProvince() != null ? user.getProvince() : "—"
        );
        systemNotificationService.createOperationAlert(
                "Novo registo: " + name,
                message,
                "info",
                "registration"
        );
    }

    public void changePassword(UUID userId, ChangePasswordRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        accountSecurityService.assertNotBlocked(user);
        if (!user.getPasswordHash().equals(request.getCurrentPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha atual incorreta");
        }
        user.setPasswordHash(request.getNewPassword());
        userRepository.save(user);
    }

    /**
     * Altera o contacto de login após validar a senha actual.
     * O novo número não pode estar registado. Máximo 4 tentativas de senha incorrecta.
     */
    public UserResponse changePhone(
            UUID userId,
            String currentPassword,
            String newPhone,
            String ipAddress,
            String userAgent
    ) {
        if (newPhone == null || newPhone.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Novo contacto é obrigatório");
        }
        String normalized = normalizeLoginPhone(newPhone);
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Novo contacto inválido");
        }
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        accountSecurityService.assertNotBlocked(user);

        String currentNormalized = normalizeLoginPhone(user.getPhone());
        if (normalized.equals(currentNormalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O novo contacto deve ser diferente do actual");
        }
        if (phoneAlreadyRegistered(normalized)) {
            securityEventService.log(
                    SecurityEventService.EVENT_PHONE_CHANGE_REJECTED_REGISTERED,
                    user,
                    "Novo contacto já registado: " + normalized,
                    ipAddress,
                    userAgent
            );
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este contacto já está registado noutra conta. Não é possível utilizá-lo.");
        }

        if (!user.getPasswordHash().equals(currentPassword)) {
            try {
                accountSecurityService.registerFailedPassword(
                        user,
                        SecurityEventService.EVENT_PHONE_CHANGE_FAILED_PASSWORD,
                        "Alteração de contacto com senha incorrecta",
                        ipAddress,
                        userAgent
                );
            } catch (InvalidPasswordException e) {
                throw e;
            }
            throw accountSecurityService.blockedException();
        }

        user.setPhone(normalized);
        accountSecurityService.resetFailedAttempts(user);
        user = userRepository.save(user);

        securityEventService.log(
                SecurityEventService.EVENT_PHONE_CHANGE_SUCCESS,
                user,
                "Contacto alterado para " + normalized,
                ipAddress,
                userAgent
        );

        boolean isAdmin = user.isAdmin();
        String licenseStatus = isAdmin ? "paid" : licenseService.findByUserId(userId).map(l -> l.getStatus()).orElse("pending");
        UserResponse resp = UserResponse.fromEntity(user, licenseStatus);
        licenseService.enrichUserAccessFlags(userId, resp);
        return resp;
    }

    public UserResponse getProfile(UUID userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        boolean isAdmin = user.isAdmin();
        String licenseStatus = isAdmin ? "paid" : licenseService.findByUserId(userId).map(l -> l.getStatus()).orElse("pending");
        UserResponse resp = UserResponse.fromEntity(user, licenseStatus);
        licenseService.enrichUserAccessFlags(userId, resp);
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
        licenseService.enrichUserAccessFlags(userId, resp);
        return resp;
    }
}
