package com.digileave.digileave.Security;

import java.io.IOException;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class HttpLoggerFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(HttpServletRequest req , HttpServletResponse res , FilterChain chain)
    throws ServletException , IOException{
        long t0 = System.currentTimeMillis();
        String method = req.getMethod();
        String uri = req.getRequestURI();
        

        try{
            chain.doFilter(req , res);
        } finally {
            long ms = System.currentTimeMillis() - t0;
            int status = res.getStatus();
            String timeStamp = ZonedDateTime.now(ZoneId.of("Europe/Sofia")).format(DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy"));

            System.out.printf("%s %s - %d %d ms - %s \n", method , uri , status , ms , timeStamp);
        }
    }
}
