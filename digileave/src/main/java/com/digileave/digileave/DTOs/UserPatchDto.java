package com.digileave.digileave.DTOs;


import com.digileave.digileave.Models.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UserPatchDto(
    
        @Email
        @Pattern(regexp = "^[A-Za-z0-9._%+-]+@digitoll\\.bg$",
                 message = "Email must be a @digitoll.bg address")
        String email,

        @Size(min = 2, max = 100)
        String fullName,

        Role role,

        @Size(min = 0, max = 60)
        Integer availableLeaveDays,

        List<String> assigneeIds
) {}