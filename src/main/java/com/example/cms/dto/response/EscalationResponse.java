package com.example.cms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class EscalationResponse {
    private Long id;
    private Long complaintId;
    private String complaintTitle;
    private String escalatedByName;
    private String reason;
    private LocalDateTime escalatedAt;
    private boolean automatic;
}
