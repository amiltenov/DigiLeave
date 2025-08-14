package com.digileave.digileave.Controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DigileaveBaseController {
    
    @GetMapping("/")
    public String HelloWorld(){
        String hw = "HelloWorld";
        return hw;
    }
}
