package com.chefcontrol.service;

import com.chefcontrol.dto.AccessLogDto;
import com.chefcontrol.entity.AccessLogEntity;
import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.repository.AccessLogRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
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
        AccessLogEntity log = new AccessLogEntity();
        log.setUserId(userId);
        log.setUserPhone(phone);
        log.setUserFullName(fullName);
        log.setAdmin(isAdmin);
        log.setIpAddress(ipAddress != null && ipAddress.length() > 45 ? ipAddress.substring(0, 45) : ipAddress);
        log.setUserAgent(userAgent);
        repository.save(log);
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
        return repository.findTop30ByUserIdOrderByCreatedAtDesc(userId).stream()
            .limit(limit > 0 ? Math.min(limit, 50) : 30)
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public long countByUserId(java.util.UUID userId) {
        return repository.countByUserId(userId);
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
}
