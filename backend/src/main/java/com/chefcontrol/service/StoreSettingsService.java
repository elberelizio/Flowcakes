package com.Flow Cakes.service;

import com.Flow Cakes.dto.StoreSettingsDto;
import com.Flow Cakes.dto.StoreSettingsRequest;
import com.Flow Cakes.entity.UserStoreSettingsEntity;
import com.Flow Cakes.repository.UserStoreSettingsRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class StoreSettingsService {

    private static final Pattern SLUG_PATTERN = Pattern.compile("^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$");
    private static final int SLUG_MIN = 3;
    private static final int SLUG_MAX = 50;

    private final UserStoreSettingsRepository repository;

    @Value("${app.base-url:http://localhost:4200}")
    private String baseUrl;

    public StoreSettingsService(UserStoreSettingsRepository repository) {
        this.repository = repository;
    }

    public StoreSettingsDto getForUser(UUID userId) {
        return repository.findByUserId(userId)
            .map(this::toDto)
            .orElseGet(() -> defaultDto(userId));
    }

    public StoreSettingsDto getBySlug(String slug) {
        if (slug == null || slug.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Loja não encontrada");
        }
        return repository.findByStoreSlug(slug.trim().toLowerCase())
            .map(this::toDto)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loja não encontrada"));
    }

    public StoreSettingsDto update(UUID userId, StoreSettingsRequest request) {
        UserStoreSettingsEntity entity = repository.findByUserId(userId)
            .orElseGet(() -> {
                UserStoreSettingsEntity e = new UserStoreSettingsEntity();
                e.setUserId(userId);
                return e;
            });

        if (request.getStoreName() != null) {
            String v = request.getStoreName().trim();
            entity.setStoreName(v.isEmpty() ? "Minha Loja" : v);
        }
        if (request.getStoreTagline() != null) {
            entity.setStoreTagline(request.getStoreTagline().trim().isEmpty() ? null : request.getStoreTagline().trim());
        }
        if (request.getStoreDescription() != null) {
            entity.setStoreDescription(request.getStoreDescription().trim().isEmpty() ? null : request.getStoreDescription().trim());
        }
        if (request.getStorePhone() != null) {
            entity.setStorePhone(request.getStorePhone().trim().isEmpty() ? null : request.getStorePhone().trim());
        }
        if (request.getStoreWhatsapp() != null) {
            entity.setStoreWhatsapp(request.getStoreWhatsapp().trim().isEmpty() ? null : request.getStoreWhatsapp().trim());
        }
        if (request.getStoreInstagram() != null) {
            entity.setStoreInstagram(request.getStoreInstagram().trim().isEmpty() ? null : request.getStoreInstagram().trim());
        }
        if (request.getStoreAddress() != null) {
            entity.setStoreAddress(request.getStoreAddress().trim().isEmpty() ? null : request.getStoreAddress().trim());
        }
        if (request.getStoreEmail() != null) {
            entity.setStoreEmail(request.getStoreEmail().trim().isEmpty() ? null : request.getStoreEmail().trim());
        }
        if (request.getStoreHours() != null) {
            entity.setStoreHours(request.getStoreHours().trim().isEmpty() ? null : request.getStoreHours().trim());
        }
        if (request.getStoreFooterTagline() != null) {
            entity.setStoreFooterTagline(request.getStoreFooterTagline().trim().isEmpty() ? null : request.getStoreFooterTagline().trim());
        }
        if (request.getStoreSlug() != null) {
            String slug = request.getStoreSlug().trim().toLowerCase().replaceAll("[^a-z0-9-]", "");
            if (!slug.isEmpty()) {
                if (slug.length() < SLUG_MIN || slug.length() > SLUG_MAX) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "O identificador do site deve ter entre " + SLUG_MIN + " e " + SLUG_MAX + " caracteres (letras minúsculas, números e hífens).");
                }
                if (!SLUG_PATTERN.matcher(slug).matches()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Identificador inválido. Use apenas letras minúsculas, números e hífens.");
                }
                if (repository.existsByStoreSlugAndUserIdNot(slug, userId)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Este identificador já está em uso.");
                }
                entity.setStoreSlug(slug);
            } else {
                entity.setStoreSlug(null);
            }
        }

        entity = repository.save(entity);
        return toDto(entity);
    }

    private StoreSettingsDto toDto(UserStoreSettingsEntity e) {
        StoreSettingsDto d = new StoreSettingsDto();
        d.setStoreName(e.getStoreName());
        d.setStoreTagline(e.getStoreTagline());
        d.setStoreDescription(e.getStoreDescription());
        d.setStorePhone(e.getStorePhone());
        d.setStoreWhatsapp(e.getStoreWhatsapp());
        d.setStoreInstagram(e.getStoreInstagram());
        d.setStoreAddress(e.getStoreAddress());
        d.setStoreEmail(e.getStoreEmail());
        d.setStoreHours(e.getStoreHours());
        d.setStoreFooterTagline(e.getStoreFooterTagline());
        d.setStoreSlug(e.getStoreSlug());
        if (e.getStoreSlug() != null) {
            d.setStoreUrl(baseUrl + "/loja/" + e.getStoreSlug());
        }
        return d;
    }

    private StoreSettingsDto defaultDto(UUID userId) {
        StoreSettingsDto d = new StoreSettingsDto();
        d.setStoreName("Minha Loja");
        d.setStoreTagline(null);
        d.setStoreDescription(null);
        d.setStorePhone(null);
        d.setStoreWhatsapp(null);
        d.setStoreInstagram(null);
        d.setStoreSlug(null);
        return d;
    }
}
