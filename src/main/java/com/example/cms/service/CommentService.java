package com.example.cms.service;

import com.example.cms.dto.response.CommentResponse;
import com.example.cms.dto.request.CommentRequest;
import com.example.cms.entity.Comment;
import com.example.cms.entity.Complaint;
import com.example.cms.entity.User;
import com.example.cms.exception.ResourceNotFoundException;
import com.example.cms.repository.CommentRepository;
import com.example.cms.repository.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;
    private final ComplaintRepository complaintRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public CommentResponse addComment(Long complaintId, CommentRequest request, User currentUser) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + complaintId));

        Comment comment = Comment.builder()
                .complaint(complaint)
                .author(currentUser)
                .content(request.getContent())
                .build();

        Comment saved = commentRepository.save(comment);
        auditLogService.log("COMPLAINT", complaintId, "COMMENT_ADDED", currentUser.getEmail(),
                "Comment by " + currentUser.getName());
        notificationService.notifyNewComment(complaintId, currentUser.getId());
        return mapToResponse(saved);
    }

    public CommentResponse editComment(Long commentId, CommentRequest request, User currentUser) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        
        if (!comment.getAuthor().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Not authorized to edit this comment");
        }
        
        comment.setContent(request.getContent());
        Comment saved = commentRepository.save(comment);
        auditLogService.log("COMPLAINT", comment.getComplaint().getId(), "COMMENT_EDITED", currentUser.getEmail(),
                "Comment edited by " + currentUser.getName());
        return mapToResponse(saved);
    }

    public void deleteComment(Long commentId, User currentUser) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        
        if (!comment.getAuthor().getId().equals(currentUser.getId()) && currentUser.getRole() != com.example.cms.enums.Role.MANAGER) {
            throw new RuntimeException("Not authorized to delete this comment");
        }
        
        commentRepository.delete(comment);
        auditLogService.log("COMPLAINT", comment.getComplaint().getId(), "COMMENT_DELETED", currentUser.getEmail(),
                "Comment deleted by " + currentUser.getName());
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long complaintId) {
        return commentRepository.findByComplaintIdOrderByCreatedAtAsc(complaintId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private CommentResponse mapToResponse(Comment c) {
        return CommentResponse.builder()
                .id(c.getId())
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .authorId(c.getAuthor().getId())
                .authorName(c.getAuthor().getName())
                .authorRole(c.getAuthor().getRole().name())
                .build();
    }
}
