package com.chefcontrol.service;

import com.chefcontrol.dto.SystemNotificationDto;
import com.chefcontrol.entity.SystemNotificationEntity;
import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.repository.SystemNotificationRepository;
import com.chefcontrol.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SystemNotificationService {

    private final SystemNotificationRepository repository;
    private final UserRepository userRepository;

    public SystemNotificationService(SystemNotificationRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    public void requireAdmin(UUID userId) {
        UserEntity u = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (!u.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso reservado a administradores");
        }
    }

    public SystemNotificationDto create(UUID adminUserId, String title, String message, String type) {
        requireAdmin(adminUserId);
        SystemNotificationEntity e = new SystemNotificationEntity();
        e.setTitle(title != null ? title.trim() : "");
        e.setMessage(message != null ? message.trim() : "");
        e.setType(type != null && List.of("info", "warning", "success", "error").contains(type) ? type : "info");
        e.setCreatedBy(adminUserId);
        e.setActive(true);
        e = repository.save(e);
        return toDto(e);
    }

    /**
     * Alerta criado pelo sistema (sem sessão de admin). Visível na lista de notificações dos administradores.
     */
    public void createSystemAlert(String title, String message, String type) {
        SystemNotificationEntity e = new SystemNotificationEntity();
        e.setTitle(title != null ? title.trim() : "");
        e.setMessage(message != null ? message.trim() : "");
        e.setType(type != null && List.of("info", "warning", "success", "error").contains(type) ? type : "info");
        e.setCreatedBy(null);
        e.setActive(true);
        repository.save(e);
    }

    public List<SystemNotificationDto> listForAdmin(UUID adminUserId) {
        requireAdmin(adminUserId);
        return repository.findAllByOrderByCreatedAtDesc().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public List<SystemNotificationDto> getActiveForUser() {
        Instant now = Instant.now();
        return repository.findByActiveTrueAndExpiresAtIsNullOrExpiresAtAfterOrderByCreatedAtDesc(now).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public void deactivate(UUID adminUserId, UUID notificationId) {
        requireAdmin(adminUserId);
        SystemNotificationEntity e = repository.findById(notificationId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificação não encontrada"));
        e.setActive(false);
        repository.save(e);
    }

    private SystemNotificationDto toDto(SystemNotificationEntity e) {
        SystemNotificationDto d = new SystemNotificationDto();
        d.setId(e.getId() != null ? e.getId().toString() : null);
        d.setTitle(e.getTitle());
        d.setMessage(e.getMessage());
        d.setType(e.getType());
        d.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        d.setExpiresAt(e.getExpiresAt() != null ? e.getExpiresAt().toString() : null);
        d.setActive(e.isActive());
        return d;
    }
}
