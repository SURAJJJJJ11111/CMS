package com.example.cms.service;

import com.example.cms.dto.response.AnalyticsResponse;
import com.example.cms.enums.ComplaintStatus;
import com.example.cms.enums.Department;
import com.example.cms.enums.Priority;
import com.example.cms.repository.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final ComplaintRepository complaintRepository;

    public AnalyticsResponse getSummary() {
        long total      = complaintRepository.count();
        long open       = complaintRepository.countByStatus(ComplaintStatus.OPEN);
        long inProgress = complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS);
        long resolved   = complaintRepository.countByStatus(ComplaintStatus.RESOLVED);
        long closed     = complaintRepository.countByStatus(ComplaintStatus.CLOSED);
        long escalated  = complaintRepository.countByEscalatedTrue();
        long resolvedLast7Days = complaintRepository.countResolvedSince(LocalDateTime.now().minusDays(7));
        
        List<Object[]> timestamps = complaintRepository.findResolvedComplaintsTimestamps();
        Double avgResolution = null;
        if (!timestamps.isEmpty()) {
            long totalSeconds = 0;
            for (Object[] ts : timestamps) {
                LocalDateTime created = (LocalDateTime) ts[0];
                LocalDateTime resolvedTime = (LocalDateTime) ts[1];
                totalSeconds += java.time.Duration.between(created, resolvedTime).getSeconds();
            }
            avgResolution = (double) totalSeconds / timestamps.size() / 3600.0;
        }

        // By department
        Map<String, Long> byDept = new HashMap<>();
        for (Department dept : Department.values()) {
            byDept.put(dept.name(), complaintRepository.countByDepartment(dept));
        }

        // By priority (using repository method)
        Map<String, Long> byPriority = new HashMap<>();
        for (Priority p : Priority.values()) {
            byPriority.put(p.name(), complaintRepository.countByPriority(p));
        }

        // By status
        Map<String, Long> byStatus = new HashMap<>();
        byStatus.put("OPEN", open);
        byStatus.put("IN_PROGRESS", inProgress);
        byStatus.put("RESOLVED", resolved);
        byStatus.put("CLOSED", closed);

        return AnalyticsResponse.builder()
                .totalComplaints(total)
                .openComplaints(open)
                .inProgressComplaints(inProgress)
                .resolvedComplaints(resolved)
                .closedComplaints(closed)
                .escalatedComplaints(escalated)
                .resolvedLast7Days(resolvedLast7Days)
                .avgResolutionHours(avgResolution)
                .complaintsByDepartment(byDept)
                .complaintsByPriority(byPriority)
                .complaintsByStatus(byStatus)
                .build();
    }
}
