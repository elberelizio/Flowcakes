package com.Flow Cakes.service;

import com.Flow Cakes.dto.AccessLogDto;
import com.Flow Cakes.dto.AccessLogUserSummaryDto;
import com.Flow Cakes.dto.AccessLogUsersPageDto;
import com.Flow Cakes.entity.AccessLogEntity;
import com.Flow Cakes.entity.UserEntity;
import com.Flow Cakes.repository.AccessLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AccessLogService {

    private final AccessLogRepository repository;

    public AccessLogService(AccessLogRepository repository) {
        this.repository = repository;
    }

    public void logLogin(UserEntity user, String ipAddress, String userAgent) {
        logLogin(user.getId(), user.getPhone(), user.getFullName(), user.isAdmin(), ipAddress, userAgent);
    }

    public void logLogin(java.util.UUID userId, String phone, String fullName, boolean isAdmin, String ipAddress, String userAgent) {
        logLoginAndReturnId(userId, phone, fullName, isAdmin, ipAddress, userAgent);
    }

    public UUID logLoginAndReturnId(java.util.UUID userId, String phone, String fullName, boolean isAdmin, String ipAddress, String userAgent) {
        AccessLogEntity log = new AccessLogEntity();
        log.setUserId(userId);
        log.setUserPhone(phone);
        log.setUserFullName(fullName);
        log.setAdmin(isAdmin);
        log.setIpAddress(ipAddress != null && ipAddress.length() > 45 ? ipAddress.substring(0, 45) : ipAddress);
        log.setUserAgent(userAgent);
        return repository.save(log).getId();
    }

    public List<AccessLogDto> getRecentLogs(int limit) {
        return repository.findTop100ByOrderByCreatedAtDesc().stream()
            .limit(limit)
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public long countLoginsToday() {
        Instant startOfDay = LocalDate.now().atStartOfDay().toInstant(ZoneOffset.UTC);
        return repository.countSince(startOfDay);
    }

    public long countUniqueUsersToday() {
        Instant startOfDay = LocalDate.now().atStartOfDay().toInstant(ZoneOffset.UTC);
        return repository.countDistinctUsersSince(startOfDay);
    }

    public List<AccessLogDto> getLogsByUserId(java.util.UUID userId, int limit) {
        int safeLimit = limit > 0 ? Math.min(limit, 100) : 30;
        return repository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, safeLimit)).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public AccessLogUsersPageDto getUserSummariesPage(String search, int page, int size) {
        String term = search != null ? search.trim().toLowerCase(Locale.ROOT) : "";
        int safeSize = size > 0 ? Math.min(size, 50) : 15;
        int safePage = Math.max(page, 0);

        List<AccessLogUserSummaryDto> summaries = buildUserSummaries(term);

        long total = summaries.size();
        int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);
        int from = safePage * safeSize;
        List<AccessLogUserSummaryDto> pageItems = new ArrayList<>();
        if (from < summaries.size()) {
            int to = Math.min(from + safeSize, summaries.size());
            pageItems = summaries.subList(from, to);
        }

        AccessLogUsersPageDto pageDto = new AccessLogUsersPageDto();
        pageDto.setItems(pageItems);
        pageDto.setPage(safePage);
        pageDto.setSize(safeSize);
        pageDto.setTotalElements(total);
        pageDto.setTotalPages(totalPages);
        return pageDto;
    }

    private List<AccessLogUserSummaryDto> buildUserSummaries(String searchTerm) {
        List<AccessLogEntity> logs = repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        Map<UUID, UserSummaryAccumulator> byUser = new LinkedHashMap<>();

        for (AccessLogEntity log : logs) {
            if (log.getUserId() == null) {
                continue;
            }
            byUser.computeIfAbsent(log.getUserId(), UserSummaryAccumulator::new).accept(log);
        }

        return byUser.values().stream()
            .map(UserSummaryAccumulator::toDto)
            .filter(summary -> matchesSearch(summary, searchTerm))
            .sorted(Comparator.comparing(AccessLogUserSummaryDto::getLastLoginAt, Comparator.nullsLast(String::compareTo)).reversed())
            .collect(Collectors.toList());
    }

    private static boolean matchesSearch(AccessLogUserSummaryDto summary, String term) {
        if (term.isEmpty()) {
            return true;
        }
        String name = summary.getUserFullName() != null ? summary.getUserFullName().toLowerCase(Locale.ROOT) : "";
        String phone = summary.getUserPhone() != null ? summary.getUserPhone() : "";
        return name.contains(term) || phone.contains(term);
    }

    public long countByUserId(java.util.UUID userId) {
        return repository.countByUserId(userId);
    }

    public long countLoginsSince(Instant since) {
        return repository.countSince(since);
    }

    public long countDistinctNonAdminUsersSince(Instant since) {
        return repository.countDistinctNonAdminUsersSince(since);
    }

    public long countByUserIdSince(java.util.UUID userId, Instant since) {
        return repository.countByUserIdSince(userId, since);
    }

    public Instant getFirstLoginByUserId(java.util.UUID userId) {
        return repository.findFirstLoginByUserId(userId);
    }

    public Instant getLastLoginByUserId(java.util.UUID userId) {
        return repository.findLastLoginByUserId(userId);
    }

    private AccessLogDto toDto(AccessLogEntity e) {
        AccessLogDto d = new AccessLogDto();
        d.setId(e.getId() != null ? e.getId().toString() : null);
        d.setUserId(e.getUserId() != null ? e.getUserId().toString() : null);
        d.setUserPhone(e.getUserPhone());
        d.setUserFullName(e.getUserFullName());
        d.setAdmin(e.isAdmin());
        d.setIpAddress(e.getIpAddress());
        d.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        return d;
    }

    private static final class UserSummaryAccumulator {
        private final UUID userId;
        private String userPhone;
        private String userFullName;
        private boolean admin;
        private long totalLogins;
        private Instant firstLoginAt;
        private Instant lastLoginAt;
        private String lastIpAddress;

        private UserSummaryAccumulator(UUID userId) {
            this.userId = userId;
        }

        private void accept(AccessLogEntity log) {
            totalLogins++;
            if (userPhone == null && log.getUserPhone() != null) {
                userPhone = log.getUserPhone();
            }
            if (userFullName == null && log.getUserFullName() != null) {
                userFullName = log.getUserFullName();
            }
            if (log.isAdmin()) {
                admin = true;
            }
            Instant createdAt = log.getCreatedAt();
            if (createdAt == null) {
                return;
            }
            if (firstLoginAt == null || createdAt.isBefore(firstLoginAt)) {
                firstLoginAt = createdAt;
            }
            if (lastLoginAt == null || createdAt.isAfter(lastLoginAt)) {
                lastLoginAt = createdAt;
                lastIpAddress = log.getIpAddress();
            }
            if (log.getUserPhone() != null) {
                userPhone = log.getUserPhone();
            }
            if (log.getUserFullName() != null) {
                userFullName = log.getUserFullName();
            }
        }

        private AccessLogUserSummaryDto toDto() {
            AccessLogUserSummaryDto dto = new AccessLogUserSummaryDto();
            dto.setUserId(userId.toString());
            dto.setUserPhone(userPhone);
            dto.setUserFullName(userFullName);
            dto.setAdmin(admin);
            dto.setTotalLogins(totalLogins);
            dto.setFirstLoginAt(firstLoginAt != null ? firstLoginAt.toString() : null);
            dto.setLastLoginAt(lastLoginAt != null ? lastLoginAt.toString() : null);
            dto.setLastIpAddress(lastIpAddress);
            return dto;
        }
    }
}
