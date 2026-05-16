package com.example.cms.controller;

import com.example.cms.dto.response.EscalationResponse;
import com.example.cms.entity.User;
import com.example.cms.service.EscalationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/escalations")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class EscalationController {

    private final EscalationService escalationService;

    @GetMapping
    public ResponseEntity<List<EscalationResponse>> getAllEscalations() {
        return ResponseEntity.ok(escalationService.getAllEscalations());
    }

    @GetMapping("/complaint/{complaintId}")
    public ResponseEntity<List<EscalationResponse>> getForComplaint(@PathVariable Long complaintId) {
        return ResponseEntity.ok(escalationService.getEscalationsForComplaint(complaintId));
    }

    @PostMapping("/{complaintId}/manual")
    public ResponseEntity<EscalationResponse> manualEscalate(
            @PathVariable Long complaintId,
            @RequestParam String reason,
            @AuthenticationPrincipal User manager) {
        return ResponseEntity.ok(escalationService.manualEscalate(complaintId, reason, manager));
    }
}
