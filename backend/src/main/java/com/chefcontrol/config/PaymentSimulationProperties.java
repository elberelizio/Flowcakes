package com.chefcontrol.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.payment.simulation")
public class PaymentSimulationProperties {

    /** Se true, o fluxo de pagamento de licença não chama API externa; grava pedido simulado e notifica admins. */
    private boolean enabled = true;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
