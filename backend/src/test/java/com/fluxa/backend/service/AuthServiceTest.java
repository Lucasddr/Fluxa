package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.RefreshToken;
import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.domain.enums.Role;
import com.fluxa.backend.dto.internal.TokenPair;
import com.fluxa.backend.dto.request.LoginDTO;
import com.fluxa.backend.dto.request.RegisterDTO;
import com.fluxa.backend.exception.EmailAlreadyExistsException;
import com.fluxa.backend.exception.InvalidCredentialsException;
import com.fluxa.backend.repository.RefreshTokenRepository;
import com.fluxa.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    private static final String EMAIL = "auth@test.local";
    private static final String PASSWORD = "Teste1234";

    private RegisterDTO registerDto() {
        return new RegisterDTO("Test User", EMAIL, PASSWORD);
    }

    private LoginDTO loginDto() {
        return new LoginDTO(EMAIL, PASSWORD);
    }

    @Test
    void registerCreatesUser() {
        authService.register(registerDto());

        assertTrue(userRepository.existsByEmail(EMAIL));
    }

    @Test
    void registerDuplicateThrows() {
        authService.register(registerDto());

        assertThrows(EmailAlreadyExistsException.class,
                () -> authService.register(registerDto()));
    }

    @Test
    void loginSuccessReturnsTokenPair() {
        authService.register(registerDto());

        TokenPair pair = authService.login(loginDto());

        assertNotNull(pair.jwtToken());
        assertNotNull(pair.refreshToken());
    }

    @Test
    void loginWrongPasswordThrows() {
        authService.register(registerDto());

        assertThrows(InvalidCredentialsException.class,
                () -> authService.login(new LoginDTO(EMAIL, "WrongPass1")));
    }

    @Test
    void loginNonexistentUserThrows() {
        assertThrows(InvalidCredentialsException.class,
                () -> authService.login(
                        new LoginDTO("nobody@test.local", PASSWORD)));
    }

    @Test
    void refreshRotatesAndRevokesOldToken() {
        authService.register(registerDto());
        TokenPair first = authService.login(loginDto());

        TokenPair second = authService.refresh(first.refreshToken());

        assertNotNull(second.jwtToken());
        assertNotEquals(first.refreshToken(), second.refreshToken());

        RefreshToken old = refreshTokenRepository
                .findByTokenHash(hashToken(first.refreshToken()))
                .orElseThrow();

        assertTrue(old.isRevoked());

        RefreshToken current = refreshTokenRepository
                .findByTokenHash(hashToken(second.refreshToken()))
                .orElseThrow();

        assertTrue(!current.isRevoked());
    }

    @Test
    void refreshRevokedTokenThrows() {
        authService.register(registerDto());
        TokenPair first = authService.login(loginDto());

        RefreshToken rt = refreshTokenRepository
                .findByTokenHash(hashToken(first.refreshToken()))
                .orElseThrow();
        rt.setRevoked(true);
        refreshTokenRepository.saveAndFlush(rt);

        assertThrows(InvalidCredentialsException.class,
                () -> authService.refresh(first.refreshToken()));
    }

    @Test
    void refreshExpiredTokenThrows() {
        authService.register(registerDto());
        User user = userRepository.findByEmail(EMAIL).orElseThrow();

        String rawToken = "expired-raw-token";
        RefreshToken rt = new RefreshToken();
        rt.setUser(user);
        rt.setTokenHash(hashToken(rawToken));
        rt.setCreatedAt(Instant.now().minusSeconds(3600));
        rt.setExpiresAt(Instant.now().minusSeconds(60));
        rt.setRevoked(false);
        refreshTokenRepository.saveAndFlush(rt);

        InvalidCredentialsException ex = assertThrows(
                InvalidCredentialsException.class,
                () -> authService.refresh(rawToken));

        assertTrue(ex.getMessage().contains("expirado"));
    }

    @Test
    void refreshWithoutTokenThrowsUnauthorizedCredentialsException() {
        assertThrows(InvalidCredentialsException.class,
                () -> authService.refresh(null));
    }

    @Test
    void registerAdminCreatesAdmin() {
        authService.registerAdmin(
                new RegisterDTO("Admin User", EMAIL, PASSWORD));

        User user = userRepository.findByEmail(EMAIL).orElseThrow();

        assertEquals(Role.ADMIN, user.getRole());
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(
                    digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
