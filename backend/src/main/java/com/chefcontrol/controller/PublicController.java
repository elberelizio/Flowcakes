package com.chefcontrol.controller;

import com.chefcontrol.dto.LicenseInfoPublicDto;
import com.chefcontrol.dto.StoreSettingsDto;
import com.chefcontrol.service.LicenseService;
import com.chefcontrol.service.StoreSettingsService;
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

    public PublicController(LicenseService licenseService, StoreSettingsService storeSettingsService) {
        this.licenseService = licenseService;
        this.storeSettingsService = storeSettingsService;
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
}
