package com.example.cms.service;

import com.example.cms.dto.response.NotificationResponse;
import com.example.cms.entity.Notification;
import com.example.cms.entity.User;
import com.example.cms.repository.ComplaintRepository;
import com.example.cms.repository.NotificationRepository;
import com.example.cms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final JavaMailSender mailSender;
    private final ComplaintRepository complaintRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private void createAndPush(User user, String title, String message, String type, Long complaintId) {
        Notification n = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .complaintId(complaintId)
                .build();
        Notification saved = notificationRepository.save(n);
        
        try {
            messagingTemplate.convertAndSend(
                    "/topic/notifications/" + user.getId(),
                    mapToResponse(saved));
        } catch (Exception e) {
            log.warn("Could not push WebSocket notification: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAllRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public void markRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUser().getId().equals(userId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    @Async
    @Transactional
    public void notifyNewComplaint(Long complaintId) {
        complaintRepository.findById(complaintId).ifPresent(complaint -> {
            String subject = "[CMS] New Complaint Raised: #" + complaint.getId();
            String body = String.format(
                    "A new complaint has been raised.\n\nTitle: %s\nPriority: %s\nDepartment: %s\n\nPlease review and assign an agent.",
                    complaint.getTitle(), complaint.getPriority(), complaint.getDepartment());
            sendMail(complaint.getRaisedBy().getEmail(), subject, body);
        });
    }

    @Async
    @Transactional
    public void notifyStatusChange(Long complaintId) {
        complaintRepository.findById(complaintId).ifPresent(complaint -> {
            createAndPush(complaint.getRaisedBy(),
                    "Status Updated",
                    "Complaint #" + complaint.getId() + " status changed to " + complaint.getStatus(),
                    "STATUS_CHANGED",
                    complaint.getId());

            String subject = "[CMS] Complaint #" + complaint.getId() + " status updated to " + complaint.getStatus();
            String body = String.format(
                    "Your complaint \"%s\" has been updated.\n\nNew Status: %s",
                    complaint.getTitle(), complaint.getStatus());
            sendMail(complaint.getRaisedBy().getEmail(), subject, body);
        });
    }

    @Async
    @Transactional
    public void notifyAgentAssigned(Long complaintId, User agent) {
        complaintRepository.findById(complaintId).ifPresent(complaint -> {
            createAndPush(agent,
                    "New Complaint Assigned",
                    "Complaint #" + complaint.getId() + " has been assigned to you.",
                    "ASSIGNED",
                    complaint.getId());

            String subject = "[CMS] Complaint #" + complaint.getId() + " assigned to you";
            String body = String.format(
                    "Hello %s,\n\nYou have been assigned a new complaint.\n\nTitle: %s\nPriority: %s\nDepartment: %s",
                    agent.getName(), complaint.getTitle(), complaint.getPriority(), complaint.getDepartment());
            sendMail(agent.getEmail(), subject, body);
        });
    }

    @Async
    @Transactional
    public void notifyEscalation(Long complaintId, String reason) {
        complaintRepository.findById(complaintId).ifPresent(complaint -> {
            createAndPush(complaint.getRaisedBy(),
                    "Complaint Escalated",
                    "Complaint #" + complaint.getId() + " has been escalated.",
                    "ESCALATED",
                    complaint.getId());

            String subject = "[CMS] ESCALATED: Complaint #" + complaint.getId();
            String body = String.format(
                    "Complaint #%d \"%s\" has been escalated.\n\nReason: %s\n\nImmediate attention required.",
                    complaint.getId(), complaint.getTitle(), reason);
            sendMail(complaint.getRaisedBy().getEmail(), subject, body);
        });
    }

    @Async
    @Transactional
    public void notifyNewComment(Long complaintId, Long commenterId) {
        complaintRepository.findById(complaintId).ifPresent(complaint -> {
            userRepository.findById(commenterId).ifPresent(commenter -> {
                if (!complaint.getRaisedBy().getId().equals(commenter.getId())) {
                    createAndPush(complaint.getRaisedBy(),
                            "New Comment",
                            commenter.getName() + " commented on complaint #" + complaint.getId(),
                            "COMMENT_ADDED",
                            complaint.getId());
                }
                if (complaint.getAssignedTo() != null &&
                        !complaint.getAssignedTo().getId().equals(commenter.getId())) {
                    createAndPush(complaint.getAssignedTo(),
                            "New Comment",
                            commenter.getName() + " commented on complaint #" + complaint.getId(),
                            "COMMENT_ADDED",
                            complaint.getId());
                }
            });
        });
    }

    private void sendMail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .complaintId(n.getComplaintId())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
