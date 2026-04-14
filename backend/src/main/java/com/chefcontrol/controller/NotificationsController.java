package com.chefcontrol.controller;

import com.chefcontrol.dto.SystemNotificationDto;
import com.chefcontrol.service.SystemNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
    public ResponseEntity<List<SystemNotificationDto>> getActive() {
        return ResponseEntity.ok(notificationService.getActiveForUser());
    }
}
