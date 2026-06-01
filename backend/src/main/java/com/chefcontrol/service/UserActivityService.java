package com.chefcontrol.service;

import com.chefcontrol.config.SessionInfo;
import com.chefcontrol.dto.TrackActivityRequest;
import com.chefcontrol.dto.UserActivityHistoryPageDto;
import com.chefcontrol.dto.UserActivityHistoryRowDto;
import com.chefcontrol.dto.UserActivityItemDto;
import com.chefcontrol.dto.UserSessionDetailDto;
import com.chefcontrol.entity.AccessLogEntity;
import com.chefcontrol.entity.UserActivityLogEntity;
import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.repository.AccessLogRepository;
import com.chefcontrol.repository.UserActivityLogRepository;
import com.chefcontrol.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserActivityService {

    private final UserActivityLogRepository activityRepository;
    private final AccessLogRepository accessLogRepository;
    private final AccessLogService accessLogService;
    private final UserRepository userRepository;

    public UserActivityService(
        UserActivityLogRepository activityRepository,
        AccessLogRepository accessLogRepository,
        AccessLogService accessLogService,
        UserRepository userRepository
    ) {
        this.activityRepository = activityRepository;
        this.accessLogRepository = accessLogRepository;
        this.accessLogService = accessLogService;
        this.userRepository = userRepository;
    }

    @Transactional
    public UUID logLoginSession(UserEntity user, String ipAddress, String userAgent) {
        return accessLogService.logLoginAndReturnId(
            user.getId(), user.getPhone(), user.getFullName(), user.isAdmin(), ipAddress, userAgent);
    }

    @Transactional
    public UUID logLoginSession(UUID userId, String phone, String fullName, boolean isAdmin, String ipAddress, String userAgent) {
        return accessLogService.logLoginAndReturnId(userId, phone, fullName, isAdmin, ipAddress, userAgent);
    }

    @Transactional
    public void track(UUID userId, SessionInfo sessionInfo, TrackActivityRequest request) {
        if (userId == null || request == null || request.getActivityType() == null) {
            return;
        }
        String type = request.getActivityType().trim().toUpperCase(Locale.ROOT);
        if (!UserActivityLogEntity.TYPE_PAGE_VIEW.equals(type)
            && !UserActivityLogEntity.TYPE_OPERATION.equals(type)) {
            return;
        }

        UUID accessLogId = resolveAccessLogId(userId, sessionInfo);
        if (accessLogId == null) {
            return;
        }

        UserActivityLogEntity log = new UserActivityLogEntity();
        log.setAccessLogId(accessLogId);
        log.setUserId(userId);
        log.setActivityType(type);
        log.setPagePath(trim(request.getPagePath(), 500));
        log.setOperation(trim(request.getOperation(), 200));
        log.setDetail(trim(request.getDetail(), 2000));
        activityRepository.save(log);
    }

    @Transactional
    public void endSession(UUID userId, SessionInfo sessionInfo) {
        UUID accessLogId = resolveAccessLogId(userId, sessionInfo);
        if (accessLogId == null) {
            return;
        }

        accessLogRepository.findById(accessLogId).ifPresent(session -> {
            if (session.getEndedAt() == null) {
                session.setEndedAt(Instant.now());
                accessLogRepository.save(session);
            }
        });

        UserActivityLogEntity logout = new UserActivityLogEntity();
        logout.setAccessLogId(accessLogId);
        logout.setUserId(userId);
        logout.setActivityType(UserActivityLogEntity.TYPE_LOGOUT);
        logout.setOperation("Logout");
        activityRepository.save(logout);
    }

    public List<UserSessionDetailDto> getSessionsForUser(UUID userId, int sessionLimit) {
        int safeLimit = sessionLimit > 0 ? Math.min(sessionLimit, 50) : 20;
        List<AccessLogEntity> sessions = accessLogRepository
            .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, safeLimit));

        if (sessions.isEmpty()) {
            return List.of();
        }

        List<UUID> sessionIds = sessions.stream().map(AccessLogEntity::getId).toList();
        Map<UUID, List<UserActivityLogEntity>> activitiesBySession = activityRepository
            .findByAccessLogIdInOrderByCreatedAtAsc(sessionIds)
            .stream()
            .collect(Collectors.groupingBy(UserActivityLogEntity::getAccessLogId, LinkedHashMap::new, Collectors.toList()));

        List<UserSessionDetailDto> result = new ArrayList<>();
        for (AccessLogEntity session : sessions) {
            UserSessionDetailDto dto = new UserSessionDetailDto();
            dto.setId(session.getId().toString());
            dto.setStartedAt(session.getCreatedAt() != null ? session.getCreatedAt().toString() : null);
            dto.setEndedAt(session.getEndedAt() != null ? session.getEndedAt().toString() : null);
            dto.setIpAddress(session.getIpAddress());
            dto.setActive(session.getEndedAt() == null);

            List<UserActivityItemDto> items = new ArrayList<>();
            UserActivityItemDto loginItem = new UserActivityItemDto();
            loginItem.setActivityType("LOGIN");
            loginItem.setLabel("Entrada no sistema");
            loginItem.setCreatedAt(dto.getStartedAt());
            items.add(loginItem);

            List<UserActivityLogEntity> acts = activitiesBySession.getOrDefault(session.getId(), List.of());
            for (UserActivityLogEntity act : acts) {
                items.add(toActivityDto(act));
            }
            dto.setActivities(items);
            result.add(dto);
        }
        return result;
    }

    public UserActivityHistoryPageDto getActivityHistory(
        UUID userId,
        LocalDate fromDate,
        LocalDate toDate,
        String activityTypeFilter,
        int page,
        int size
    ) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        LocalDate to = toDate != null ? toDate : LocalDate.now();
        if (to.isBefore(from)) {
            LocalDate tmp = from;
            from = to;
            to = tmp;
        }

        Instant fromInstant = from.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant toExclusive = to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

        String typeFilter = activityTypeFilter != null ? activityTypeFilter.trim().toUpperCase(Locale.ROOT) : "";
        boolean filterByType = !typeFilter.isEmpty();

        List<UserActivityHistoryRowDto> rows = new ArrayList<>();

        if (!filterByType || "LOGIN".equals(typeFilter)) {
            List<AccessLogEntity> logins = accessLogRepository
                .findByUserIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                    userId, fromInstant, toExclusive);
            for (AccessLogEntity session : logins) {
                rows.add(toLoginHistoryRow(session));
            }
        }

        if (!filterByType || !"LOGIN".equals(typeFilter)) {
            List<UserActivityLogEntity> activities = activityRepository
                .findByUserIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                    userId, fromInstant, toExclusive);

            Set<UUID> sessionIds = new HashSet<>();
            for (UserActivityLogEntity act : activities) {
                sessionIds.add(act.getAccessLogId());
            }
            Map<UUID, AccessLogEntity> sessionsById = new HashMap<>();
            if (!sessionIds.isEmpty()) {
                accessLogRepository.findAllById(sessionIds).forEach(s -> sessionsById.put(s.getId(), s));
            }

            for (UserActivityLogEntity act : activities) {
                String type = act.getActivityType();
                if (filterByType && !typeFilter.equals(type)) {
                    continue;
                }
                AccessLogEntity session = sessionsById.get(act.getAccessLogId());
                rows.add(toActivityHistoryRow(act, session));
            }
        }

        rows.sort(Comparator.comparing(UserActivityHistoryRowDto::getCreatedAt, Comparator.nullsLast(String::compareTo)).reversed());

        int safeSize = size > 0 ? Math.min(size, 100) : 50;
        int safePage = Math.max(page, 0);
        long total = rows.size();
        int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);
        int fromIndex = safePage * safeSize;
        List<UserActivityHistoryRowDto> pageItems = new ArrayList<>();
        if (fromIndex < rows.size()) {
            int toIndex = Math.min(fromIndex + safeSize, rows.size());
            pageItems = rows.subList(fromIndex, toIndex);
        }

        UserActivityHistoryPageDto pageDto = new UserActivityHistoryPageDto();
        pageDto.setItems(pageItems);
        pageDto.setPage(safePage);
        pageDto.setSize(safeSize);
        pageDto.setTotalElements(total);
        pageDto.setTotalPages(totalPages);
        return pageDto;
    }

    private static UserActivityHistoryRowDto toLoginHistoryRow(AccessLogEntity session) {
        UserActivityHistoryRowDto row = new UserActivityHistoryRowDto();
        row.setId("login-" + session.getId());
        row.setSessionId(session.getId().toString());
        row.setActivityType("LOGIN");
        row.setLabel("Entrada no sistema");
        row.setIpAddress(session.getIpAddress());
        String started = session.getCreatedAt() != null ? session.getCreatedAt().toString() : null;
        row.setSessionStartedAt(started);
        row.setCreatedAt(started);
        return row;
    }

    private UserActivityHistoryRowDto toActivityHistoryRow(UserActivityLogEntity act, AccessLogEntity session) {
        UserActivityHistoryRowDto row = new UserActivityHistoryRowDto();
        row.setId(act.getId() != null ? act.getId().toString() : null);
        row.setSessionId(act.getAccessLogId() != null ? act.getAccessLogId().toString() : null);
        row.setActivityType(act.getActivityType());
        row.setPagePath(act.getPagePath());
        row.setOperation(act.getOperation());
        row.setDetail(act.getDetail());
        row.setLabel(buildLabel(act));
        row.setCreatedAt(act.getCreatedAt() != null ? act.getCreatedAt().toString() : null);
        if (session != null) {
            row.setIpAddress(session.getIpAddress());
            row.setSessionStartedAt(session.getCreatedAt() != null ? session.getCreatedAt().toString() : null);
        }
        return row;
    }

    private UUID resolveAccessLogId(UUID userId, SessionInfo sessionInfo) {
        if (sessionInfo != null && sessionInfo.getLoginLogId() != null) {
            return sessionInfo.getLoginLogId();
        }
        Optional<AccessLogEntity> open = accessLogRepository.findFirstByUserIdAndEndedAtIsNullOrderByCreatedAtDesc(userId);
        if (open.isPresent()) {
            UUID id = open.get().getId();
            if (sessionInfo != null) {
                sessionInfo.setLoginLogId(id);
            }
            return id;
        }
        return userRepository.findById(userId)
            .map(user -> accessLogService.logLoginAndReturnId(
                user.getId(), user.getPhone(), user.getFullName(), user.isAdmin(), null, null))
            .orElse(null);
    }

    private UserActivityItemDto toActivityDto(UserActivityLogEntity e) {
        UserActivityItemDto d = new UserActivityItemDto();
        d.setId(e.getId() != null ? e.getId().toString() : null);
        d.setActivityType(e.getActivityType());
        d.setPagePath(e.getPagePath());
        d.setOperation(e.getOperation());
        d.setDetail(e.getDetail());
        d.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        d.setLabel(buildLabel(e));
        return d;
    }

    private static String buildLabel(UserActivityLogEntity e) {
        String type = e.getActivityType();
        if (UserActivityLogEntity.TYPE_PAGE_VIEW.equals(type)) {
            return pageLabel(e.getPagePath());
        }
        if (UserActivityLogEntity.TYPE_OPERATION.equals(type)) {
            return e.getOperation() != null && !e.getOperation().isBlank()
                ? e.getOperation()
                : "Operação";
        }
        if (UserActivityLogEntity.TYPE_LOGOUT.equals(type)) {
            return "Saída do sistema";
        }
        return type != null ? type : "Atividade";
    }

    private static String pageLabel(String path) {
        if (path == null || path.isBlank()) {
            return "Página";
        }
        return switch (path) {
            case "/dashboard" -> "Dashboard";
            case "/encomendas" -> "Encomendas";
            case "/encomendas/detalhes" -> "Detalhes de encomendas";
            case "/nova-encomenda" -> "Nova encomenda";
            case "/clientes" -> "Clientes";
            case "/despesas-variaveis" -> "Despesas variáveis";
            case "/gestao-dividas" -> "Gestão de dívidas";
            case "/lembretes" -> "Lembretes";
            case "/notificacoes" -> "Notificações";
            case "/relatorios" -> "Relatórios";
            case "/retiradas" -> "Retiradas";
            case "/minha-licenca" -> "Minha licença";
            case "/perfil" -> "Perfil";
            case "/configuracoes" -> "Configurações";
            case "/admin-dashboard" -> "Painel admin";
            case "/tesouraria" -> "Tesouraria";
            case "/gestao-licencas" -> "Gestão de licenças";
            case "/admin-encomendas" -> "Encomendas (admin)";
            case "/gestao-notificacoes" -> "Gestão de notificações";
            case "/admin-novos-utilizadores" -> "Novos utilizadores";
            case "/admin-perfis" -> "Gestão de perfis";
            case "/admin-configuracoes" -> "Configurações admin";
            case "/admin-configuracoes/logs" -> "Logs de acesso";
            case "/admin-configuracoes/acessos" -> "Gestão de acessos";
            case "/admin-configuracoes/sugestoes" -> "Sugestões";
            case "/admin-ranking" -> "Ranking";
            default -> path.startsWith("/encomendas/") ? "Encomenda " + path.substring("/encomendas/".length())
                : path;
        };
    }

    private static String trim(String value, int max) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        if (t.isEmpty()) {
            return null;
        }
        return t.length() > max ? t.substring(0, max) : t;
    }
}
