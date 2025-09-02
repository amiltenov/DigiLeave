package com.digileave.digileave.Controllers;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.digileave.digileave.DTOs.UserExportDto;
import com.digileave.digileave.Repositories.UserRepository;


@RestController
@RequestMapping("/account")
public class UserController {

    // # DB operations
    private final UserRepository db;
    public UserController(UserRepository db) {
        this.db = db;
    }
    
    // # Return The User
    @GetMapping
    public UserExportDto userInfo(@AuthenticationPrincipal String userId) {

        return db.findById(userId)
         .map(UserExportDto::from)
         .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
    
}