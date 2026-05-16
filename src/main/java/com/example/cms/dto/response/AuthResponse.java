package com.example.cms.dto.response;

import com.example.cms.enums.Department;
import com.example.cms.enums.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String type;
    private Long id;
    private String name;
    private String email;
    private Role role;
    private Department department;
}
