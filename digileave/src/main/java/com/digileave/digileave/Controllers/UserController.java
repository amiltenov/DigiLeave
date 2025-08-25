package com.digileave.digileave.Controllers;

import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.digileave.digileave.Models.User;
import com.digileave.digileave.Repositories.UserRepository;

@RestController
@RequestMapping("/account")
public class UserController {

    private final UserRepository db;
    public UserController(UserRepository db) {
        this.db = db;
    }
    
    @GetMapping
    public User userInfo(@AuthenticationPrincipal String email) {
        return db.findByEmail(email).orElse(null);
    }
    
}
