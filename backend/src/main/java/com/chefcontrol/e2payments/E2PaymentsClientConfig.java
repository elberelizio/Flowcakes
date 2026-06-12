package com.chefcontrol.e2payments;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class E2PaymentsClientConfig {

    @Bean(name = "e2PaymentsRestTemplate")
    RestTemplate e2PaymentsRestTemplate(RestTemplateBuilder builder) {
        return builder
            .setConnectTimeout(Duration.ofSeconds(30))
            .setReadTimeout(Duration.ofSeconds(60))
            .build();
    }
}
