package com.digileave.digileave.Controllers;

import com.digileave.digileave.DatabaseOps.UserRepository;
import com.digileave.digileave.Models.User;
import com.digileave.digileave.Models.enums.Role;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Map;

@Controller
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository users;

    public AuthController(UserRepository users) {
        this.users = users;
    }

    @GetMapping("/post-login")
    public String postLogin(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return "redirect:/"; 
        }

        String email = (String) principal.getAttributes().get("email");

        users.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setEmail(email);
            u.setRole(Role.USER);
            u.setAvailableLeaveDays(20);
            u.addAssignee("");
            return users.save(u);
        });

        return "redirect:/user/me";
    }

    
}
