package com.fluxa.backend.controller;

import com.fluxa.backend.domain.entity.RefreshToken;
import com.fluxa.backend.dto.internal.TokenPair;
import com.fluxa.backend.dto.request.LoginDTO;
import com.fluxa.backend.dto.request.RegisterDTO;
import com.fluxa.backend.service.RefreshTokenService;
import com.fluxa.backend.service.AuthService;
import com.fluxa.backend.service.CookieService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final CookieService cookieService;
    private final RefreshTokenService refreshTokenService;

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

        TokenPair result = authService.login(dto);

        log.debug("[AUTH_CONTROLLER] Iniciando geração de cookie de acesso");

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookieService.createAccessTokenCookie(result.jwtToken()).toString()
        );

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookieService.createRefreshTokenCookie(result.refreshToken()).toString()
        );

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
        return ResponseEntity.ok(Map.of("UserId", authentication.getName()));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @CookieValue(name = "refresh_token")
            String refreshToken,
            HttpServletResponse response) {

        RefreshToken token = refreshTokenService.validate(refreshToken);

        refreshTokenService.revoke(token);

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookieService.deleteAccessTokenCookie().toString()
        );

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookieService.deleteRefreshTokenCookie().toString()
        );

        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(
            @CookieValue(name = "refresh_token", required = false)
            String refreshToken,
            HttpServletResponse response
    ) {
        TokenPair result = authService.refresh(refreshToken);

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookieService.createAccessTokenCookie(result.jwtToken()).toString()
        );

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookieService.createRefreshTokenCookie(result.refreshToken()).toString()
        );

        return ResponseEntity.noContent().build();
    }
}
