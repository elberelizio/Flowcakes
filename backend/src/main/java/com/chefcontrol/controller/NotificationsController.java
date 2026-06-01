package com.chefcontrol.controller;

import com.chefcontrol.config.CurrentUserId;
import com.chefcontrol.dto.SystemNotificationDto;
import com.chefcontrol.service.SystemNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Notificações activas para utilizadores autenticados.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationsController {

    private final SystemNotificationService notificationService;

    public NotificationsController(SystemNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<SystemNotificationDto>> getActive(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(notificationService.getActiveForUser(userId));
    }

    @PostMapping("/{id}/dismiss")
    public ResponseEntity<Void> dismiss(@CurrentUserId UUID userId, @PathVariable UUID id) {
        notificationService.dismiss(userId, id);
        return ResponseEntity.noContent().build();
    }
}
