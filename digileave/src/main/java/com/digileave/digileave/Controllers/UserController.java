package com.digileave.digileave.Controllers;

import org.springframework.web.bind.annotation.*;
import com.digileave.digileave.DatabaseOps.UserRepository;
import com.digileave.digileave.Models.User;

@RestController
@RequestMapping("/user")
public class UserController {
    private final UserRepository repo;

    public UserController(UserRepository repo) {
        this.repo = repo;
    }

    
    @PostMapping
    public User create(@RequestBody User u) {
        if (repo.existsByEmail(u.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        return repo.save(u);
    }

    @GetMapping("/{id}")
    public User get(@PathVariable String id) {
        return repo.findById(id).orElse(null);
    }

    @GetMapping
    public java.util.List<User> list() {
        return repo.findAll();
    }
    
}
