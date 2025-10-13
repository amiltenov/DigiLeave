package com.digileave.digileave.DTOs;

import java.time.Instant;
import java.time.LocalDate;

import com.digileave.digileave.Models.enums.LeaveType;
import com.digileave.digileave.Models.enums.Status;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;

import jakarta.validation.constraints.Size;

public record RequestPatchDto(

    @NotNull
    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate startDate,

    @NotNull
    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate endDate,
    
    @NotNull
    Integer workdaysCount,

    @NotNull
    Status status,

    @NotNull
    LeaveType type,

    @Size(max = 500)
    String comment,

    Boolean decision_seen,

    String decidedByUserId,
    Instant decidedAt,

    Instant createdAt
) {
    
}
