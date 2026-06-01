package com.chefcontrol.dto;

/**
 * When the client may show the satisfaction survey (login / logout).
 * Cooldown: no new prompt within 30 days after the last submission.
 */
public class FeedbackPromptStatusDto {
    private boolean eligible;
    private boolean shouldPromptOnLogin;
    private boolean shouldPromptOnLogout;
    private String lastSubmittedAt;

    public boolean isEligible() { return eligible; }
    public void setEligible(boolean eligible) { this.eligible = eligible; }
    public boolean isShouldPromptOnLogin() { return shouldPromptOnLogin; }
    public void setShouldPromptOnLogin(boolean shouldPromptOnLogin) { this.shouldPromptOnLogin = shouldPromptOnLogin; }
    public boolean isShouldPromptOnLogout() { return shouldPromptOnLogout; }
    public void setShouldPromptOnLogout(boolean shouldPromptOnLogout) { this.shouldPromptOnLogout = shouldPromptOnLogout; }
    public String getLastSubmittedAt() { return lastSubmittedAt; }
    public void setLastSubmittedAt(String lastSubmittedAt) { this.lastSubmittedAt = lastSubmittedAt; }
}
