package com.chefcontrol.config;

import java.util.UUID;

public class SessionInfo {
    private final UUID userId;
    private boolean licenseCodeValidated;

    public SessionInfo(UUID userId) {
        this.userId = userId;
        this.licenseCodeValidated = false;
    }

    public UUID getUserId() { return userId; }
    public boolean isLicenseCodeValidated() { return licenseCodeValidated; }
    public void setLicenseCodeValidated(boolean licenseCodeValidated) { this.licenseCodeValidated = licenseCodeValidated; }
}
