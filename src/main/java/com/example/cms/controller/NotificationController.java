package com.example.cms.controller;

import com.example.cms.dto.response.NotificationResponse;
import com.example.cms.entity.User;
import com.example.cms.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(notificationService.getNotifications(currentUser.getId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(currentUser.getId())));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        notificationService.markRead(id, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal User currentUser) {
        notificationService.markAllRead(currentUser.getId());
        return ResponseEntity.ok().build();
    }
}
