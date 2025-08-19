package com.digileave.digileave.Controllers;

import com.digileave.digileave.DatabaseOps.RequestRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.digileave.digileave.Models.Request;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
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

    @GetMapping({ "", "/" })
    public List<Request> getRequests(@AuthenticationPrincipal OAuth2User currentUser) {
        if (currentUser == null || currentUser.getAttributes().get("email") == null) {
            throw new RuntimeException("No authenticated user email found.");
        }
        String email = currentUser.getAttributes().get("email").toString();
        return requests.findByEmail(email);
    }
    @PostMapping
    public Request createRequest(
            @AuthenticationPrincipal OAuth2User currentUser,
            @RequestBody Request body) {

        String email = currentUser.getAttributes().get("email").toString();
        body.setUserEmail(email);

        return requests.save(body);
    }
}
