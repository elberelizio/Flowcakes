package com.chefcontrol.controller;

import com.chefcontrol.dto.LicenseInfoPublicDto;
import com.chefcontrol.service.LicenseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints públicos (sem autenticação): ex. informação da licença por token para o link de ativação.
 */
@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final LicenseService licenseService;

    public PublicController(LicenseService licenseService) {
        this.licenseService = licenseService;
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
}
