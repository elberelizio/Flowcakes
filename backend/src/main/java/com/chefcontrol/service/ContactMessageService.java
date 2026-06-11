package com.chefcontrol.service;

import com.chefcontrol.dto.ContactMessageAdminDto;
import com.chefcontrol.dto.ContactMessageDto;
import com.chefcontrol.dto.ContactMessageRequest;
import com.chefcontrol.entity.ContactMessageEntity;
import com.chefcontrol.repository.ContactMessageRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ContactMessageService {

    private final ContactMessageRepository repository;
    private final AdminService adminService;

    public ContactMessageService(ContactMessageRepository repository, AdminService adminService) {
        this.repository = repository;
        this.adminService = adminService;
    }

    public ContactMessageDto create(ContactMessageRequest body, HttpServletRequest request) {
        String email = trimOrNull(body.getEmail());
        String phone = trimOrNull(body.getPhone());
        if (email == null && phone == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Indique o seu e-mail ou telefone para podermos responder."
            );
        }

        ContactMessageEntity entity = new ContactMessageEntity();
        entity.setFullName(body.getFullName().trim());
        entity.setEmail(email);
        entity.setPhone(phone);
        entity.setMessage(body.getMessage().trim());
        entity.setPageUrl(trimOrNull(body.getPageUrl()));
        entity.setIpAddress(extractClientIp(request));
        entity.setUserAgent(trimOrNull(request.getHeader("User-Agent")));

        entity = repository.save(entity);

        ContactMessageDto dto = new ContactMessageDto();
        dto.setId(entity.getId() != null ? entity.getId().toString() : null);
        dto.setMessage("A sua reclamação ou pedido de contacto foi enviado com sucesso.");
        return dto;
    }

    public List<ContactMessageAdminDto> listForAdmin(UUID adminUserId) {
        adminService.requireAdmin(adminUserId);
        return repository.findTop100ByOrderByCreatedAtDesc().stream()
            .map(this::toAdminDto)
            .collect(Collectors.toList());
    }

    private ContactMessageAdminDto toAdminDto(ContactMessageEntity entity) {
        ContactMessageAdminDto dto = new ContactMessageAdminDto();
        dto.setId(entity.getId() != null ? entity.getId().toString() : null);
        dto.setFullName(entity.getFullName());
        dto.setEmail(entity.getEmail());
        dto.setPhone(entity.getPhone());
        dto.setMessage(entity.getMessage());
        dto.setPageUrl(entity.getPageUrl());
        dto.setIpAddress(entity.getIpAddress());
        dto.setUserAgent(entity.getUserAgent());
        dto.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null);
        return dto;
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
}
