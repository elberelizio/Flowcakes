package com.chefcontrol.controller;

import com.chefcontrol.config.CurrentUserId;
import com.chefcontrol.dto.AccessLogDto;
import com.chefcontrol.dto.AccessLogUsersPageDto;
import com.chefcontrol.dto.BlockedAccountRowDto;
import com.chefcontrol.dto.SecurityEventDto;
import jakarta.servlet.http.HttpServletRequest;
import com.chefcontrol.dto.AdminConfirmPaymentRequest;
import com.chefcontrol.dto.AdminOrderResponse;
import com.chefcontrol.dto.ExtendLicenseRequest;
import com.chefcontrol.dto.AdminStatsResponse;
import com.chefcontrol.dto.AdminUserDetailDto;
import com.chefcontrol.dto.AdminUpdateUserRequest;
import com.chefcontrol.dto.AdminUserRow;
import com.chefcontrol.dto.AdminRankingRowDto;
import com.chefcontrol.dto.RevenueByMonthDto;
import com.chefcontrol.dto.SystemNotificationDto;
import com.chefcontrol.dto.SystemNotificationRequest;
import com.chefcontrol.dto.LicenseExpiringUserDto;
import com.chefcontrol.dto.ApproveSimulatedPaymentRequest;
import com.chefcontrol.dto.RejectSimulatedPaymentRequest;
import com.chefcontrol.dto.SimulatedPaymentPendingDto;
import com.chefcontrol.dto.UserFeedbackDto;
import com.chefcontrol.service.AdminService;
import com.chefcontrol.service.ContactMessageService;
import com.chefcontrol.service.LandingSuggestionService;
import com.chefcontrol.service.LicenseService;
import com.chefcontrol.service.SystemNotificationService;
import com.chefcontrol.service.TreasuryService;
import com.chefcontrol.service.UserFeedbackService;
import com.chefcontrol.dto.AdminAlertsDto;
import com.chefcontrol.dto.AdminLoginSummaryDto;
import com.chefcontrol.dto.OperationalExpenseDto;
import com.chefcontrol.dto.OperationalExpenseRequest;
import com.chefcontrol.dto.TreasuryBillingEntryDto;
import com.chefcontrol.dto.TreasuryBillingPeriodDto;
import com.chefcontrol.dto.TreasuryCashReserveRequest;
import com.chefcontrol.dto.TreasuryInvestmentDto;
import com.chefcontrol.dto.TreasuryInvestmentRequest;
import com.chefcontrol.dto.TreasurySettingsRequest;
import com.chefcontrol.dto.TreasurySuggestionApproveRequest;
import com.chefcontrol.dto.TreasurySuggestionDto;
import com.chefcontrol.dto.TreasurySummaryDto;
import com.chefcontrol.dto.ContactMessageAdminDto;
import com.chefcontrol.dto.LandingSuggestionDto;
import com.chefcontrol.dto.UserActivityHistoryPageDto;
import com.chefcontrol.dto.UserSessionDetailDto;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;
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
    private final LandingSuggestionService landingSuggestionService;
    private final ContactMessageService contactMessageService;
    private final TreasuryService treasuryService;

    public AdminController(
        AdminService adminService,
        LicenseService licenseService,
        SystemNotificationService notificationService,
        UserFeedbackService feedbackService,
        LandingSuggestionService landingSuggestionService,
        ContactMessageService contactMessageService,
        TreasuryService treasuryService
    ) {
        this.adminService = adminService;
        this.licenseService = licenseService;
        this.notificationService = notificationService;
        this.feedbackService = feedbackService;
        this.landingSuggestionService = landingSuggestionService;
        this.contactMessageService = contactMessageService;
        this.treasuryService = treasuryService;
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

    @GetMapping("/users/{targetUserId}/sessions")
    public ResponseEntity<List<UserSessionDetailDto>> userSessions(
            @CurrentUserId UUID userId,
            @PathVariable UUID targetUserId,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(adminService.getUserSessions(userId, targetUserId, limit));
    }

    @GetMapping("/users/{targetUserId}/activity-history")
    public ResponseEntity<UserActivityHistoryPageDto> userActivityHistory(
            @CurrentUserId UUID userId,
            @PathVariable UUID targetUserId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(adminService.getUserActivityHistory(userId, targetUserId, from, to, type, page, size));
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
            @PathVariable UUID paymentId,
            @RequestBody(required = false) ApproveSimulatedPaymentRequest body) {
        String operatorRef = body != null && body.getOperatorTransactionRef() != null
            ? body.getOperatorTransactionRef() : "";
        adminService.approveSimulatedPayment(adminUserId, paymentId, operatorRef);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/simulated-payments/{paymentId}/reject")
    public ResponseEntity<Map<String, Boolean>> rejectSimulatedPayment(
            @CurrentUserId UUID adminUserId,
            @PathVariable UUID paymentId,
            @RequestBody(required = false) RejectSimulatedPaymentRequest body) {
        String reason = body != null && body.getReason() != null ? body.getReason() : "";
        adminService.rejectSimulatedPayment(adminUserId, paymentId, reason);
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
    public ResponseEntity<AdminUserRow> unblockUser(
            @CurrentUserId UUID adminUserId,
            @PathVariable UUID targetUserId,
            HttpServletRequest request) {
        return ResponseEntity.ok(adminService.unblockUser(
                adminUserId,
                targetUserId,
                clientIp(request),
                request.getHeader("User-Agent")));
    }

    @GetMapping("/security-events")
    public ResponseEntity<List<SecurityEventDto>> securityEvents(
            @CurrentUserId UUID userId,
            @RequestParam(defaultValue = "200") int limit) {
        return ResponseEntity.ok(adminService.getSecurityEvents(userId, limit));
    }

    @GetMapping("/blocked-accounts")
    public ResponseEntity<List<BlockedAccountRowDto>> blockedAccounts(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(adminService.getBlockedAccounts(userId));
    }

    private static String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @GetMapping("/revenue-by-month")
    public ResponseEntity<List<RevenueByMonthDto>> revenueByMonth(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(adminService.getRevenueByMonth(userId));
    }

    @GetMapping("/license-revenue-by-month")
    public ResponseEntity<List<RevenueByMonthDto>> licenseRevenueByMonth(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(adminService.getLicenseRevenueByMonth(userId));
    }

    @GetMapping("/ranking")
    public ResponseEntity<List<AdminRankingRowDto>> ranking(
            @CurrentUserId UUID userId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(adminService.getRanking(userId, limit));
    }

    @GetMapping("/access-logs")
    public ResponseEntity<List<AccessLogDto>> accessLogs(@CurrentUserId UUID userId, @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(adminService.getAccessLogs(userId, limit));
    }

    @GetMapping("/access-logs/users")
    public ResponseEntity<AccessLogUsersPageDto> accessLogUsers(
            @CurrentUserId UUID userId,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(adminService.getAccessLogUsersPage(userId, search, page, size));
    }

    /** Avisos publicados para utilizadores (manutenção, mensagens gerais). */
    @GetMapping("/notifications")
    public ResponseEntity<List<SystemNotificationDto>> notifications(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(notificationService.listBroadcastsForAdmin(userId));
    }

    /** Alertas internos: pagamentos simulados, operações automáticas. */
    @GetMapping("/notifications/operations")
    public ResponseEntity<List<SystemNotificationDto>> operationNotifications(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(notificationService.listOperationAlertsForAdmin(userId));
    }

    @PostMapping("/notifications")
    public ResponseEntity<SystemNotificationDto> createNotification(@CurrentUserId UUID userId, @RequestBody SystemNotificationRequest body) {
        return ResponseEntity.ok(notificationService.create(userId, body));
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

    @GetMapping("/landing-suggestions")
    public ResponseEntity<List<LandingSuggestionDto>> landingSuggestions(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(landingSuggestionService.listForAdmin(userId));
    }

    @GetMapping("/contact-messages")
    public ResponseEntity<List<ContactMessageAdminDto>> contactMessages(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(contactMessageService.listForAdmin(userId));
    }

    @GetMapping("/login-summary")
    public ResponseEntity<AdminLoginSummaryDto> loginSummary(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(treasuryService.getLoginSummary(userId));
    }

    @GetMapping("/alerts")
    public ResponseEntity<AdminAlertsDto> alerts(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(treasuryService.getAlerts(userId));
    }

    @GetMapping("/treasury/summary")
    public ResponseEntity<TreasurySummaryDto> treasurySummary(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(treasuryService.getSummary(userId));
    }

    @GetMapping("/treasury/billing")
    public ResponseEntity<List<TreasuryBillingEntryDto>> treasuryBilling(
            @CurrentUserId UUID userId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(treasuryService.listBilling(userId, year, month));
    }

    @GetMapping("/treasury/billing/periods")
    public ResponseEntity<List<TreasuryBillingPeriodDto>> treasuryBillingPeriods(
            @CurrentUserId UUID userId,
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(treasuryService.listBillingPeriods(userId, year));
    }

    @PutMapping("/treasury/settings")
    public ResponseEntity<Map<String, Boolean>> updateTreasurySettings(
            @CurrentUserId UUID userId,
            @Valid @RequestBody TreasurySettingsRequest body) {
        treasuryService.updateSettings(userId, body);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/treasury/investments")
    public ResponseEntity<List<TreasuryInvestmentDto>> treasuryInvestments(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(treasuryService.listInvestments(userId));
    }

    @PostMapping("/treasury/investments")
    public ResponseEntity<TreasuryInvestmentDto> createTreasuryInvestment(
            @CurrentUserId UUID userId,
            @Valid @RequestBody TreasuryInvestmentRequest body) {
        return ResponseEntity.ok(treasuryService.createInvestment(userId, body));
    }

    @DeleteMapping("/treasury/investments/{investmentId}")
    public ResponseEntity<Void> deleteTreasuryInvestment(
            @CurrentUserId UUID userId,
            @PathVariable UUID investmentId) {
        treasuryService.deleteInvestment(userId, investmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/treasury/suggestions")
    public ResponseEntity<List<TreasurySuggestionDto>> treasurySuggestions(
            @CurrentUserId UUID userId,
            @RequestParam(defaultValue = "false") boolean refresh) {
        return ResponseEntity.ok(treasuryService.listSuggestions(userId, refresh));
    }

    @PostMapping("/treasury/suggestions/{suggestionId}/approve")
    public ResponseEntity<Map<String, Boolean>> approveTreasurySuggestion(
            @CurrentUserId UUID userId,
            @PathVariable UUID suggestionId,
            @RequestBody(required = false) TreasurySuggestionApproveRequest body) {
        treasuryService.approveSuggestion(userId, suggestionId,
            body != null ? body.getAllocations() : null);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/treasury/suggestions/{suggestionId}/reject")
    public ResponseEntity<Map<String, Boolean>> rejectTreasurySuggestion(
            @CurrentUserId UUID userId,
            @PathVariable UUID suggestionId) {
        treasuryService.rejectSuggestion(userId, suggestionId);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PutMapping("/treasury/cash-reserve")
    public ResponseEntity<Map<String, Boolean>> updateTreasuryCashReserve(
            @CurrentUserId UUID userId,
            @Valid @RequestBody TreasuryCashReserveRequest body) {
        treasuryService.updateCashReserve(userId, body);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/treasury/expenses")
    public ResponseEntity<List<OperationalExpenseDto>> treasuryExpenses(
            @CurrentUserId UUID userId,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(treasuryService.listExpenses(userId, category));
    }

    @PostMapping("/treasury/expenses")
    public ResponseEntity<OperationalExpenseDto> createTreasuryExpense(
            @CurrentUserId UUID userId,
            @Valid @RequestBody OperationalExpenseRequest body) {
        return ResponseEntity.ok(treasuryService.createExpense(userId, body));
    }

    @DeleteMapping("/treasury/expenses/{expenseId}")
    public ResponseEntity<Void> deleteTreasuryExpense(
            @CurrentUserId UUID userId,
            @PathVariable UUID expenseId) {
        treasuryService.deleteExpense(userId, expenseId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/treasury/maintenance-done")
    public ResponseEntity<Map<String, Boolean>> recordMaintenance(@CurrentUserId UUID userId) {
        treasuryService.recordMaintenance(userId);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
