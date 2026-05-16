package com.example.cms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "escalation_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EscalationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escalated_by_id")
    private User escalatedBy;

    @Column(nullable = false)
    private String reason;

    @Column(updatable = false)
    private LocalDateTime escalatedAt;

    @Column(name = "is_automatic")
    @Builder.Default
    private boolean automatic = false;

    @PrePersist
    protected void onCreate() {
        this.escalatedAt = LocalDateTime.now();
    }
}
