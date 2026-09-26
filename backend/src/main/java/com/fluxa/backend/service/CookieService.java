package com.fluxa.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class CookieService {

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${refresh.token.expiration}")
    private long refreshExpiration;

    @Value("${cookie.secure}")
    private boolean cookieSecure;

    @Value("${cookie.same.site}")
    private String cookieSameSite;

    @Value("${COOKIE_ACCESS_PATH}")
    private String cookieAccessPath;

    @Value("${COOKIE_REFRESH_PATH}")
    private String cookieRefreshPath;

    public ResponseCookie createAccessTokenCookie (String token) {

        ResponseCookie cookie = ResponseCookie.from("access_token",token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path(cookieAccessPath)
                .maxAge(Duration.ofMillis(jwtExpiration))
                .build();

        log.info("[COOKIE] Cookie de acesso gerado com sucesso");

        return cookie;
    }

    public ResponseCookie createRefreshTokenCookie (String token) {

        return ResponseCookie.from("refresh_token", token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path(cookieRefreshPath)
                .maxAge(Duration.ofMillis(refreshExpiration))
                .build();
    }

    public ResponseCookie deleteAccessTokenCookie() {
        return ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path(cookieAccessPath)
                .maxAge(Duration.ZERO)
                .build();
    }

    public ResponseCookie deleteRefreshTokenCookie() {
        return ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path(cookieRefreshPath)
                .maxAge(Duration.ZERO)
                .build();
    }

}
