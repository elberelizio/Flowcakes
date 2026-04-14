package com.chefcontrol.config;

import java.util.UUID;

public class SessionInfo {
    private final UUID userId;

    public SessionInfo(UUID userId) {
        this.userId = userId;
    }

    public UUID getUserId() { return userId; }
}
