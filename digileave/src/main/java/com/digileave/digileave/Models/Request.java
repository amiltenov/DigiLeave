package com.digileave.digileave.Models;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;

import com.digileave.digileave.Models.enums.*; 

@Document(collection = "requests")
public class Request {

    @Id
    private String id;

    // Requesting  person's id
    private String userEmail;

    // # SINGLE DATES   <------------------\
    private LocalDate startDate;//#         \
    private LocalDate endDate;//#            |
    // #                                     |
    // # CALCULATE DAYS DATE TO DATE   -----/
    private int workdaysCount;

    // Default is submitted
    private Status status = Status.SUBMITTED;

    // Comment
    private String comment;

    // audit
    private String approvedByUserId;  // approver id who made the decision
    private Instant approvedAt;



    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userEmail; }
    public void setUserId(String userId) { this.userEmail = userEmail; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public int getWorkdaysCount() { return workdaysCount; }
    public void setWorkdaysCount(int workdaysCount) { this.workdaysCount = workdaysCount; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getDecidedByUserId() { return approvedByUserId; }
    public void setDecidedByUserId(String decidedByUserId) { this.approvedByUserId = decidedByUserId; }

    public Instant getDecidedAt() { return approvedAt; }
    public void setDecidedAt(Instant decidedAt) { this.approvedAt = decidedAt; }


}

