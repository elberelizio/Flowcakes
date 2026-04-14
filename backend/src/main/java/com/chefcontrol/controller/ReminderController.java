package com.chefcontrol.controller;

import com.chefcontrol.config.CurrentUserId;
import com.chefcontrol.dto.ReminderRequest;
import com.chefcontrol.dto.ReminderResponse;
import com.chefcontrol.service.ReminderService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

    private final ReminderService reminderService;

    public ReminderController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @GetMapping
    public ResponseEntity<List<ReminderResponse>> list(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(reminderService.findAllByUserId(userId));
    }

    @GetMapping("/by-date")
    public ResponseEntity<List<ReminderResponse>> byDate(
            @CurrentUserId UUID userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(reminderService.findByUserIdAndDeliveryDate(userId, date));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<ReminderResponse>> upcoming(
            @CurrentUserId UUID userId,
            @RequestParam(defaultValue = "7") int days) {
        LocalDate start = LocalDate.now();
        LocalDate end = start.plusDays(days);
        return ResponseEntity.ok(reminderService.findByUserIdAndDeliveryDateBetween(userId, start, end));
    }

    @PostMapping
    public ResponseEntity<ReminderResponse> create(
            @CurrentUserId UUID userId,
            @Valid @RequestBody ReminderRequest request) {
        return ResponseEntity.ok(reminderService.create(userId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReminderResponse> update(
            @PathVariable UUID id,
            @CurrentUserId UUID userId,
            @Valid @RequestBody ReminderRequest request) {
        return ResponseEntity.ok(reminderService.update(id, userId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @CurrentUserId UUID userId) {
        reminderService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
