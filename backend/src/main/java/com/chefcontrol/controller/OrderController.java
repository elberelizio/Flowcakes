package com.chefcontrol.controller;

import com.chefcontrol.config.CurrentUserId;
import com.chefcontrol.dto.OrderRequest;
import com.chefcontrol.dto.OrderResponse;
import com.chefcontrol.dto.RevenueByMonthDto;
import com.chefcontrol.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> list(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(orderService.findAllByUserId(userId));
    }

    @GetMapping("/revenue-by-month")
    public ResponseEntity<List<RevenueByMonthDto>> revenueByMonth(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(orderService.getRevenueByMonth(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> get(@PathVariable UUID id, @CurrentUserId UUID userId) {
        return ResponseEntity.ok(orderService.findById(id, userId));
    }

    @PostMapping
    public ResponseEntity<OrderResponse> create(
            @CurrentUserId UUID userId,
            @Valid @RequestBody OrderRequest request) {
        return ResponseEntity.ok(orderService.create(userId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderResponse> update(
            @PathVariable UUID id,
            @CurrentUserId UUID userId,
            @Valid @RequestBody OrderRequest request) {
        return ResponseEntity.ok(orderService.update(id, userId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @CurrentUserId UUID userId) {
        orderService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
