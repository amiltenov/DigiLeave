package com.digileave.digileave.Services;

import com.digileave.digileave.Models.enums.Role;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

import org.springframework.stereotype.Service;

@Service
public class JwtService {
    
    // # Key Management
    private final Key key;
    public JwtService() {
        String b64 = System.getenv("JWT_SECRET_BASE64");
        
        if (b64 == null || b64.isBlank()) {
            String dev = "dev-change-me-32bytes-minimum-secret-key!";
            b64 = Base64.getEncoder().encodeToString(dev.getBytes(StandardCharsets.UTF_8));
        }
        this.key = Keys.hmacShaKeyFor(Base64.getDecoder().decode(b64));
    }
    
    // # Create JWT
    public String createJwtToken(String userId, String email, Role role, Duration ttl) {
        Instant now = Instant.now();
        Date issuedAt = Date.from(now);
        Date expirationAt = Date.from(now.plus(ttl));
        
        return Jwts.builder()
        .setIssuer("digileave-api")
        .setSubject(userId)                      // Subject
        .claim("email", email)              // Custom claim email
        .claim("role", role.name())         // Custom claim role
        .setIssuedAt(issuedAt)
        .setExpiration(expirationAt)
        .signWith(key, SignatureAlgorithm.HS256) // Sign Token with Key
        .compact();
    }
    
    // # Parse JWT
    public Jws<Claims> parseJwtToken(String token) throws JwtException {
        return Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token);
    }

}