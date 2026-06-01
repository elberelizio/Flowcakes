package com.chefcontrol.service;

import com.chefcontrol.dto.SystemNotificationDto;
import com.chefcontrol.dto.SystemNotificationRequest;
import com.chefcontrol.entity.SystemNotificationEntity;
import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.entity.UserNotificationDismissalEntity;
import com.chefcontrol.repository.SystemNotificationRepository;
import com.chefcontrol.repository.UserNotificationDismissalRepository;
import com.chefcontrol.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SystemNotificationService {

    private static final ZoneId ZONE = ZoneId.of("Africa/Maputo");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", Locale.forLanguageTag("pt-MZ"));

    private final SystemNotificationRepository repository;
    private final UserRepository userRepository;
    private final UserNotificationDismissalRepository dismissalRepository;

    public SystemNotificationService(
        SystemNotificationRepository repository,
        UserRepository userRepository,
        UserNotificationDismissalRepository dismissalRepository
    ) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.dismissalRepository = dismissalRepository;
    }

    public void requireAdmin(UUID userId) {
        UserEntity u = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (!u.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso reservado a administradores");
        }
    }

    public SystemNotificationDto create(UUID adminUserId, SystemNotificationRequest body) {
        requireAdmin(adminUserId);
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Corpo inválido");
        }

        boolean maintenance = "maintenance".equalsIgnoreCase(body.getCategory());
        SystemNotificationEntity e = new SystemNotificationEntity();
        e.setCategory(maintenance ? "maintenance" : "announcement");
        e.setAudience("users");
        e.setCreatedBy(adminUserId);
        e.setActive(true);

        if (maintenance) {
            Instant start = parseInstant(body.getMaintenanceStartAt(), true);
            Instant end = parseInstant(body.getMaintenanceEndAt(), false);
            if (start == null || end == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Indique a data de início e fim da manutenção.");
            }
            if (end.isBefore(start)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A data de fim deve ser igual ou posterior à data de início.");
            }
            Instant startOfToday = LocalDate.now(ZoneId.systemDefault())
                    .atStartOfDay(ZoneId.systemDefault())
                    .toInstant();
            if (start.isBefore(startOfToday)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A data de início não pode ser anterior a hoje.");
            }
            if (end.isBefore(startOfToday)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A data de fim não pode ser anterior a hoje.");
            }
            e.setMaintenanceStartAt(start);
            e.setMaintenanceEndAt(end);
            e.setExpiresAt(end);
            e.setType("warning");
            String title = body.getTitle() != null ? body.getTitle().trim() : "";
            e.setTitle(title.isEmpty() ? "Manutenção programada" : title);
            String template = normalizeMaintenanceTemplate(body.getMaintenanceTemplate());
            String custom = body.getMessage() != null ? body.getMessage().trim() : "";
            e.setMessage(buildMaintenanceMessage(start, end, template, custom));
        } else {
            String title = body.getTitle() != null ? body.getTitle().trim() : "";
            String message = body.getMessage() != null ? body.getMessage().trim() : "";
            if (title.isEmpty() || message.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preencha o título e a mensagem.");
            }
            e.setTitle(title);
            e.setMessage(message);
            e.setType(normalizeType(body.getType()));
            if (body.getExpiresAt() != null && !body.getExpiresAt().isBlank()) {
                e.setExpiresAt(parseInstant(body.getExpiresAt(), false));
            }
        }

        e = repository.save(e);
        return toDto(e, false, Instant.now());
    }

    public void createSystemAlert(String title, String message, String type) {
        createOperationAlert(title, message, type, "payment_simulation");
    }

    /** Alerta interno visível apenas na área de administração (pagamentos simulados, etc.). */
    public void createOperationAlert(String title, String message, String type, String alertCategory) {
        SystemNotificationEntity e = new SystemNotificationEntity();
        e.setTitle(title != null ? title.trim() : "");
        e.setMessage(message != null ? message.trim() : "");
        e.setType(normalizeType(type));
        e.setCategory(alertCategory != null && !alertCategory.isBlank() ? alertCategory : "operation");
        e.setAudience("admins");
        e.setCreatedBy(null);
        e.setActive(true);
        repository.save(e);
    }

    public List<SystemNotificationDto> listBroadcastsForAdmin(UUID adminUserId) {
        requireAdmin(adminUserId);
        Instant now = Instant.now();
        return repository.findAllByOrderByCreatedAtDesc().stream()
            .filter(this::isUserBroadcast)
            .map(n -> toDto(n, false, now))
            .collect(Collectors.toList());
    }

    public List<SystemNotificationDto> listOperationAlertsForAdmin(UUID adminUserId) {
        requireAdmin(adminUserId);
        Instant now = Instant.now();
        return repository.findAllByOrderByCreatedAtDesc().stream()
            .filter(this::isOperationAlert)
            .map(n -> toDto(n, false, now))
            .collect(Collectors.toList());
    }

    private boolean isOperationAlert(SystemNotificationEntity n) {
        if ("admins".equals(n.getAudience())) return true;
        if ("payment_simulation".equals(n.getCategory())) return true;
        if ("registration".equals(n.getCategory())) return true;
        String title = n.getTitle();
        if (title != null && title.startsWith("[Simulação]")) return true;
        return n.getCreatedBy() == null && !"maintenance".equals(n.getCategory());
    }

    private boolean isUserBroadcast(SystemNotificationEntity n) {
        return !isOperationAlert(n);
    }

    /** @deprecated use {@link #listBroadcastsForAdmin} or {@link #listOperationAlertsForAdmin} */
    public List<SystemNotificationDto> listForAdmin(UUID adminUserId) {
        return listBroadcastsForAdmin(adminUserId);
    }

    public List<SystemNotificationDto> getActiveForUser(UUID userId) {
        Instant now = Instant.now();
        Set<UUID> dismissed = dismissalRepository.findByUserId(userId).stream()
            .map(UserNotificationDismissalEntity::getNotificationId)
            .collect(Collectors.toSet());

        return repository.findVisibleForUsers(now).stream()
            .filter(this::isUserBroadcast)
            .map(n -> toDto(n, dismissed.contains(n.getId()), now))
            .collect(Collectors.toList());
    }

    public void dismiss(UUID userId, UUID notificationId) {
        if (!repository.existsById(notificationId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificação não encontrada");
        }
        if (dismissalRepository.existsByUserIdAndNotificationId(userId, notificationId)) {
            return;
        }
        UserNotificationDismissalEntity d = new UserNotificationDismissalEntity();
        d.setUserId(userId);
        d.setNotificationId(notificationId);
        dismissalRepository.save(d);
    }

    public void deactivate(UUID adminUserId, UUID notificationId) {
        requireAdmin(adminUserId);
        SystemNotificationEntity e = repository.findById(notificationId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificação não encontrada"));
        e.setActive(false);
        repository.save(e);
    }

    private String normalizeMaintenanceTemplate(String raw) {
        if (raw == null || raw.isBlank()) return "standard";
        String t = raw.trim().toLowerCase(Locale.ROOT);
        if ("new_features".equals(t) || "new-features".equals(t)) return "new_features";
        if ("custom".equals(t)) return "custom";
        return "standard";
    }

    private String buildMaintenanceMessage(Instant start, Instant end, String template, String custom) {
        String period = formatDate(start) + " a " + formatDate(end);
        if ("new_features".equals(template)) {
            return "Estimados clientes, estaremos em manutenção de " + period
                + " para implementar novas funcionalidades pedidas. Agradecemos a compreensão.";
        }
        if ("custom".equals(template) && custom != null && !custom.isBlank()) {
            return custom.contains("{period}") ? custom.replace("{period}", period) : custom;
        }
        return "Estimados clientes, o Chef Control estará em manutenção de " + period
            + ". Durante este período algumas funções podem ficar indisponíveis.";
    }

    private String formatDate(Instant instant) {
        return DATE_FMT.format(instant.atZone(ZONE).toLocalDate());
    }

    private Instant parseInstant(String raw, boolean startOfDay) {
        if (raw == null || raw.isBlank()) return null;
        String s = raw.trim();
        try {
            if (s.length() <= 10) {
                LocalDate d = LocalDate.parse(s);
                if (startOfDay) {
                    return d.atStartOfDay(ZONE).toInstant();
                }
                return d.plusDays(1).atStartOfDay(ZONE).toInstant().minusMillis(1);
            }
            return Instant.parse(s);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data inválida: " + s);
        }
    }

    private String normalizeType(String type) {
        if (type != null && List.of("info", "warning", "success", "error").contains(type)) {
            return type;
        }
        return "info";
    }

    private SystemNotificationDto toDto(SystemNotificationEntity e, boolean dismissed, Instant now) {
        SystemNotificationDto d = new SystemNotificationDto();
        d.setId(e.getId() != null ? e.getId().toString() : null);
        d.setTitle(e.getTitle());
        d.setMessage(e.getMessage());
        d.setType(e.getType());
        d.setCategory(e.getCategory());
        d.setAudience(e.getAudience() != null ? e.getAudience() : "users");
        d.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        d.setExpiresAt(e.getExpiresAt() != null ? e.getExpiresAt().toString() : null);
        d.setMaintenanceStartAt(e.getMaintenanceStartAt() != null ? e.getMaintenanceStartAt().toString() : null);
        d.setMaintenanceEndAt(e.getMaintenanceEndAt() != null ? e.getMaintenanceEndAt().toString() : null);
        d.setActive(e.isActive());
        d.setDismissed(dismissed);
        d.setMaintenancePhase(resolveMaintenancePhase(e, now));
        return d;
    }

    private String resolveMaintenancePhase(SystemNotificationEntity e, Instant now) {
        if (!"maintenance".equals(e.getCategory())) return null;
        Instant start = e.getMaintenanceStartAt();
        Instant end = e.getMaintenanceEndAt();
        if (start != null && now.isBefore(start)) return "scheduled";
        if (end != null && now.isAfter(end)) return "ended";
        return "active";
    }
}
