package com.example.cms.controller;

import com.example.cms.entity.User;
import com.example.cms.enums.Department;
import com.example.cms.enums.Role;
import com.example.cms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(user);
    }

    @GetMapping("/agents")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<User>> getAgents(
            @RequestParam(required = false) String department) {
        List<User> agents;
        if (department != null) {
            agents = userRepository.findByRoleAndDepartment(Role.AGENT, Department.valueOf(department));
        } else {
            agents = userRepository.findByRole(Role.AGENT);
        }
        return ResponseEntity.ok(agents);
    }

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }
}
