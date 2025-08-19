package com.digileave.digileave.Controllers;

import com.digileave.digileave.DatabaseOps.UserRepository;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;



@RestController
@RequestMapping("/request")
public class RequestController {
	
    @GetMapping("/")
    public String getRequests(@AuthenticationPrincipal OAuth2User currentUser) {
        return new String();
    }
    

}
