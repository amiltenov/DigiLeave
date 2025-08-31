package com.digileave.digileave.Controllers;

import com.digileave.digileave.Models.User;
import com.digileave.digileave.Models.enums.Role;
import com.digileave.digileave.Repositories.UserRepository;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.time.Duration;
import java.util.Map;

@Controller
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository users;
    private final com.digileave.digileave.Services.JwtService jwtService;

    public AuthController(UserRepository users, com.digileave.digileave.Services.JwtService jwtService) {
        this.users = users;
        this.jwtService = jwtService;
    }

    @GetMapping(value = "/jwt", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> issueJwt(
            @AuthenticationPrincipal OAuth2User principal,
            Authentication authentication) {

        if (principal == null && authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
            principal = (OAuth2User) authentication.getPrincipal();
        }
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }

        System.out.println("HIT /auth/jwt, principal=" + principal.getAttributes());

        String email = principal.getAttribute("email");
        String name  = principal.getAttribute("name");

        User u = users.findByEmail(email).orElseGet(() -> {
            User nu = new User();
            nu.setEmail(email);
            nu.setFullName(name);
            nu.setRole(Role.USER);
            return users.save(nu);
        });

        String token = jwtService.createJwtToken(
            u.getId(),
            u.getEmail(),
            u.getRole(),
            Duration.ofHours(8)
        );

        String redirect = "http://localhost:5173/auth/callback#token=" + token;
        return ResponseEntity.status(302)
                .header(org.springframework.http.HttpHeaders.LOCATION, redirect)
                .build();
    }
}
