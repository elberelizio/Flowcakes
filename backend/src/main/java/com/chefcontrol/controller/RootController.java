package com.chefcontrol.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Resposta amigável quando se abre http://localhost:8081/ no browser (não é erro da API).
 */
@RestController
public class RootController {

    @GetMapping({"/", "/api"})
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("service", "chef-control-backend");
        body.put("status", "ok");
        body.put("message", "API REST activa. O frontend usa /api/... — não abra só a raiz no browser.");
        body.put("health", "GET /api/public/health");
        body.put("login", "POST /api/auth/login");
        body.put("frontend", "http://localhost:4200");
        return ResponseEntity.ok(body);
    }
}
