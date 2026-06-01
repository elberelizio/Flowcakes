package com.chefcontrol.dto;

import java.util.Map;

public class TreasurySuggestionApproveRequest {

    private Map<String, Integer> allocations;

    public Map<String, Integer> getAllocations() { return allocations; }
    public void setAllocations(Map<String, Integer> allocations) { this.allocations = allocations; }
}
