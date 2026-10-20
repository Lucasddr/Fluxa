package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.dto.request.RegisterDTO;
import com.fluxa.backend.exception.InvalidCredentialsException;
import com.fluxa.backend.domain.entity.EmailVerificationToken;
import com.fluxa.backend.repository.EmailVerificationTokenRepository;
import com.fluxa.backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@Import(CapturingNotificationService.class)
@Transactional
class EmailVerificationServiceTest {

    @Autowired
    private EmailVerificationService emailVerificationService;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CapturingNotificationService notificationService;

    @Autowired
    private EmailVerificationTokenRepository tokenRepository;

    private static final String EMAIL = "verify@test.local";

    @BeforeEach
    void clearLastToken() {
        notificationService.reset();
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        user.getId(), null, java.util.List.of()));
    }

    private void registerUser() {
        authService.register(
                new RegisterDTO("Verify User", EMAIL, "Teste1234"));
    }

    private User findUser() {
        return userRepository.findByEmail(EMAIL).orElseThrow();
    }

    @Test
    void newUserStartsUnverified() {
        registerUser();

        assertFalse(findUser().isVerified());
    }

    @Test
    void sendVerificationDeliversToken() {
        registerUser();
        authenticateAs(findUser());

        emailVerificationService.sendVerification();

        assertTrue(notificationService.lastVerificationToken != null);
    }

    @Test
    void verifyEmailWithValidTokenMarksVerified() {
        registerUser();
        authenticateAs(findUser());
        emailVerificationService.sendVerification();
        String rawToken = notificationService.lastVerificationToken;

        emailVerificationService.verifyEmail(rawToken);

        assertTrue(findUser().isVerified());
    }

    @Test
    void verifyEmailWithUsedTokenThrows() {
        registerUser();
        authenticateAs(findUser());
        emailVerificationService.sendVerification();
        String rawToken = notificationService.lastVerificationToken;

        emailVerificationService.verifyEmail(rawToken);

        assertThrows(InvalidCredentialsException.class,
                () -> emailVerificationService.verifyEmail(rawToken));
    }

    @Test
    void verifyEmailWithInvalidTokenThrows() {
        assertThrows(InvalidCredentialsException.class,
                () -> emailVerificationService.verifyEmail("invalid-token"));
    }

    @Test
    void verifyEmailWithExpiredTokenThrows() {
        registerUser();
        User user = findUser();

        String rawToken = "expired-raw-token";
        EmailVerificationToken token = new EmailVerificationToken();
        token.setUser(user);
        token.setTokenHash(hashToken(rawToken));
        token.setCreatedAt(Instant.now().minusSeconds(3600));
        token.setExpiresAt(Instant.now().minusSeconds(60));
        token.setUsed(false);
        tokenRepository.saveAndFlush(token);

        InvalidCredentialsException ex = assertThrows(
                InvalidCredentialsException.class,
                () -> emailVerificationService.verifyEmail(rawToken));

        assertTrue(ex.getMessage().contains("expirado"));
        assertFalse(findUser().isVerified());
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
