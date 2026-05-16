package com.example.cms.dto.response;

import com.example.cms.enums.ComplaintStatus;
import com.example.cms.enums.Department;
import com.example.cms.enums.Priority;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ComplaintResponse {
    private Long id;
    private String title;
    private String description;
    private ComplaintStatus status;
    private Priority priority;
    private Department department;
    private UserSummary raisedBy;
    private UserSummary assignedTo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime slaDeadline;
    private boolean escalated;
    private LocalDateTime escalatedAt;
    private Integer rating;
    private String ratingFeedback;
    private int commentCount;
    private int attachmentCount;
    private boolean slaBreached;

    @Data
    @Builder
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
        private Department department;
    }
}
