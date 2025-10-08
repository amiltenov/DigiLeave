package com.digileave.digileave.DTOs;


import com.digileave.digileave.Models.enums.Role;
import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.Email;
// import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import java.time.LocalDate;
import java.util.List;

public record UserPatchDto(
    
        @Email
        // ! IN PRODUCTION UNCOMMENT EMAIL DOMAIN CHECK
        // @Pattern(regexp = "^[A-Za-z0-9._%+-]+@digitoll\\.bg$",
        //          message = "Email must be a @digitoll.bg address")
        String email,

        @Size(min = 2, max = 100)
        String fullName,

        Role role,

        @Min(0) @Max(60)
        Integer availableLeaveDays,

        @Min(0)
        Integer contractLeaveDays,

        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate workingSince,

        List<String> assigneeIds
) {}