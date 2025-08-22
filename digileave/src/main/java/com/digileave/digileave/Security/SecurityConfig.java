package com.digileave.digileave.Security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {
  private static final String FRONTEND_URL =
      System.getenv().getOrDefault("FRONTEND_URL", "https://digi-leavefrontend.vercel.app/");

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .cors(Customizer.withDefaults())
      .csrf(csrf -> csrf.disable())

      .authorizeHttpRequests(auth -> auth
          .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
          .requestMatchers("/", "/health", "/actuator/health").permitAll()
          .requestMatchers("/oauth2/**", "/login/**").permitAll()
          .anyRequest().authenticated()
      )

      .oauth2Login(o -> o.successHandler((req, res, auth) -> {
        res.sendRedirect(FRONTEND_URL);
      }))

      .logout(l -> l.logoutUrl("/logout")
                    .logoutSuccessUrl(FRONTEND_URL));

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();

    cfg.setAllowedOrigins(List.of(
        "https://digi-leavefrontend.vercel.app"
    ));

    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    cfg.setAllowedHeaders(List.of("*"));
    cfg.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return source;
  }
}
