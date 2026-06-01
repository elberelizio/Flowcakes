package com.chefcontrol.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TrackActivityRequest {

    @NotBlank
    @Size(max = 30)
    private String activityType;

    @Size(max = 500)
    private String pagePath;

    @Size(max = 200)
    private String operation;

    @Size(max = 2000)
    private String detail;

    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }
    public String getPagePath() { return pagePath; }
    public void setPagePath(String pagePath) { this.pagePath = pagePath; }
    public String getOperation() { return operation; }
    public void setOperation(String operation) { this.operation = operation; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
}
