package com.digileave.digileave.DTOs;

import java.time.Instant;
import java.time.LocalDate;

import com.digileave.digileave.Models.enums.Status;
import com.digileave.digileave.Models.Request;
import com.digileave.digileave.Models.enums.LeaveType;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RequestExportDto(
    String id,
    String userId,
    LocalDate startDate,
    LocalDate endDate,
    Integer workdaysCount,
    Status status,
    LeaveType type,
    String comment,
    String decidedByUserId,
    Instant decidedAt
) {
    public static RequestExportDto from(Request request){
        return new RequestExportDto(
            request.getId(),
            request.getUserId(),
            request.getStartDate(),
            request.getEndDate(),
            request.getWorkdaysCount(),
            request.getStatus(),
            request.getType(),
            request.getComment(),
            request.getDecidedByUserId(),
            request.getDecidedAt()
        );
    }
    
}