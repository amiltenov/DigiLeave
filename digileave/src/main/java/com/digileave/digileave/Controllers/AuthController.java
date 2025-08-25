package com.digileave.digileave.Controllers;

import com.digileave.digileave.Models.User;
import com.digileave.digileave.Models.enums.Role;
import com.digileave.digileave.Repositories.UserRepository;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
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
    public ResponseEntity<Map<String, String>> issueJwt(@AuthenticationPrincipal OAuth2User principal) {
            System.out.println("HIT /auth/jwt, principal=" + (principal == null ? "null" : principal.getAttributes()));

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

      ResponseCookie cookie = ResponseCookie.from("jwt", token)
          .httpOnly(true)
          .secure(false) // TODO: set true in production (HTTPS)
          .sameSite("Lax") // TODO: if cross-site in production, use "None" and secure(true)
          .path("/")
          .maxAge(Duration.ofHours(8))
          .build();
  
      return ResponseEntity
          .ok()
          .header(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString())
          .body(Map.of("token", token));
  }

    
}
