package com.digileave.digileave.DTOs;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UserImportDto {

    @NotBlank
    @Email
    @Pattern(
        regexp = "^[A-Za-z0-9._%+-]+@digitoll\\.bg$", 
        message = "Email must be a @digitoll.bg address") 
    String email;

}
