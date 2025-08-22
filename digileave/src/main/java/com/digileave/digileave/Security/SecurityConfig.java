package com.digileave.digileave.Security;

import com.digileave.digileave.DatabaseOps.UserRepository;
import com.digileave.digileave.Models.enums.Role;
import com.digileave.digileave.Models.User;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.List;

@Configuration
public class SecurityConfig {

  private final UserRepository users;

  public SecurityConfig(UserRepository users) {
    this.users = users;
  }

  private static final String FRONTEND_URL =
      System.getenv().getOrDefault("FRONTEND_URL", "https://digi-leavefrontend.vercel.app");

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .cors(Customizer.withDefaults())
      .csrf(csrf -> csrf.disable())
      .authorizeHttpRequests(auth -> auth
          .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
          .requestMatchers("/", "/health", "/actuator/health", "/oauth2/**", "/login/**").permitAll()
          .anyRequest().authenticated()
      )
      .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
      .oauth2Login(o -> o.successHandler((req, res, authentication) -> {
        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        String email = String.valueOf(principal.getAttributes().get("email"));
        String fullName =
            principal.getAttribute("name") != null ? principal.getAttribute("name")
            : (principal.getAttribute("given_name") != null || principal.getAttribute("family_name") != null)
              ? (String.valueOf(principal.getAttribute("given_name")) + " " +
                 String.valueOf(principal.getAttribute("family_name"))).trim()
              : null;

        users.findByEmail(email).orElseGet(() -> {
          User u = new User();
          u.setEmail(email);
          if (fullName != null) u.setFullName(fullName);
          u.setRole(Role.USER);
          u.setAvailableLeaveDays(20);
          return users.save(u);
        });

        res.sendRedirect(FRONTEND_URL);
      }))
      .logout(l -> l.logoutUrl("/logout").logoutSuccessUrl(FRONTEND_URL));

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of(
        "http://localhost:5173",
        "https://digi-leavefrontend.vercel.app"
    ));
    cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
    cfg.setAllowedHeaders(List.of("*"));
    cfg.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return source;
  }
}
