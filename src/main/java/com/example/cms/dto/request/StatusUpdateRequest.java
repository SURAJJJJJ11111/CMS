package com.example.cms.dto.request;

import com.example.cms.enums.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StatusUpdateRequest {

    @NotNull(message = "Status is required")
    private ComplaintStatus status;

    private String comment;
}
