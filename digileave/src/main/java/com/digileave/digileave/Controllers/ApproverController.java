package com.digileave.digileave.Controllers;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.digileave.digileave.DTOs.RequestExportDto;
import com.digileave.digileave.DTOs.RequestPatchDto;
import com.digileave.digileave.DTOs.UserExportDto;
import com.digileave.digileave.Repositories.RequestRepository;
import com.digileave.digileave.Repositories.UserRepository;
import com.digileave.digileave.Models.enums.*;

@RestController
@RequestMapping("/approver")
@PreAuthorize("hasRole('APPROVER')")
public class ApproverController {

    // # DB Operations
    private final UserRepository users;
    private final RequestRepository requests;
    public ApproverController(UserRepository users, RequestRepository requests) {
        this.users = users;
        this.requests = requests;
    }

    @GetMapping("/assignees")
    public List<UserExportDto> allAssignees(@AuthenticationPrincipal String approverId) {
        var approver = users.findById(approverId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "approver not found"));

        var ids = approver.getAssigneeIds();
        if (ids == null || ids.isEmpty()) return List.of();

        var assignees = users.findAllById(ids); 
        return java.util.stream.StreamSupport.stream(assignees.spliterator(), false)
            .map(UserExportDto::from)
            .toList();
    }


    @GetMapping("/requests")
    public List<RequestExportDto> allRequests(@AuthenticationPrincipal String approverId) {
        var approver = users.findById(approverId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "approver not found"));

        var ids = approver.getAssigneeIds();
        if (ids == null || ids.isEmpty()) return List.of();

        return requests.findByUserIdIn(ids)
                   .stream()
                   .map(RequestExportDto::from)
                   .toList();
    }
    @GetMapping("/assignee/{userId}/requests")
    public List<RequestExportDto> assigneeRequests(@AuthenticationPrincipal String approverId, @PathVariable String userId) {
        var approver = users.findById(approverId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "approver not found"));

        var ids = approver.getAssigneeIds();
        if (ids == null || !ids.contains(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not your assignee");
        }

        return requests.findByUserId(userId)
                        .stream()
                        .map(RequestExportDto::from)
                        .toList();
    }


    @PatchMapping("/request/{id}")
    public RequestExportDto decide(@AuthenticationPrincipal String approverId,
                                @PathVariable String id,
                                @RequestBody java.util.Map<String, com.digileave.digileave.Models.enums.Status> body) {

        var approver = users.findById(approverId)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND, "approver not found"));

        var r = requests.findById(id)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND, "request not found"));

        var ids = approver.getAssigneeIds();
        if (ids == null || !ids.contains(r.getUserId())) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "not your assignee");
        }

        var newStatus = body.get("status");
        if (newStatus == null ||
            (newStatus != Status.APPROVED &&
            newStatus != Status.REJECTED)) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "status must be APPROVED or REJECTED");
        }

        if (r.getStatus() != com.digileave.digileave.Models.enums.Status.SUBMITTED) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "request already decided");
        }

        if (newStatus == com.digileave.digileave.Models.enums.Status.APPROVED) {
            var owner = users.findById(r.getUserId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "request owner not found"));

            owner.setAvailableLeaveDays(owner.getAvailableLeaveDays() - r.getWorkdaysCount());
            users.save(owner);
        }


        r.setStatus(newStatus);
        r.setDecidedByUserId(approverId);
        r.setDecidedAt(java.time.Instant.now());

        return RequestExportDto.from(requests.save(r));
    }

}
