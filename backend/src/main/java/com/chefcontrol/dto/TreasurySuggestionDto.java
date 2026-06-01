package com.chefcontrol.dto;

import java.util.Map;

public class TreasurySuggestionDto {

    private String id;
    private String suggestionType;
    private String title;
    private String message;
    private Map<String, Integer> proposedAllocations;
    private String status;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSuggestionType() { return suggestionType; }
    public void setSuggestionType(String suggestionType) { this.suggestionType = suggestionType; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Map<String, Integer> getProposedAllocations() { return proposedAllocations; }
    public void setProposedAllocations(Map<String, Integer> proposedAllocations) { this.proposedAllocations = proposedAllocations; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
