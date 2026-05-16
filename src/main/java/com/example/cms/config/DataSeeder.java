package com.example.cms.config;

import com.example.cms.entity.User;
import com.example.cms.enums.Department;
import com.example.cms.enums.Role;
import com.example.cms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByEmail("user@demo.com")) {
            userRepository.save(User.builder()
                    .name("Demo User")
                    .email("user@demo.com")
                    .password(passwordEncoder.encode("demo123"))
                    .role(Role.USER)
                    .build());
        }
        
        if (!userRepository.existsByEmail("agent@demo.com")) {
            userRepository.save(User.builder()
                    .name("Demo Agent")
                    .email("agent@demo.com")
                    .password(passwordEncoder.encode("demo123"))
                    .role(Role.AGENT)
                    .department(Department.IT)
                    .build());
        }
        
        if (!userRepository.existsByEmail("manager@demo.com")) {
            userRepository.save(User.builder()
                    .name("Demo Manager")
                    .email("manager@demo.com")
                    .password(passwordEncoder.encode("demo123"))
                    .role(Role.MANAGER)
                    .department(Department.IT)
                    .build());
        }
    }
}
