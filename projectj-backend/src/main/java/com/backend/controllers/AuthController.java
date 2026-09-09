package com.backend.controllers;

import com.backend.dto.CandidateRequest;
import com.backend.dto.RecruiterRequest;
import com.backend.dto.UserRequest;
import com.backend.entities.Candidate;
import com.backend.entities.Recruiter;
import com.backend.entities.Response;
import com.backend.entities.User;
import com.backend.repositories.CandidateRepository;
import com.backend.repositories.RecruiterRepository;
import com.backend.repositories.UserRepository;
import com.backend.services.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private RecruiterRepository recruiterRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping(value = "/register/candidate", consumes = "multipart/form-data")
    public Response<Candidate> registerCandidate(@RequestPart("candidate") String candidateJson, @RequestPart("resume") MultipartFile resumeUrl) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        CandidateRequest candidateRequest = mapper.readValue(candidateJson, CandidateRequest.class);
        if(candidateRepository.findByEmail(candidateRequest.getEmail())!=null){
            Candidate candicateInDb=candidateRepository.findByEmail(candidateRequest.getEmail());
            return Response.<Candidate>builder().message("Candicate with this email already exists").statusCode(400).data(candicateInDb).build();
        }
        Candidate candidate = authService.registerCandidate(candidateRequest,resumeUrl);

        return Response.<Candidate>builder().message("Candidate registered successfully").statusCode(200).data(candidate).build();
    }

    @PostMapping("/register/recruiter")
    public Response<Recruiter> registerRecruiter(@RequestBody RecruiterRequest recruiterRequest) {
        if(recruiterRepository.findByEmail(recruiterRequest.getEmail())!=null){
            Recruiter recruiterInDb=recruiterRepository.findByEmail(recruiterRequest.getEmail());
            return Response.<Recruiter>builder().message("Recruiter with this email exists").statusCode(400).data(recruiterInDb).build();
        }
        Recruiter recruiter = authService.registerRecruiter(recruiterRequest);
        return Response.<Recruiter>builder().message("Recruiter registered successfully").statusCode(200).data(recruiter).build();
    }

    @Value("${jwt.expiration}")
    private int jwtExpiration;

    @PostMapping("/login")
    public Response<java.util.Map<String, Object>> loginUser(@RequestBody UserRequest userRequest, HttpServletResponse response) {
        String token = authService.login(userRequest);
        if (token == null) {
            return Response.<java.util.Map<String, Object>>builder().message("Login Failed").statusCode(400).data(null).build();
        }

        Cookie cookie = new Cookie("jwt", token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(jwtExpiration / 1000);
        response.addCookie(cookie);

        User userInDb = userRepository.findByEmail(userRequest.getEmail());
        java.util.Map<String, Object> data = java.util.Map.of(
            "user", userInDb,
            "token", token
        );
        return Response.<java.util.Map<String, Object>>builder().message("Login Success").statusCode(200).data(data).build();
    }

    @PostMapping("/logout")
    public Response<Void> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("jwt", "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        return Response.<Void>builder().message("Logged out successfully").statusCode(200).data(null).build();
    }

}
