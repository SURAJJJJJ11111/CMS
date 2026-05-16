package com.example.cms.service;

import com.example.cms.dto.request.CommentRequest;
import com.example.cms.dto.request.ComplaintRequest;
import com.example.cms.dto.request.RatingRequest;
import com.example.cms.dto.request.StatusUpdateRequest;
import com.example.cms.dto.response.AttachmentResponse;
import com.example.cms.dto.response.ComplaintResponse;
import com.example.cms.entity.Attachment;
import com.example.cms.entity.Comment;
import com.example.cms.entity.Complaint;
import com.example.cms.entity.User;
import com.example.cms.enums.ComplaintStatus;
import com.example.cms.enums.Department;
import com.example.cms.enums.Role;
import com.example.cms.exception.AccessDeniedException;
import com.example.cms.exception.ResourceNotFoundException;
import com.example.cms.exception.WorkflowException;
import com.example.cms.repository.AttachmentRepository;
import com.example.cms.repository.ComplaintRepository;
import com.example.cms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final AttachmentRepository attachmentRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${file.upload-dir}")
    private String uploadDir;

    // ── Status workflow valid transitions ───────────────────────────────────
    private void validateTransition(ComplaintStatus current, ComplaintStatus next) {
        boolean valid = switch (current) {
            case OPEN -> next == ComplaintStatus.IN_PROGRESS || next == ComplaintStatus.CLOSED;
            case IN_PROGRESS -> next == ComplaintStatus.RESOLVED || next == ComplaintStatus.OPEN;
            case RESOLVED -> next == ComplaintStatus.CLOSED || next == ComplaintStatus.IN_PROGRESS;
            case CLOSED -> false;
        };
        if (!valid) {
            throw new WorkflowException("Invalid status transition: " + current + " → " + next);
        }
    }

    // ── CREATE ──────────────────────────────────────────────────────────────
    public ComplaintResponse createComplaint(ComplaintRequest request, User currentUser) {
        Complaint complaint = Complaint.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .department(request.getDepartment())
                .raisedBy(currentUser)
                .build();

        Complaint saved = complaintRepository.save(complaint);
        auditLogService.log("COMPLAINT", saved.getId(), "CREATE", currentUser.getEmail(),
                "Complaint created: " + saved.getTitle());
        notificationService.notifyNewComplaint(saved.getId());
        return mapToResponse(saved);
    }

    // ── READ ALL (role-filtered, priority-sorted) ───────────────────────────
    @Transactional(readOnly = true)
    public Page<ComplaintResponse> getAllComplaints(User currentUser, int page, int size,
                                                    String status, String department) {
        // Sort: CRITICAL > HIGH > MEDIUM > LOW, then by createdAt ASC
        Sort sort = Sort.by(Sort.Direction.DESC, "priority")
                .and(Sort.by(Sort.Direction.ASC, "createdAt"));
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Complaint> complaints;
        if (currentUser.getRole() == Role.USER) {
            complaints = complaintRepository.findByRaisedById(currentUser.getId(), pageable);
        } else if (currentUser.getRole() == Role.AGENT) {
            complaints = complaintRepository.findByAssignedToId(currentUser.getId(), pageable);
        } else {
            // Manager sees all
            if (status != null) {
                complaints = complaintRepository.findByStatus(
                        ComplaintStatus.valueOf(status), pageable);
            } else if (department != null) {
                complaints = complaintRepository.findByDepartment(
                        Department.valueOf(department), pageable);
            } else {
                complaints = complaintRepository.findAll(pageable);
            }
        }

        return complaints.map(this::mapToResponse);
    }

    // ── READ ONE ────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ComplaintResponse getComplaintById(Long id, User currentUser) {
        Complaint complaint = findComplaintById(id);
        checkReadAccess(complaint, currentUser);
        return mapToResponse(complaint);
    }

    // ── UPDATE ──────────────────────────────────────────────────────────────
    public ComplaintResponse updateComplaint(Long id, ComplaintRequest request, User currentUser) {
        Complaint complaint = findComplaintById(id);

        // Only owner or manager can edit
        if (currentUser.getRole() == Role.USER && !complaint.getRaisedBy().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only edit your own complaints");
        }
        if (complaint.getStatus() != ComplaintStatus.OPEN) {
            throw new WorkflowException("Can only edit complaints in OPEN status");
        }

        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setPriority(request.getPriority());
        complaint.setDepartment(request.getDepartment());

        Complaint saved = complaintRepository.save(complaint);
        auditLogService.log("COMPLAINT", saved.getId(), "UPDATE", currentUser.getEmail(), "Complaint updated");
        return mapToResponse(saved);
    }

    // ── DELETE ──────────────────────────────────────────────────────────────
    public void deleteComplaint(Long id, User currentUser) {
        Complaint complaint = findComplaintById(id);
        if (currentUser.getRole() != Role.MANAGER &&
                !complaint.getRaisedBy().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Insufficient permissions to delete this complaint");
        }
        auditLogService.log("COMPLAINT", id, "DELETE", currentUser.getEmail(), "Complaint deleted: " + complaint.getTitle());
        complaintRepository.delete(complaint);
    }

    // ── ASSIGN AGENT ────────────────────────────────────────────────────────
    public ComplaintResponse assignAgent(Long complaintId, Long agentId, User currentUser) {
        Complaint complaint = findComplaintById(complaintId);
        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found"));

        if (agent.getRole() != Role.AGENT) {
            throw new WorkflowException("User is not an agent");
        }
        if (agent.getDepartment() != complaint.getDepartment()) {
            throw new WorkflowException("Agent department (" + agent.getDepartment() +
                    ") does not match complaint department (" + complaint.getDepartment() + ")");
        }

        complaint.setAssignedTo(agent);
        if (complaint.getStatus() == ComplaintStatus.OPEN) {
            complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        }

        Complaint saved = complaintRepository.save(complaint);
        auditLogService.log("COMPLAINT", complaintId, "ASSIGN", currentUser.getEmail(),
                "Assigned to agent: " + agent.getName());
        notificationService.notifyAgentAssigned(saved.getId(), agent);
        broadcastStatusUpdate(saved);
        return mapToResponse(saved);
    }

    // ── UPDATE STATUS ───────────────────────────────────────────────────────
    public ComplaintResponse updateStatus(Long id, StatusUpdateRequest request, User currentUser) {
        Complaint complaint = findComplaintById(id);

        // Agent must be the assigned agent
        if (currentUser.getRole() == Role.AGENT &&
                (complaint.getAssignedTo() == null ||
                 !complaint.getAssignedTo().getId().equals(currentUser.getId()))) {
            throw new AccessDeniedException("You are not assigned to this complaint");
        }

        validateTransition(complaint.getStatus(), request.getStatus());

        ComplaintStatus oldStatus = complaint.getStatus();
        complaint.setStatus(request.getStatus());

        if (request.getStatus() == ComplaintStatus.RESOLVED) {
            complaint.setResolvedAt(LocalDateTime.now());
        }

        // Add system comment if message provided
        if (request.getComment() != null && !request.getComment().isBlank()) {
            Comment comment = Comment.builder()
                    .complaint(complaint)
                    .author(currentUser)
                    .content("[Status Update: " + oldStatus + " → " + request.getStatus() + "] " + request.getComment())
                    .build();
            complaint.getComments().add(comment);
        }

        Complaint saved = complaintRepository.save(complaint);
        auditLogService.log("COMPLAINT", id, "STATUS_UPDATE", currentUser.getEmail(),
                oldStatus + " → " + request.getStatus());
        notificationService.notifyStatusChange(saved.getId());
        broadcastStatusUpdate(saved);
        return mapToResponse(saved);
    }

    // ── RATE COMPLAINT ──────────────────────────────────────────────────────
    public ComplaintResponse rateComplaint(Long id, RatingRequest request, User currentUser) {
        Complaint complaint = findComplaintById(id);

        if (!complaint.getRaisedBy().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the complaint owner can rate it");
        }
        if (complaint.getStatus() != ComplaintStatus.RESOLVED &&
                complaint.getStatus() != ComplaintStatus.CLOSED) {
            throw new WorkflowException("Can only rate RESOLVED or CLOSED complaints");
        }

        complaint.setRating(request.getRating());
        complaint.setRatingFeedback(request.getFeedback());

        Complaint saved = complaintRepository.save(complaint);
        auditLogService.log("COMPLAINT", id, "RATED", currentUser.getEmail(),
                "Rating: " + request.getRating() + "/5");
        return mapToResponse(saved);
    }

    // ── UPLOAD ATTACHMENT ───────────────────────────────────────────────────
    public void uploadAttachment(Long complaintId, MultipartFile file, User currentUser) throws IOException {
        Complaint complaint = findComplaintById(complaintId);
        checkReadAccess(complaint, currentUser);

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        Attachment attachment = Attachment.builder()
                .complaint(complaint)
                .fileName(file.getOriginalFilename())
                .fileType(file.getContentType())
                .filePath(filePath.toString())
                .fileSize(file.getSize())
                .build();

        attachmentRepository.save(attachment);
        auditLogService.log("COMPLAINT", complaintId, "ATTACHMENT_UPLOAD", currentUser.getEmail(),
                "File: " + file.getOriginalFilename());
    }

    // ── GET ATTACHMENTS ─────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<AttachmentResponse> getAttachments(Long complaintId, User currentUser) {
        Complaint complaint = findComplaintById(complaintId);
        checkReadAccess(complaint, currentUser);
        return attachmentRepository.findByComplaintId(complaintId)
                .stream().map(a -> AttachmentResponse.builder()
                        .id(a.getId())
                        .fileName(a.getFileName())
                        .fileType(a.getFileType())
                        .fileSize(a.getFileSize())
                        .uploadedAt(a.getUploadedAt())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }

    // ── DOWNLOAD ATTACHMENT ─────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Attachment getAttachmentForDownload(Long attachmentId, User currentUser) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));
        checkReadAccess(attachment.getComplaint(), currentUser);
        return attachment;
    }

    // ── HELPERS ─────────────────────────────────────────────────────────────
    private Complaint findComplaintById(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));
    }

    private void checkReadAccess(Complaint complaint, User user) {
        if (user.getRole() == Role.USER && !complaint.getRaisedBy().getId().equals(user.getId())) {
            throw new AccessDeniedException("You don't have access to this complaint");
        }
        if (user.getRole() == Role.AGENT &&
                (complaint.getAssignedTo() == null ||
                 !complaint.getAssignedTo().getId().equals(user.getId()))) {
            throw new AccessDeniedException("This complaint is not assigned to you");
        }
    }

    private void broadcastStatusUpdate(Complaint complaint) {
        messagingTemplate.convertAndSend(
                "/topic/complaints/" + complaint.getId(),
                mapToResponse(complaint));
    }

    public ComplaintResponse mapToResponse(Complaint c) {
        boolean slaBreached = c.getSlaDeadline() != null &&
                LocalDateTime.now().isAfter(c.getSlaDeadline()) &&
                c.getStatus() != ComplaintStatus.RESOLVED &&
                c.getStatus() != ComplaintStatus.CLOSED;

        return ComplaintResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .description(c.getDescription())
                .status(c.getStatus())
                .priority(c.getPriority())
                .department(c.getDepartment())
                .raisedBy(userSummary(c.getRaisedBy()))
                .assignedTo(c.getAssignedTo() != null ? userSummary(c.getAssignedTo()) : null)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .resolvedAt(c.getResolvedAt())
                .slaDeadline(c.getSlaDeadline())
                .escalated(c.isEscalated())
                .escalatedAt(c.getEscalatedAt())
                .rating(c.getRating())
                .ratingFeedback(c.getRatingFeedback())
                .commentCount(c.getComments().size())
                .attachmentCount(c.getAttachments().size())
                .slaBreached(slaBreached)
                .build();
    }

    private ComplaintResponse.UserSummary userSummary(User u) {
        if (u == null) return null;
        return ComplaintResponse.UserSummary.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .department(u.getDepartment())
                .build();
    }
}
