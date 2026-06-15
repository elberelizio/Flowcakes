package com.chefcontrol.config;

import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.repository.UserRepository;
import com.chefcontrol.service.LicenseService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Bloqueia APIs de negócio para utilizadores sem licença activa.
 * Contas expiradas só podem usar auth (perfil/sessão), estado de licença e pagamento M-Pesa/e-Mola.
 */
@Component
@Order(2)
public class LicenseAccessFilter implements Filter {

    private static final List<String> ALLOWED_PREFIXES = List.of(
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/logout",
        "/api/auth/me",
        "/api/auth/license-status",
        "/api/auth/license-payments",
        "/api/auth/recover-password",
        "/api/auth/change-password",
        "/api/mpesa/",
        "/api/public/"
    );

    private final UserRepository userRepository;
    private final LicenseService licenseService;
    private final ObjectMapper objectMapper;

    public LicenseAccessFilter(UserRepository userRepository, LicenseService licenseService, ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.licenseService = licenseService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String path = req.getRequestURI();
        if (path == null || !path.startsWith("/api/") || isAllowed(path)) {
            chain.doFilter(request, response);
            return;
        }

        UUID userId = (UUID) req.getAttribute(SessionConfig.ATTR_USER_ID);
        if (userId == null) {
            chain.doFilter(request, response);
            return;
        }

        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null || user.isAdmin() || licenseService.hasActiveLicenseAccess(userId)) {
            chain.doFilter(request, response);
            return;
        }

        String code = licenseService.resolveRestrictionCode(userId);
        resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
        resp.setContentType(MediaType.APPLICATION_JSON_VALUE);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", code != null ? code : "LICENSE_INACTIVE");
        body.put("message", "Licença inactiva. Efectue o pagamento e aguarde aprovação para continuar.");
        resp.getWriter().write(objectMapper.writeValueAsString(body));
    }

    private static boolean isAllowed(String path) {
        for (String prefix : ALLOWED_PREFIXES) {
            if (path.equals(prefix) || path.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }
}
