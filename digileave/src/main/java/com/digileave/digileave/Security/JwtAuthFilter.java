package com.digileave.digileave.Security;

import com.digileave.digileave.Models.enums.Role;
import com.digileave.digileave.Services.JwtService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtService jwt;
  public JwtAuthFilter(JwtService jwt) {
    this.jwt = jwt;
  }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
        throws ServletException, IOException {

        // # Extract JWT From Header or Cookie
        String authHeader = req.getHeader("Authorization");
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else if (req.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : req.getCookies()) {
                if ("jwt".equals(cookie.getName())) { token = cookie.getValue(); break; }
            }
        }

        // # When Token Available 
        if (token != null) {
            try {
                // # Extract Info from JWT Body
                Jws<Claims> jws = jwt.parseJwtToken(token);
                Claims claims = jws.getBody();

                String userId = claims.getSubject();
                String email  = claims.get("email", String.class);
                Role   role   = Role.valueOf(claims.get("role", String.class));
                
                // # Set Authentication
                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
                var authentication = new UsernamePasswordAuthenticationToken(userId, null, authorities);
                authentication.setDetails(email);
                // System.out.println("JwtAuthFilter: header = " + req.getHeader("Authorization"));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (JwtException ignored) {}
    
        }

    // # Continue with the request
    chain.doFilter(req, res);
  }
}
