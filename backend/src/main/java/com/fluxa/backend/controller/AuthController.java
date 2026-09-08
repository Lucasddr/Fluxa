package com.fluxa.backend.controller;

import com.fluxa.backend.dto.internal.LoginResult;
import com.fluxa.backend.dto.request.LoginDTO;
import com.fluxa.backend.dto.request.RegisterDTO;
import com.fluxa.backend.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDTO dto){

        authService.register(dto);

        return ResponseEntity.status(HttpStatus.CREATED).body( Map.of(
                "message", "Conta criada com sucesso",
                "email", dto.email())
        );
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody
            LoginDTO dto,
            HttpServletResponse response
    ){

        LoginResult result = authService.login(dto);
        String jwt = result.token();

        ResponseCookie cookie = ResponseCookie.from("access_token", jwt)
                .httpOnly(true)
                .secure(false) //mudar em producção
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofHours(2))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok().build();
    }

    @PostMapping("/registerAdmin")
    public ResponseEntity<?> registerAdmin(@Valid @RequestBody RegisterDTO dto){

        authService.registerAdmin(dto);

        return ResponseEntity.status(HttpStatus.CREATED).body( Map.of(
                "message", "Conta criada com sucesso",
                "email", dto.email())
        );
    }

    @GetMapping("/me")
    public ResponseEntity<?> me (Authentication authentication) {
        return ResponseEntity.ok(Map.of("email", authentication.getName()));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofHours(0))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok().build();

    }
}
