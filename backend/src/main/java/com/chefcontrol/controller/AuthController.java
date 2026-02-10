package com.chefcontrol.controller;

import com.chefcontrol.config.CurrentUserId;
import com.chefcontrol.config.SessionConfig;
import com.chefcontrol.config.SessionInfo;
import com.chefcontrol.dto.*;
import com.chefcontrol.entity.UserLicenseEntity;
import com.chefcontrol.service.AuthService;
import com.chefcontrol.service.LicenseService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final LicenseService licenseService;

    public AuthController(AuthService authService, LicenseService licenseService) {
        this.authService = authService;
        this.licenseService = licenseService;
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        UserResponse user = authService.login(request);
        UUID sessionId = SessionConfig.createSession(user.getId());
        addSessionCookie(response, sessionId);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        RegisterResponse reg = authService.register(request);
        UUID sessionId = SessionConfig.createSession(reg.getUser().getId());
        addSessionCookie(response, sessionId);
        return ResponseEntity.ok(reg);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(HttpServletRequest request) {
        UUID userId = (UUID) request.getAttribute(SessionConfig.ATTR_USER_ID);
        if (userId == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        UserResponse user = authService.getProfile(userId);
        SessionInfo info = (SessionInfo) request.getAttribute(SessionConfig.ATTR_SESSION_INFO);
        if (info != null) user.setLicenseCodeValidated(info.isLicenseCodeValidated());
        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if (SessionConfig.COOKIE_NAME.equals(c.getName())) {
                    try {
                        SessionConfig.removeSession(UUID.fromString(c.getValue()));
                    } catch (Exception ignored) {}
                    break;
                }
            }
        }
        clearSessionCookie(response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> profile(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(authService.getProfile(userId));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @CurrentUserId UUID userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(authService.updateProfile(userId, request));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @CurrentUserId UUID userId,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(userId, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/license-status")
    public ResponseEntity<LicenseStatusResponse> licenseStatus(@CurrentUserId UUID userId) {
        LicenseStatusResponse r = new LicenseStatusResponse();
        r.setAmount(licenseService.getLicenseAmount());
        r.setEMolaPhone(licenseService.getEMolaPhone());
        r.setAccountFinalized(licenseService.isLicensePaid(userId));
        licenseService.findByUserId(userId).ifPresent(lic -> {
            r.setStatus(lic.getStatus());
            r.setLicenseToken(lic.getLicenseToken());
        });
        if (r.getStatus() == null) r.setStatus("pending");
        return ResponseEntity.ok(r);
    }

    @PostMapping("/validate-license-code")
    public ResponseEntity<Void> validateLicenseCode(HttpServletRequest request, @RequestBody java.util.Map<String, String> body) {
        SessionInfo info = (SessionInfo) request.getAttribute(SessionConfig.ATTR_SESSION_INFO);
        if (info == null) return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        String code = body != null ? body.get("code") : null;
        if (!licenseService.validateLicenseCode(info.getUserId(), code)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST).build();
        }
        info.setLicenseCodeValidated(true);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/confirm-payment")
    public ResponseEntity<LicenseStatusResponse> confirmPayment(
            @CurrentUserId UUID userId,
            @RequestBody(required = false) ConfirmPaymentRequest body) {
        String ref = body != null ? body.getPaymentReference() : null;
        UserLicenseEntity lic = licenseService.confirmPayment(userId, ref, 1);
        LicenseStatusResponse r = new LicenseStatusResponse();
        r.setStatus(lic.getStatus());
        r.setAmount(lic.getAmount());
        r.setEMolaPhone(licenseService.getEMolaPhone());
        r.setLicenseToken(lic.getLicenseToken());
        r.setAccountFinalized(true);
        return ResponseEntity.ok(r);
    }

    private void addSessionCookie(HttpServletResponse response, UUID sessionId) {
        Cookie cookie = new Cookie(SessionConfig.COOKIE_NAME, sessionId.toString());
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(86400);
        cookie.setSecure(false);
        response.addCookie(cookie);
    }

    private void clearSessionCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(SessionConfig.COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
}
