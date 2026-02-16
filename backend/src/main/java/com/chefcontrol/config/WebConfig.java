package com.chefcontrol.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final CurrentUserIdResolver currentUserIdResolver;

    public WebConfig(CurrentUserIdResolver currentUserIdResolver) {
        this.currentUserIdResolver = currentUserIdResolver;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        // Prioridade para resolver @CurrentUserId a partir da sessão (cookie ou header X-User-Id)
        resolvers.add(0, currentUserIdResolver);
    }

    // CORS está configurado via CorsConfig (filtro customizado com maior prioridade)
}
