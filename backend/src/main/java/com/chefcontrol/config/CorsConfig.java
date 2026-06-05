package com.chefcontrol.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Filtro CORS customizado para garantir que os headers CORS sejam sempre adicionados,
 * especialmente para requisições OPTIONS (preflight).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsConfig implements Filter {

    @Value("${app.cors-allowed-origins:http://localhost:4200}")
    private String corsAllowedOrigins;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String origin = httpRequest.getHeader("Origin");
        if (origin != null && isAllowedOrigin(origin)) {
            httpResponse.setHeader("Access-Control-Allow-Origin", origin);
            httpResponse.setHeader("Access-Control-Allow-Credentials", "true");
            httpResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
            // Permitir explicitamente os headers necessários, incluindo Content-Type
            httpResponse.setHeader("Access-Control-Allow-Headers", 
                "Content-Type, Authorization, X-Requested-With, X-User-Id, Accept, Origin");
            httpResponse.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
            httpResponse.setHeader("Access-Control-Max-Age", "3600");
        }

        // Se for uma requisição OPTIONS (preflight), responder imediatamente
        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            httpResponse.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean isAllowedOrigin(String origin) {
        if (origin == null || origin.isEmpty()) return false;
        String o = origin.trim();

        // Lista explícita (application.yml)
        if (corsAllowedOrigins != null && !corsAllowedOrigins.isEmpty()) {
            for (String allowed : corsAllowedOrigins.split(",")) {
                if (o.equals(allowed.trim())) return true;
            }
        }

        try {
            String host = new java.net.URL(o).getHost();
            // Flutter web / dev tools: localhost ou 127.0.0.1 em qualquer porta
            if ("localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host)) {
                return true;
            }
            // Rede local: 192.168.x.x, 10.x.x.x, 172.16-31.x.x (telemóvel / emulador)
            return host.startsWith("192.168.") || host.startsWith("10.")
                || host.matches("172\\.(1[6-9]|2[0-9]|3[0-1])\\..*");
        } catch (Exception ignore) {}
        return false;
    }
}
