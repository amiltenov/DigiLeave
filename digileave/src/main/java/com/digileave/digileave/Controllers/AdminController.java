package com.digileave.digileave.Controllers;

import org.springframework.web.bind.annotation.RestController;

import com.digileave.digileave.DatabaseOps.UserRepository;
import com.digileave.digileave.Models.User;

import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/admin")
public class AdminController {
	
    private final UserRepository users;

    public AdminController(UserRepository users) {
        this.users = users;
    }

    @GetMapping("")
    public List<User> getAllUsers() {
        return users.findAll();
    }
    
    
}
