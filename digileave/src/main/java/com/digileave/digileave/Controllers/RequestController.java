package com.digileave.digileave.Controllers;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.digileave.digileave.DTOs.RequestCreateDto;
import com.digileave.digileave.DTOs.RequestExportDto;
import com.digileave.digileave.Models.Request;
import com.digileave.digileave.Repositories.RequestRepository;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

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
}
