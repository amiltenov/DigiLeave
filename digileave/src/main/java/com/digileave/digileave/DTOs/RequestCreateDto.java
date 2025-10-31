package com.digileave.digileave.DTOs;

import java.time.Instant;
import java.time.LocalDate;

import com.digileave.digileave.Models.enums.LeaveType;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RequestCreateDto(

    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate startDate,

    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate endDate,
    
    @NotNull
    Integer workdaysCount,

    @NotNull
    LeaveType type,

    @Size(max = 500)
    String comment,

    Boolean decision_seen,
    
    Instant createdAt

) {
    
}
