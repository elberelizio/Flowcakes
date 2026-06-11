package com.chefcontrol.service;

import com.chefcontrol.dto.BlockedAccountRowDto;
import com.chefcontrol.dto.SecurityEventDto;
import com.chefcontrol.entity.SecurityEventEntity;
import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.repository.SecurityEventRepository;
import com.chefcontrol.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SecurityEventService {

    public static final String EVENT_LOGIN_SUCCESS = "LOGIN_SUCCESS";
    public static final String EVENT_LOGIN_FAILED_PASSWORD = "LOGIN_FAILED_PASSWORD";
    public static final String EVENT_LOGIN_FAILED_UNKNOWN_PHONE = "LOGIN_FAILED_UNKNOWN_PHONE";
    public static final String EVENT_LOGIN_BLOCKED_ATTEMPT = "LOGIN_BLOCKED_ATTEMPT";
    public static final String EVENT_PHONE_CHANGE_SUCCESS = "PHONE_CHANGE_SUCCESS";
    public static final String EVENT_PHONE_CHANGE_FAILED_PASSWORD = "PHONE_CHANGE_FAILED_PASSWORD";
    public static final String EVENT_PHONE_CHANGE_REJECTED_REGISTERED = "PHONE_CHANGE_REJECTED_REGISTERED";
    public static final String EVENT_ACCOUNT_AUTO_BLOCKED = "ACCOUNT_AUTO_BLOCKED";
    public static final String EVENT_ACCOUNT_UNBLOCKED = "ACCOUNT_UNBLOCKED";
    public static final String EVENT_PASSWORD_RESET_OTP_REQUESTED = "PASSWORD_RESET_OTP_REQUESTED";
    public static final String EVENT_PASSWORD_RESET_OTP_VERIFIED = "PASSWORD_RESET_OTP_VERIFIED";
    public static final String EVENT_PASSWORD_RESET_COMPLETED = "PASSWORD_RESET_COMPLETED";

    public static final String BLOCK_REASON_PASSWORD_ATTEMPTS = "PASSWORD_ATTEMPTS";
    public static final String BLOCK_REASON_MANUAL = "MANUAL";

    private final SecurityEventRepository repository;
    private final UserRepository userRepository;

    public SecurityEventService(SecurityEventRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    public void log(
            String eventType,
            UserEntity user,
            String details,
            String ipAddress,
            String userAgent
    ) {
        log(eventType, user != null ? user.getId() : null,
                user != null ? user.getPhone() : null,
                user != null ? user.getFullName() : null,
                details, ipAddress, userAgent);
    }

    public void log(
            String eventType,
            UUID userId,
            String phone,
            String fullName,
            String details,
            String ipAddress,
            String userAgent
    ) {
        SecurityEventEntity e = new SecurityEventEntity();
        e.setEventType(eventType);
        e.setUserId(userId);
        e.setUserPhone(phone);
        e.setUserFullName(fullName);
        e.setDetails(details);
        e.setIpAddress(trimIp(ipAddress));
        e.setUserAgent(userAgent);
        repository.save(e);
    }

    public List<SecurityEventDto> getRecentEvents(int limit) {
        int cap = limit > 0 ? Math.min(limit, 500) : 200;
        return repository.findTop200ByOrderByCreatedAtDesc().stream()
                .limit(cap)
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<BlockedAccountRowDto> getBlockedAccounts() {
        return userRepository.findByBlockedTrueOrderByUpdatedAtDesc().stream()
                .map(this::toBlockedRow)
                .collect(Collectors.toList());
    }

    private BlockedAccountRowDto toBlockedRow(UserEntity u) {
        BlockedAccountRowDto d = new BlockedAccountRowDto();
        d.setId(u.getId().toString());
        d.setPhone(u.getPhone());
        d.setFullName(u.getFullName());
        d.setBlockReason(u.getBlockReason());
        d.setFailedPasswordAttempts(u.getFailedPasswordAttempts());
        d.setBlockedAt(u.getUpdatedAt() != null ? u.getUpdatedAt().toString() : null);
        return d;
    }

    private SecurityEventDto toDto(SecurityEventEntity e) {
        SecurityEventDto d = new SecurityEventDto();
        d.setId(e.getId() != null ? e.getId().toString() : null);
        d.setEventType(e.getEventType());
        d.setUserId(e.getUserId() != null ? e.getUserId().toString() : null);
        d.setUserPhone(e.getUserPhone());
        d.setUserFullName(e.getUserFullName());
        d.setDetails(e.getDetails());
        d.setIpAddress(e.getIpAddress());
        d.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        return d;
    }

    private static String trimIp(String ip) {
        if (ip == null) return null;
        return ip.length() > 45 ? ip.substring(0, 45) : ip;
    }
}
