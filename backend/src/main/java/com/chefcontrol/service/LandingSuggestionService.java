package com.Flow Cakes.service;

import com.Flow Cakes.dto.LandingSuggestionDto;
import com.Flow Cakes.dto.LandingSuggestionRequest;
import com.Flow Cakes.entity.LandingSuggestionEntity;
import com.Flow Cakes.repository.LandingSuggestionRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LandingSuggestionService {

    private final LandingSuggestionRepository repository;
    private final AdminService adminService;

    public LandingSuggestionService(LandingSuggestionRepository repository, AdminService adminService) {
        this.repository = repository;
        this.adminService = adminService;
    }

    public LandingSuggestionDto create(LandingSuggestionRequest body, HttpServletRequest request) {
        LandingSuggestionEntity entity = new LandingSuggestionEntity();
        entity.setPersonName(body.getPersonName().trim());
        entity.setMessage(body.getMessage().trim());
        entity.setDeviceId(body.getDeviceId().trim());
        entity.setPageUrl(trimOrNull(body.getPageUrl()));
        entity.setIpAddress(extractClientIp(request));
        entity.setUserAgent(trimOrNull(request.getHeader("User-Agent")));

        entity = repository.save(entity);
        return toDto(entity);
    }

    public List<LandingSuggestionDto> listForAdmin(UUID adminUserId) {
        adminService.requireAdmin(adminUserId);
        try {
            return repository.findTop100ByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("❌ Erro ao listar sugestões: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erro ao listar sugestões: " + e.getMessage(), e);
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String first = forwarded.split(",")[0].trim();
            if (!first.isBlank()) return first;
        }
        return trimOrNull(request.getRemoteAddr());
    }

    private String trimOrNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private LandingSuggestionDto toDto(LandingSuggestionEntity entity) {
        LandingSuggestionDto dto = new LandingSuggestionDto();
        dto.setId(entity.getId() != null ? entity.getId().toString() : null);
        dto.setPersonName(entity.getPersonName());
        dto.setMessage(entity.getMessage());
        dto.setDeviceId(entity.getDeviceId());
        dto.setPageUrl(entity.getPageUrl());
        dto.setIpAddress(entity.getIpAddress());
        dto.setUserAgent(entity.getUserAgent());
        dto.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null);
        return dto;
    }
}
