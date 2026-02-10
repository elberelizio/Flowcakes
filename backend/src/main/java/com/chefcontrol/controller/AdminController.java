package com.chefcontrol.controller;

import com.chefcontrol.config.CurrentUserId;
import com.chefcontrol.dto.AdminConfirmPaymentRequest;
import com.chefcontrol.dto.AdminOrderResponse;
import com.chefcontrol.dto.AdminStatsResponse;
import com.chefcontrol.dto.AdminUserRow;
import com.chefcontrol.dto.RevenueByMonthDto;
import com.chefcontrol.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> stats(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(adminService.getStats(userId));
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserRow>> users(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(adminService.getUsers(userId));
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

    @GetMapping("/revenue-by-month")
    public ResponseEntity<List<RevenueByMonthDto>> revenueByMonth(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(adminService.getRevenueByMonth(userId));
    }
}
