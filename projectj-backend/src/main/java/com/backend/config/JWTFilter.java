package com.backend.config;

import com.backend.security.MyUserDetailsService;
import com.backend.services.JWTService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JWTFilter extends OncePerRequestFilter {

    @Autowired
    private JWTService jwtService;

    @Autowired
    ApplicationContext applicationContext;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        String path = request.getServletPath();
        if (path.startsWith("/auth/") || path.equals("/error") || path.startsWith("/assets/") || path.startsWith("/.well-known/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        String token = null;
        String email = null;

        System.out.println("JWTFilter: [Path: " + path + "] [Auth Header: " + (authHeader != null ? "Present" : "Missing") + "]");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            System.out.println("JWTFilter: Found Bearer token in Authorization header");
        } else {
            // Fallback to cookie
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if ("jwt".equals(cookie.getName())) {
                        token = cookie.getValue();
                        System.out.println("JWTFilter: Found token in Cookie 'jwt'");
                        break;
                    }
                }
            }
        }

        if (token != null) {
            try {
                email = jwtService.extractUserName(token);
                System.out.println("JWTFilter: Extracted email from token: " + email);
            } catch (Exception e) {
                System.out.println("JWTFilter: Error extracting email from token: " + e.getMessage());
                filterChain.doFilter(request, response);
                return;
            }
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = applicationContext.getBean(MyUserDetailsService.class).loadUserByUsername(email);
                System.out.println("JWTFilter: Loaded userDetails for " + email + ", username=" + userDetails.getUsername());
                
                boolean isValid = jwtService.validateToken(token, userDetails);
                System.out.println("JWTFilter: Token validation result: " + isValid);
                
                if (isValid) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    System.out.println("JWTFilter: Successfully authenticated user. SecurityContext updated.");
                }
            } catch (Exception e) {
                System.out.println("JWTFilter: Authentication setup failed: " + e.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }
}
