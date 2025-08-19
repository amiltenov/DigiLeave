package com.digileave.digileave.Controllers;

import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.digileave.digileave.DatabaseOps.UserRepository;
import com.digileave.digileave.Models.User;

@RestController
@RequestMapping("/account")
public class UserController {

    private final UserRepository db;
    public UserController(UserRepository db) {
        this.db = db;
    }
    
    @GetMapping
    public User userInfo(@AuthenticationPrincipal OAuth2User currentUser) {

        if (currentUser == null) return null;
            String email = (String) currentUser.getAttributes().get("email");

        return db.findByEmail(email).orElse(null);
    }
    
}
