package com.digileave.digileave.Controllers;

import com.digileave.digileave.Repositories.UserRepository;
import com.digileave.digileave.Services.JwtService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository users;
    private final JwtService jwt;

    public AuthController(UserRepository users, JwtService jwt) {
        this.users = users;
        this.jwt = jwt;
    }

    // # Issue Jwt Token After Login
    @GetMapping(value = "/jwt", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> issueJwt(Authentication auth , HttpServletRequest req, HttpServletResponse res) {
        OAuth2User p = (OAuth2User) auth.getPrincipal();
        String email = p.getAttribute("email");
        String name  = p.getAttribute("name");

        final String n_email = (email == null ? "" : email.trim().toLowerCase(java.util.Locale.ROOT));

        // // # Digitoll domain check
        // if (!n_email.endsWith("@digitoll.bg")) {
        //      org.springframework.security.core.context.SecurityContextHolder.clearContext();
        //      var session = req.getSession(false);
        //      if (session != null) session.invalidate();

        //     String redirectErr = "http://localhost:5173/auth/callback#error=domain";
        //     return ResponseEntity.status(302)
        //             .header(org.springframework.http.HttpHeaders.LOCATION, redirectErr)
        //             .build();
        // }

          // # Find or Create User
          var current_user = users.findByEmail(n_email).orElseGet(() -> {
              var nu = new com.digileave.digileave.Models.User();
              nu.setEmail(n_email);
              nu.setFullName((name == null || name.isBlank())
                      ? n_email.substring(0, n_email.indexOf('@'))
                      : name);
              nu.setRole(com.digileave.digileave.Models.enums.Role.USER);
              return users.save(nu);
          });

          // # Assign JWT Token
          String token = jwt.createJwtToken(
              current_user.getId(), current_user.getEmail(), current_user.getRole(), java.time.Duration.ofHours(8));

        // ! Local vs Dev Redirect
        String redirect = "http://localhost:5173/auth/callback#token=" + token;
        return ResponseEntity.status(302)
                .header(org.springframework.http.HttpHeaders.LOCATION, redirect)
                .build();
    }
}
