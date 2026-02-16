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
        if (corsAllowedOrigins == null || corsAllowedOrigins.isEmpty()) {
            return false;
        }
        String[] allowed = corsAllowedOrigins.split(",");
        for (String allowedOrigin : allowed) {
            if (origin.trim().equals(allowedOrigin.trim())) {
                return true;
            }
        }
        return false;
    }
}
