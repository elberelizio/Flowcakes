package com.chefcontrol.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sessão por cookie HttpOnly. Guarda userId.
 */
@Component
@Order(1)
public class SessionConfig implements Filter {

    public static final String COOKIE_NAME = "CHEFCONTROL_SESSION";
    /** Fallback quando o cookie não chega (ex.: CORS/SameSite): header com UUID do utilizador */
    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String ATTR_USER_ID = "userId";
    public static final String ATTR_SESSION_INFO = "sessionInfo";

    private static final ConcurrentHashMap<UUID, SessionInfo> sessions = new ConcurrentHashMap<>();

    public static UUID createSession(UUID userId) {
        UUID sessionId = UUID.randomUUID();
        sessions.put(sessionId, new SessionInfo(userId));
        return sessionId;
    }

    public static void removeSession(UUID sessionId) {
        if (sessionId != null) sessions.remove(sessionId);
    }

    public static SessionInfo getSessionInfo(UUID sessionId) {
        return sessionId == null ? null : sessions.get(sessionId);
    }

    public static UUID getUserIdForSession(UUID sessionId) {
        SessionInfo info = getSessionInfo(sessionId);
        return info == null ? null : info.getUserId();
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        UUID sessionId = null;
        jakarta.servlet.http.Cookie[] cookies = req.getCookies();
        if (cookies != null) {
            for (jakarta.servlet.http.Cookie c : cookies) {
                if (COOKIE_NAME.equals(c.getName())) {
                    try {
                        sessionId = UUID.fromString(c.getValue());
                    } catch (Exception ignored) {}
                    break;
                }
            }
        }
        SessionInfo info = getSessionInfo(sessionId);
        UUID userId = info == null ? null : info.getUserId();
        // Fallback: se não há sessão por cookie (ex.: cookie não enviado), usar header X-User-Id
        if (userId == null) {
            String headerUserId = req.getHeader(HEADER_USER_ID);
            if (headerUserId != null && !headerUserId.isBlank()) {
                try {
                    userId = UUID.fromString(headerUserId.trim());
                } catch (IllegalArgumentException ignored) {}
            }
        }
        req.setAttribute(ATTR_USER_ID, userId);
        req.setAttribute(ATTR_SESSION_INFO, info);
        chain.doFilter(request, response);
    }
}
