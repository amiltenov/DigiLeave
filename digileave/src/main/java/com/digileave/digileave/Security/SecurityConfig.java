package com.digileave.digileave.Security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.access.AccessDeniedException;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.digileave.digileave.Services.JwtService;
import com.digileave.digileave.Repositories.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

  // # Dev & Production frontend routes
  private static final String DEV_FRONTEND = "http://localhost:5173";
  private static final String PROD_FRONTEND = "https://digileave.vercel.app";
  
  private final HttpLoggerFilter httpLoggerFilter;
  private final JwtService jwtService;

  public SecurityConfig(JwtService jwtService, HttpLoggerFilter httpLoggerFilter, UserRepository users) {
    this.httpLoggerFilter = httpLoggerFilter;
    this.jwtService = jwtService;
  }
  

  // # Register JwtAuthFilter as a bean
  @Bean
  public JwtAuthFilter jwtAuthFilter() {
    return new JwtAuthFilter(jwtService);
  }

  // # Security Pipeline Setup
  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .cors(Customizer.withDefaults())
      .csrf(csrf -> csrf.disable())
      .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

      // # Custom HTTP Logger Filter
      .addFilterAfter(httpLoggerFilter, SecurityContextHolderFilter.class)

      .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        .requestMatchers("/", "/health", "/actuator/health",
                         "/oauth2/**", "/login/**", "/auth/jwt").permitAll()
        .anyRequest().authenticated()
      )
      .exceptionHandling(e -> e
        .authenticationEntryPoint(json401())
        .accessDeniedHandler(json403())
      )

      .oauth2Login(oauth -> oauth
        .successHandler((req, res, auth) -> { req.getRequestDispatcher("/auth/jwt").forward(req, res); })
      )

      // # JWT Filter
      .addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  // # Cors policy configuration
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of(DEV_FRONTEND, PROD_FRONTEND));
    cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
    cfg.setAllowedHeaders(List.of("Content-Type","Authorization","X-Requested-With"));
    cfg.setAllowCredentials(true);
    cfg.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return source;
  }

  // # 401
  private AuthenticationEntryPoint json401() {
    return (HttpServletRequest request, HttpServletResponse response, AuthenticationException ex) -> {
      response.setStatus(HttpStatus.UNAUTHORIZED.value());
      response.setContentType("application/json");
      try {
        response.getWriter().write("{\"error\":\"unauthorized\"}");
        response.getWriter().flush();
      } catch (IOException ignored) {}
    };
  }

  // # 403
  private AccessDeniedHandler json403() {
    return (HttpServletRequest request, HttpServletResponse response, AccessDeniedException ex) -> {
      response.setStatus(HttpStatus.FORBIDDEN.value());
      response.setContentType("application/json");
      try {
        response.getWriter().write("{\"error\":\"forbidden\"}");
        response.getWriter().flush();
      } catch (IOException ignored) {}
    };
  }

  // TODO - add other error handlers
  // ...............................
}
