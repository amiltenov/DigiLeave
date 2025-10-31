package com.digileave.digileave.DTOs;

import com.digileave.digileave.Models.User;
import com.digileave.digileave.Models.enums.Role;

import java.time.LocalDate;
import java.util.List;

public record UserExportDto(
        String id,
        String email,
        String fullName,
        Role role,
        Integer availableLeaveDays,
        Integer contractLeaveDays,
        LocalDate workingSince,
        List<String> assigneeIds
) {
    public static UserExportDto from(User user) {
        return new UserExportDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getAvailableLeaveDays(),
                user.getContractLeaveDays(),
                user.getWorkingSince(),
                user.getAssigneeIds()
        );
    }
}