package com.digileave.digileave.Security;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

@Configuration
public class SecurityConfig {
  @Bean
  SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable())
        .authorizeHttpRequests(auth -> auth
          .requestMatchers("/", "/health").permitAll()
          .anyRequest().authenticated()
        )
        .oauth2Login(o -> o.defaultSuccessUrl("/auth/post-login", true))
        .logout(l -> l.logoutUrl("/logout").logoutSuccessUrl("/"));
    return http.build();
  }
}

