package com.chefcontrol.service;

import com.chefcontrol.dto.*;
import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final LicenseService licenseService;
    private final NotificationService notificationService;

    public AuthService(UserRepository userRepository, LicenseService licenseService, NotificationService notificationService) {
        this.userRepository = userRepository;
        this.licenseService = licenseService;
        this.notificationService = notificationService;
    }

    /** Normaliza telefone: só dígitos; se começar com 258 e tiver 12 dígitos (Moçambique), usa os últimos 9. */
    private static String normalizePhone(String phone) {
        if (phone == null) return "";
        String digits = phone.replaceAll("\\D", "").trim();
        if (digits.startsWith("258") && digits.length() == 12) {
            return digits.substring(3);
        }
        return digits;
    }

    public UserResponse login(LoginRequest request) {
        String phone = normalizePhone(request.getPhone());
        if (phone.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telefone inválido");
        }
        UserEntity user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conta não encontrada"));
        if (!user.getPasswordHash().equals(request.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Telefone ou senha incorretos");
        }
        // Admin não precisa de licença paga; utilizador normal usa estado da licença
        boolean isAdmin = user.isAdmin();
        String licenseStatus = isAdmin ? "paid" : licenseService.findByUserId(user.getId()).map(l -> l.getStatus()).orElse("pending");
        return UserResponse.fromEntity(user, licenseStatus);
    }

    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma conta com este telefone");
        }
        UserEntity user = new UserEntity();
        user.setPhone(request.getPhone());
        user.setPasswordHash(request.getPassword());
        user.setFullName(request.getFullName());
        user.setDocumentType(request.getDocumentType());
        user.setDocumentNumber(request.getDocumentNumber());
        user.setProvince(request.getProvince());
        user.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        user = userRepository.save(user);

        licenseService.createPendingLicenseForUser(user.getId());

        boolean messageSent = notificationService.sendAccountCreatedConfirmation(user.getPhone(), user.getFullName());

        UserResponse resp = UserResponse.fromEntity(user, "pending");
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

    public UserResponse getProfile(UUID userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        // Admin não precisa de licença paga
        String licenseStatus = user.isAdmin() ? "paid" : licenseService.findByUserId(userId).map(l -> l.getStatus()).orElse("pending");
        return UserResponse.fromEntity(user, licenseStatus);
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
        String licenseStatus = user.isAdmin() ? "paid" : licenseService.findByUserId(userId).map(l -> l.getStatus()).orElse("pending");
        return UserResponse.fromEntity(user, licenseStatus);
    }
}
