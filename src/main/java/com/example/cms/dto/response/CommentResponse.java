package com.example.cms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CommentResponse {
    private Long id;
    private String content;
    private LocalDateTime createdAt;
    private Long authorId;
    private String authorName;
    private String authorRole;
}
