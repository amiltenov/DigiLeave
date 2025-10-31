package com.digileave.digileave.Models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;

import com.digileave.digileave.Models.enums.*; 


@Document(collection = "requests")
public class Request {

    @Id
    private String id;

    @Indexed
    private String userId;

    private LocalDate startDate;
    private LocalDate endDate;
    private int workdaysCount;

    @Indexed
    private Status status = Status.PENDING;

    @Indexed
    private LeaveType type;
    
    private String comment;

    private Boolean decision_seen = true;
    
    // Audit
    private String decidedByUserId;
    private Instant decidedAt;
    private Instant createdAt = Instant.now();

    
    
    // # Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    
    public int getWorkdaysCount() { return workdaysCount; }
    public void setWorkdaysCount(int workdaysCount) { this.workdaysCount = workdaysCount; }
    
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    
    public LeaveType getType() { return type; }
    public void setType(LeaveType type) { this.type = type; }
    
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    
    public Boolean getDecision_Seen() { return decision_seen; }
    public void setDecision_Seen(Boolean decision_seen) { this.decision_seen = decision_seen; }
    
    public String getDecidedByUserId() { return decidedByUserId; }
    public void setDecidedByUserId(String decidedByUserId) { this.decidedByUserId = decidedByUserId; }
    
    public Instant getDecidedAt() { return decidedAt; }
    public void setDecidedAt(Instant decidedAt) { this.decidedAt = decidedAt; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    
}