package com.chefcontrol.controller;

import com.chefcontrol.config.CurrentUserId;
import com.chefcontrol.config.SessionConfig;
import com.chefcontrol.dto.*;
import com.chefcontrol.service.AuthService;
import com.chefcontrol.service.AccessLogService;
import com.chefcontrol.service.LicenseService;
import com.chefcontrol.service.StoreSettingsService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final LicenseService licenseService;
    private final AccessLogService accessLogService;
    private final StoreSettingsService storeSettingsService;

    public AuthController(AuthService authService, LicenseService licenseService, AccessLogService accessLogService, StoreSettingsService storeSettingsService) {
        this.authService = authService;
        this.licenseService = licenseService;
        this.accessLogService = accessLogService;
        this.storeSettingsService = storeSettingsService;
    }

    @PostMapping(value = {"/login", "/login/"}, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse response) {
        UserResponse user = authService.login(request);
        accessLogService.logLogin(user.getId(), user.getPhone(), user.getFullName(), Boolean.TRUE.equals(user.getAdmin()), getClientIp(httpRequest), httpRequest.getHeader("User-Agent"));
        UUID sessionId = SessionConfig.createSession(user.getId());
        addSessionCookie(response, sessionId);
        return ResponseEntity.ok(user);
    }

    @PostMapping(value = {"/register", "/register/"}, consumes = MediaType.APPLICATION_JSON_VALUE)
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

    @PostMapping("/change-phone/request")
    public ResponseEntity<Void> startPhoneChange(
            @CurrentUserId UUID userId,
            @RequestBody java.util.Map<String, String> body) {
        String currentPassword = body != null ? body.get("currentPassword") : null;
        String newPhone = body != null ? body.get("newPhone") : null;
        authService.startPhoneChange(userId, currentPassword, newPhone);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/change-phone/confirm")
    public ResponseEntity<Void> confirmPhoneChange(
            @CurrentUserId UUID userId,
            @RequestBody java.util.Map<String, String> body) {
        String newPhone = body != null ? body.get("newPhone") : null;
        String code = body != null ? body.get("code") : null;
        authService.confirmPhoneChange(userId, newPhone, code);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/store-settings")
    public ResponseEntity<StoreSettingsDto> storeSettings(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(storeSettingsService.getForUser(userId));
    }

    @PutMapping("/store-settings")
    public ResponseEntity<StoreSettingsDto> updateStoreSettings(
            @CurrentUserId UUID userId,
            @Valid @RequestBody StoreSettingsRequest request) {
        return ResponseEntity.ok(storeSettingsService.update(userId, request));
    }

    @GetMapping("/license-status")
    public ResponseEntity<LicenseStatusResponse> licenseStatus(@CurrentUserId UUID userId) {
        LicenseStatusResponse r = new LicenseStatusResponse();
        licenseService.fillLicenseStatusResponse(userId, r);
        return ResponseEntity.ok(r);
    }

    @GetMapping("/license-payments")
    public ResponseEntity<List<com.chefcontrol.dto.LicensePaymentDto>> licensePayments(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(licenseService.listLicensePaymentsForUser(userId));
    }

    private void addSessionCookie(HttpServletResponse response, UUID sessionId) {
        // Usar ResponseCookie para melhor suporte a CORS e SameSite
        ResponseCookie cookie = ResponseCookie.from(SessionConfig.COOKIE_NAME, sessionId.toString())
                .httpOnly(true)
                .secure(false) // true em produção com HTTPS
                .path("/")
                .maxAge(86400) // 24 horas
                .sameSite("Lax") // Lax para funcionar com CORS em localhost
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearSessionCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(SessionConfig.COOKIE_NAME, "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
