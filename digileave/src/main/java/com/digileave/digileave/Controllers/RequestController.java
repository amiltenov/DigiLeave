package com.digileave.digileave.Controllers;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.digileave.digileave.Models.Request;
import com.digileave.digileave.Repositories.RequestRepository;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/requests")
public class RequestController {

    private final RequestRepository requests;

    public RequestController(RequestRepository requests) {
        this.requests = requests;
    }

    @GetMapping
    public List<Request> getRequests(
            @AuthenticationPrincipal String email,
            org.springframework.security.core.Authentication authentication) {

        String userId = null;
        if (authentication != null && authentication.getDetails() instanceof String) {
            userId = (String) authentication.getDetails();
        }

        String key = (userId != null ? userId : email);
        return requests.findByUserId(key);
    }

    @PostMapping
    public Request createRequest(
            @AuthenticationPrincipal String email,
            org.springframework.security.core.Authentication authentication,
            @RequestBody Request body) {

        String userId = null;
        if (authentication != null && authentication.getDetails() instanceof String) {
            userId = (String) authentication.getDetails();
        }
        body.setUserId(userId != null ? userId : email);

        return requests.save(body);
    }
}
