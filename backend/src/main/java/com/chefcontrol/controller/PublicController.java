package com.chefcontrol.controller;

import com.chefcontrol.dto.ContactMessageDto;
import com.chefcontrol.dto.ContactMessageRequest;
import com.chefcontrol.dto.LicenseInfoPublicDto;
import com.chefcontrol.dto.LandingSuggestionDto;
import com.chefcontrol.dto.LandingSuggestionRequest;
import com.chefcontrol.dto.StoreSettingsDto;
import com.chefcontrol.service.ContactMessageService;
import com.chefcontrol.service.LandingSuggestionService;
import com.chefcontrol.service.LicenseService;
import com.chefcontrol.service.StoreSettingsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Endpoints públicos (sem autenticação): ex. informação da licença por token, loja por slug.
 */
@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final LicenseService licenseService;
    private final StoreSettingsService storeSettingsService;
    private final LandingSuggestionService landingSuggestionService;
    private final ContactMessageService contactMessageService;

    public PublicController(
        LicenseService licenseService,
        StoreSettingsService storeSettingsService,
        LandingSuggestionService landingSuggestionService,
        ContactMessageService contactMessageService
    ) {
        this.licenseService = licenseService;
        this.storeSettingsService = storeSettingsService;
        this.landingSuggestionService = landingSuggestionService;
        this.contactMessageService = contactMessageService;
    }

    /** Confirma que este processo é o backend ChefControl (útil para depurar 404 no login). */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "service", "chef-control-backend",
            "authLogin", "POST /api/auth/login"));
    }

    /**
     * Devolve nome, código da licença e validade. O parâmetro "t" é um token opaco (não é o código).
     * O código da licença vem apenas no corpo da resposta (boas práticas de segurança).
     */
    @GetMapping("/license-info")
    public ResponseEntity<LicenseInfoPublicDto> licenseInfo(@RequestParam("t") String activationToken) {
        if (activationToken == null || activationToken.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return licenseService.getLicenseInfoByActivationToken(activationToken.trim())
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    /**
     * Devolve as definições da loja pública por slug (para /loja/:slug).
     */
    @GetMapping("/store/{slug}")
    public ResponseEntity<StoreSettingsDto> storeBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(storeSettingsService.getBySlug(slug));
    }

    /**
     * Recebe sugestões da landing page pública (nome + mensagem + dispositivo).
     */
    @PostMapping("/landing-suggestions")
    public ResponseEntity<LandingSuggestionDto> createLandingSuggestion(
        @Valid @RequestBody LandingSuggestionRequest body,
        HttpServletRequest request
    ) {
        LandingSuggestionDto saved = landingSuggestionService.create(body, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * Reclamações e pedidos de contacto da página pública /contacto.
     * O destino interno (e-mail da equipa) é tratado no servidor — não exposto ao utilizador.
     */
    @PostMapping("/contact-messages")
    public ResponseEntity<ContactMessageDto> createContactMessage(
        @Valid @RequestBody ContactMessageRequest body,
        HttpServletRequest request
    ) {
        ContactMessageDto saved = contactMessageService.create(body, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
