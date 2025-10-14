package com.digileave.digileave.Controllers;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.digileave.digileave.DTOs.RequestCreateDto;
import com.digileave.digileave.DTOs.RequestExportDto;
import com.digileave.digileave.Models.Request;
import com.digileave.digileave.Models.enums.Status;
import com.digileave.digileave.Repositories.RequestRepository;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/requests")
public class RequestController {

    // # DB Operations
    private final RequestRepository requests;
    public RequestController(RequestRepository requests) {
        this.requests = requests;
    }

    // # Get All User Requests
    @GetMapping
    public List<RequestExportDto> getRequests(Authentication authentication){
        String userId = null;
        if (authentication != null && authentication.getDetails() instanceof String) {
            userId = (String) authentication.getPrincipal();
        }
        return requests.findByUserId(userId)
                   .stream()
                   .map(RequestExportDto::from)
                   .toList();
    }


    // # Create Request
    @PostMapping
    public Request createRequest(Authentication authentication, @jakarta.validation.Valid @RequestBody RequestCreateDto body) {
        String userId = null;
        if (authentication != null && authentication.getDetails() instanceof String) {
            userId = (String) authentication.getPrincipal();
        }
        var request = new Request();
        request.setUserId(userId);
        request.setStartDate(body.startDate());
        request.setEndDate(body.endDate());
        request.setWorkdaysCount(body.workdaysCount());
        request.setType(body.type());
        request.setComment(body.comment());

        return requests.save(request);
    }

    @PatchMapping("/{id}/cancel")
    public RequestExportDto cancelOwnRequest(@AuthenticationPrincipal String userId, @PathVariable("id") String requestId) {
        var req = requests.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        if (!req.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can cancel only your own requests");
        }
        if (req.getStatus() == Status.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only PENDING requests can be cancelled");
        }
        if (req.getStatus() != Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only PENDING requests can be cancelled");
        }

        req.setStatus(Status.CANCELLED);
        req.setDecidedAt(java.time.Instant.now());
        var saved = requests.save(req);
        return RequestExportDto.from(saved); // ! PATCH DTO NOT WORKING
    }
    

    @PatchMapping("/{id}/decision-seen")
    public RequestExportDto seeDecision(@AuthenticationPrincipal String userId, @PathVariable("id") String requestId) {
        var req = requests.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        if (!req.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can see the decision only on your own requests");
        }

        req.setDecision_Seen(true);
        var saved = requests.save(req);
        return RequestExportDto.from(saved); // ! PATCH DTO NOT WORKING
    }
}
