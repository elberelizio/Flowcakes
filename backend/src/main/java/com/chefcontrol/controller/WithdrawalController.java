package com.chefcontrol.controller;

import com.chefcontrol.config.CurrentUserId;
import com.chefcontrol.dto.WithdrawalRequest;
import com.chefcontrol.dto.WithdrawalResponse;
import com.chefcontrol.dto.WithdrawalSummaryDto;
import com.chefcontrol.service.WithdrawalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/withdrawals")
public class WithdrawalController {

    private final WithdrawalService withdrawalService;

    public WithdrawalController(WithdrawalService withdrawalService) {
        this.withdrawalService = withdrawalService;
    }

    @GetMapping
    public ResponseEntity<List<WithdrawalResponse>> list(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(withdrawalService.findAllByUserId(userId));
    }

    @GetMapping("/total")
    public ResponseEntity<Map<String, BigDecimal>> total(@CurrentUserId UUID userId) {
        BigDecimal total = withdrawalService.getTotalWithdrawnByUserId(userId);
        return ResponseEntity.ok(Map.of("total", total));
    }

    @GetMapping("/summary")
    public ResponseEntity<WithdrawalSummaryDto> summary(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(withdrawalService.getSummary(userId));
    }

    @PostMapping
    public ResponseEntity<WithdrawalResponse> create(
            @CurrentUserId UUID userId,
            @Valid @RequestBody WithdrawalRequest request) {
        return ResponseEntity.ok(withdrawalService.create(userId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @CurrentUserId UUID userId) {
        withdrawalService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
