package com.example.cms.service;

import com.example.cms.dto.response.EscalationResponse;
import com.example.cms.entity.Complaint;
import com.example.cms.entity.EscalationLog;
import com.example.cms.entity.User;
import com.example.cms.enums.ComplaintStatus;
import com.example.cms.exception.ResourceNotFoundException;
import com.example.cms.repository.ComplaintRepository;
import com.example.cms.repository.EscalationLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EscalationService {

    private final ComplaintRepository complaintRepository;
    private final EscalationLogRepository escalationLogRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    // ── AUTO ESCALATION: runs every hour ─────────────────────────────────────
    @Scheduled(fixedRate = 3_600_000)
    public void autoEscalateOverdueComplaints() {
        log.info("Running auto-escalation check at {}", LocalDateTime.now());

        List<Complaint> overdue = complaintRepository.findOverdueComplaints(
                List.of(ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS),
                LocalDateTime.now()
        );

        int escalated = 0;
        for (Complaint complaint : overdue) {
            escalate(complaint, null, "Auto-escalated: SLA of 48 hours breached", true);
            escalated++;
        }

        log.info("Auto-escalation complete: {} complaints escalated", escalated);
    }

    // ── MANUAL ESCALATION (Manager) ──────────────────────────────────────────
    public EscalationResponse manualEscalate(Long complaintId, String reason, User manager) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found: " + complaintId));

        if (complaint.isEscalated()) {
            throw new IllegalStateException("Complaint is already escalated");
        }

        EscalationLog log = escalate(complaint, manager, reason, false);
        return mapToResponse(log);
    }

    // ── GET ALL ESCALATIONS ──────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<EscalationResponse> getAllEscalations() {
        return escalationLogRepository.findAllByOrderByEscalatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EscalationResponse> getEscalationsForComplaint(Long complaintId) {
        return escalationLogRepository.findByComplaintIdOrderByEscalatedAtDesc(complaintId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── PRIVATE ──────────────────────────────────────────────────────────────
    private EscalationLog escalate(Complaint complaint, User manager, String reason, boolean automatic) {
        complaint.setEscalated(true);
        complaint.setEscalatedAt(LocalDateTime.now());
        complaintRepository.save(complaint);

        EscalationLog escalationLog = EscalationLog.builder()
                .complaint(complaint)
                .escalatedBy(manager)
                .reason(reason)
                .automatic(automatic)
                .build();
        EscalationLog saved = escalationLogRepository.save(escalationLog);

        notificationService.notifyEscalation(complaint.getId(), reason);
        auditLogService.log("COMPLAINT", complaint.getId(), "ESCALATED",
                manager != null ? manager.getEmail() : "SYSTEM", reason);

        return saved;
    }

    private EscalationResponse mapToResponse(EscalationLog e) {
        return EscalationResponse.builder()
                .id(e.getId())
                .complaintId(e.getComplaint().getId())
                .complaintTitle(e.getComplaint().getTitle())
                .escalatedByName(e.getEscalatedBy() != null ? e.getEscalatedBy().getName() : "SYSTEM")
                .reason(e.getReason())
                .escalatedAt(e.getEscalatedAt())
                .automatic(e.isAutomatic())
                .build();
    }
}
