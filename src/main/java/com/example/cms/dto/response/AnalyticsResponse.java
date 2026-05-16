package com.example.cms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class AnalyticsResponse {
    private long totalComplaints;
    private long openComplaints;
    private long inProgressComplaints;
    private long resolvedComplaints;
    private long closedComplaints;
    private long escalatedComplaints;
    private long resolvedLast7Days;
    private Double avgResolutionHours;
    private Map<String, Long> complaintsByDepartment;
    private Map<String, Long> complaintsByPriority;
    private Map<String, Long> complaintsByStatus;
}
