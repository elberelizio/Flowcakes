package com.chefcontrol.controller;

import com.chefcontrol.config.CurrentUserId;
import com.chefcontrol.dto.AccessLogDto;
import com.chefcontrol.dto.AdminConfirmPaymentRequest;
import com.chefcontrol.dto.AdminOrderResponse;
import com.chefcontrol.dto.ExtendLicenseRequest;
import com.chefcontrol.dto.AdminStatsResponse;
import com.chefcontrol.dto.AdminUserDetailDto;
import com.chefcontrol.dto.AdminUpdateUserRequest;
import com.chefcontrol.dto.AdminUserRow;
import com.chefcontrol.dto.RevenueByMonthDto;
import com.chefcontrol.dto.SystemNotificationDto;
import com.chefcontrol.dto.SystemNotificationRequest;
import com.chefcontrol.dto.LicenseExpiringUserDto;
import com.chefcontrol.dto.SimulatedPaymentPendingDto;
import com.chefcontrol.dto.UserFeedbackDto;
import com.chefcontrol.service.AdminService;
import com.chefcontrol.service.LicenseService;
import com.chefcontrol.service.SystemNotificationService;
import com.chefcontrol.service.UserFeedbackService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final LicenseService licenseService;
    private final SystemNotificationService notificationService;
    private final UserFeedbackService feedbackService;

    public AdminController(AdminService adminService, LicenseService licenseService, SystemNotificationService notificationService, UserFeedbackService feedbackService) {
        this.adminService = adminService;
        this.licenseService = licenseService;
        this.notificationService = notificationService;
        this.feedbackService = feedbackService;
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> stats(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(adminService.getStats(userId));
    }

    @GetMapping("/licenses-expiring")
    public ResponseEntity<List<LicenseExpiringUserDto>> licensesExpiring(
            @CurrentUserId UUID userId,
            @RequestParam(defaultValue = "10") int days) {
        return ResponseEntity.ok(licenseService.findLicensesExpiringWithinDays(days, userId));
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserRow>> users(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(adminService.getUsers(userId));
    }

    @GetMapping("/users/{targetUserId}")
    public ResponseEntity<AdminUserDetailDto> userDetail(@CurrentUserId UUID userId, @PathVariable UUID targetUserId) {
        return ResponseEntity.ok(adminService.getUserDetail(userId, targetUserId));
    }

    @PutMapping("/users/{targetUserId}")
    public ResponseEntity<AdminUserDetailDto> updateUser(
            @CurrentUserId UUID userId,
            @PathVariable UUID targetUserId,
            @Valid @RequestBody AdminUpdateUserRequest body) {
        return ResponseEntity.ok(adminService.updateUser(userId, targetUserId, body));
    }

    @GetMapping("/users/{targetUserId}/access-logs")
    public ResponseEntity<List<AccessLogDto>> userAccessLogs(
            @CurrentUserId UUID userId,
            @PathVariable UUID targetUserId,
            @RequestParam(defaultValue = "30") int limit) {
        return ResponseEntity.ok(adminService.getUserAccessLogs(userId, targetUserId, limit));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<AdminOrderResponse>> orders(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(adminService.getOrdersForAdmin(userId));
    }

    @PostMapping("/users/{targetUserId}/confirm-payment")
    public ResponseEntity<AdminUserRow> confirmPayment(
            @CurrentUserId UUID adminUserId,
            @PathVariable UUID targetUserId,
            @Valid @RequestBody AdminConfirmPaymentRequest body) {
        int months = body.getDurationMonths() >= 1 && body.getDurationMonths() <= 12 ? body.getDurationMonths() : 1;
        return ResponseEntity.ok(adminService.confirmPaymentForUser(adminUserId, targetUserId, body.getEMolaTransactionId(), months));
    }

    @GetMapping("/simulated-payments/pending")
    public ResponseEntity<List<SimulatedPaymentPendingDto>> pendingSimulatedPayments(@CurrentUserId UUID adminUserId) {
        return ResponseEntity.ok(adminService.listPendingSimulatedPayments(adminUserId));
    }

    @PostMapping("/simulated-payments/{paymentId}/approve")
    public ResponseEntity<Map<String, Boolean>> approveSimulatedPayment(
            @CurrentUserId UUID adminUserId,
            @PathVariable UUID paymentId) {
        adminService.approveSimulatedPayment(adminUserId, paymentId);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/users/{targetUserId}/extend-license")
    public ResponseEntity<AdminUserRow> extendLicense(
            @CurrentUserId UUID adminUserId,
            @PathVariable UUID targetUserId,
            @RequestBody ExtendLicenseRequest body) {
        int months = body.getMonths() >= 1 && body.getMonths() <= 24 ? body.getMonths() : 1;
        return ResponseEntity.ok(adminService.extendLicenseForUser(adminUserId, targetUserId, months));
    }

    @PostMapping("/users/{targetUserId}/block")
    public ResponseEntity<AdminUserRow> blockUser(@CurrentUserId UUID adminUserId, @PathVariable UUID targetUserId) {
        return ResponseEntity.ok(adminService.blockUser(adminUserId, targetUserId));
    }

    @PostMapping("/users/{targetUserId}/reject")
    public ResponseEntity<AdminUserRow> rejectUser(@CurrentUserId UUID adminUserId, @PathVariable UUID targetUserId) {
        return ResponseEntity.ok(adminService.rejectUser(adminUserId, targetUserId));
    }

    @PostMapping("/users/{targetUserId}/unblock")
    public ResponseEntity<AdminUserRow> unblockUser(@CurrentUserId UUID adminUserId, @PathVariable UUID targetUserId) {
        return ResponseEntity.ok(adminService.unblockUser(adminUserId, targetUserId));
    }

    @GetMapping("/revenue-by-month")
    public ResponseEntity<List<RevenueByMonthDto>> revenueByMonth(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(adminService.getRevenueByMonth(userId));
    }

    @GetMapping("/access-logs")
    public ResponseEntity<List<AccessLogDto>> accessLogs(@CurrentUserId UUID userId, @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(adminService.getAccessLogs(userId, limit));
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<SystemNotificationDto>> notifications(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(notificationService.listForAdmin(userId));
    }

    @PostMapping("/notifications")
    public ResponseEntity<SystemNotificationDto> createNotification(@CurrentUserId UUID userId, @Valid @RequestBody SystemNotificationRequest body) {
        return ResponseEntity.ok(notificationService.create(userId, body.getTitle(), body.getMessage(), body.getType()));
    }

    @PatchMapping("/notifications/{id}/deactivate")
    public ResponseEntity<Void> deactivateNotification(@CurrentUserId UUID userId, @PathVariable java.util.UUID id) {
        notificationService.deactivate(userId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/feedback")
    public ResponseEntity<List<UserFeedbackDto>> feedback(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(feedbackService.listForAdmin(userId));
    }

    @GetMapping("/feedback/average")
    public ResponseEntity<Double> feedbackAverage(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(feedbackService.getAverageRating(userId));
    }
}
