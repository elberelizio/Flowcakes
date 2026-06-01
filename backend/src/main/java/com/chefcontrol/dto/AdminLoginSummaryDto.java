package com.chefcontrol.dto;

public class AdminLoginSummaryDto {

    private AdminStatsResponse stats;
    private TreasurySummaryDto treasury;
    private AdminAlertsDto alerts;

    public AdminStatsResponse getStats() { return stats; }
    public void setStats(AdminStatsResponse stats) { this.stats = stats; }
    public TreasurySummaryDto getTreasury() { return treasury; }
    public void setTreasury(TreasurySummaryDto treasury) { this.treasury = treasury; }
    public AdminAlertsDto getAlerts() { return alerts; }
    public void setAlerts(AdminAlertsDto alerts) { this.alerts = alerts; }
}
