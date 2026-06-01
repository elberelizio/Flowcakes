package com.chefcontrol.config;

import java.util.UUID;

public class SessionInfo {
    private final UUID userId;
    private UUID loginLogId;

    public SessionInfo(UUID userId) {
        this.userId = userId;
    }

    public SessionInfo(UUID userId, UUID loginLogId) {
        this.userId = userId;
        this.loginLogId = loginLogId;
    }

    public UUID getUserId() { return userId; }
    public UUID getLoginLogId() { return loginLogId; }
    public void setLoginLogId(UUID loginLogId) { this.loginLogId = loginLogId; }
}
