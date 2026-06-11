package com.chefcontrol.service;

import com.chefcontrol.dto.ContactMessageDto;
import com.chefcontrol.dto.ContactMessageRequest;
import com.chefcontrol.entity.ContactMessageEntity;
import com.chefcontrol.repository.ContactMessageRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ContactMessageService {

    private final ContactMessageRepository repository;
    private final ContactMailNotifier mailNotifier;

    public ContactMessageService(ContactMessageRepository repository, ContactMailNotifier mailNotifier) {
        this.repository = repository;
        this.mailNotifier = mailNotifier;
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

        try {
            mailNotifier.notifyTeam(entity);
        } catch (Exception e) {
            System.err.println("❌ Falha ao enviar e-mail de reclamação (id=" + entity.getId() + "): " + e.getMessage());
        }

        ContactMessageDto dto = new ContactMessageDto();
        dto.setId(entity.getId() != null ? entity.getId().toString() : null);
        dto.setMessage("A sua mensagem foi enviada com sucesso.");
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
