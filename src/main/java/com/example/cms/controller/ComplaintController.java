package com.example.cms.controller;

import com.example.cms.dto.request.CommentRequest;
import com.example.cms.dto.request.ComplaintRequest;
import com.example.cms.dto.request.RatingRequest;
import com.example.cms.dto.request.StatusUpdateRequest;
import com.example.cms.dto.response.CommentResponse;
import com.example.cms.dto.response.ComplaintResponse;
import com.example.cms.entity.Attachment;
import com.example.cms.entity.AuditLog;
import com.example.cms.entity.User;
import com.example.cms.service.AuditLogService;
import com.example.cms.service.CommentService;
import com.example.cms.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;
    private final CommentService commentService;
    private final AuditLogService auditLogService;

    // ── Create ───────────────────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ComplaintResponse> create(
            @Valid @RequestBody ComplaintRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(complaintService.createComplaint(request, currentUser));
    }

    // ── Read All (role-filtered) ──────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<Page<ComplaintResponse>> getAll(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String department) {
        return ResponseEntity.ok(complaintService.getAllComplaints(currentUser, page, size, status, department));
    }

    // ── Read One ─────────────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponse> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(complaintService.getComplaintById(id, currentUser));
    }

    // ── Update ───────────────────────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<ComplaintResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(complaintService.updateComplaint(id, request, currentUser));
    }

    // ── Delete ───────────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        complaintService.deleteComplaint(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    // ── Assign Agent (Manager only) ───────────────────────────────────────────
    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ComplaintResponse> assignAgent(
            @PathVariable Long id,
            @RequestParam Long agentId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(complaintService.assignAgent(id, agentId, currentUser));
    }

    // ── Update Status (Agent or Manager) ─────────────────────────────────────
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('AGENT', 'MANAGER')")
    public ResponseEntity<ComplaintResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(complaintService.updateStatus(id, request, currentUser));
    }

    // ── Rate Complaint (USER only, after RESOLVED) ────────────────────────────
    @PostMapping("/{id}/rate")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ComplaintResponse> rate(
            @PathVariable Long id,
            @Valid @RequestBody RatingRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(complaintService.rateComplaint(id, request, currentUser));
    }

    // ── Upload Attachment ─────────────────────────────────────────────────────
    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User currentUser) throws IOException {
        complaintService.uploadAttachment(id, file, currentUser);
        return ResponseEntity.ok("File uploaded successfully");
    }

    // ── Comments ──────────────────────────────────────────────────────────────
    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.addComment(id, request, currentUser));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(commentService.getComments(id));
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<CommentResponse> editComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(commentService.editComment(commentId, request, currentUser));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal User currentUser) {
        commentService.deleteComment(commentId, currentUser);
        return ResponseEntity.noContent().build();
    }

    // ── Audit Logs ─────────────────────────────────────────────────────────────
    @GetMapping("/{id}/audit")
    public ResponseEntity<List<AuditLog>> getAuditLogs(@PathVariable Long id) {
        return ResponseEntity.ok(auditLogService.getLogsForEntity("COMPLAINT", id));
    }

    // ── Attachments ────────────────────────────────────────────────────────────
    @GetMapping("/{id}/attachments")
    public ResponseEntity<?> getAttachments(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(complaintService.getAttachments(id, currentUser));
    }

    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long attachmentId,
            @AuthenticationPrincipal User currentUser) {
        try {
            Attachment attachment = complaintService.getAttachmentForDownload(attachmentId, currentUser);
            Path filePath = java.nio.file.Paths.get(attachment.getFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                        .contentType(org.springframework.http.MediaType.parseMediaType(attachment.getFileType()))
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
