package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.dto.request.LoginDTO;
import com.fluxa.backend.dto.request.RegisterDTO;
import com.fluxa.backend.exception.InvalidCredentialsException;
import com.fluxa.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PasswordResetServiceTest {

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private DevNotificationService notificationService;

    private static final String EMAIL = "reset@test.local";
    private static final String PASSWORD = "Teste1234";
    private static final String NEW_PASSWORD = "NovaSenha123";

    @BeforeEach
    void clearNotification() {
        notificationService.lastToken = null;
    }

    private void registerUser() {
        authService.register(new RegisterDTO("Reset User", EMAIL, PASSWORD));
    }

    @Test
    void requestResetCreatesTokenAndSends() {
        registerUser();

        passwordResetService.requestReset(EMAIL);

        assertNotNull(notificationService.lastToken);
    }

    @Test
    void requestResetNonexistentEmailDoesNotLeak() {
        passwordResetService.requestReset("nobody@test.local");

        assertTrue(notificationService.lastToken == null);
    }

    @Test
    void resetPasswordWithValidTokenChangesPassword() {
        registerUser();
        passwordResetService.requestReset(EMAIL);
        String rawToken = notificationService.lastToken;

        passwordResetService.resetPassword(rawToken, NEW_PASSWORD);

        User user = userRepository.findByEmail(EMAIL).orElseThrow();
        assertTrue(passwordEncoder.matches(NEW_PASSWORD, user.getPasswordHash()));
    }

    @Test
    void resetPasswordWithUsedTokenThrows() {
        registerUser();
        passwordResetService.requestReset(EMAIL);
        String rawToken = notificationService.lastToken;

        passwordResetService.resetPassword(rawToken, NEW_PASSWORD);

        assertThrows(InvalidCredentialsException.class,
                () -> passwordResetService.resetPassword(rawToken, "OutraSenha1"));
    }

    @Test
    void resetPasswordWithInvalidTokenThrows() {
        assertThrows(InvalidCredentialsException.class,
                () -> passwordResetService.resetPassword("invalid-token", NEW_PASSWORD));
    }

    @Test
    void loginWorksAfterPasswordReset() {
        registerUser();
        passwordResetService.requestReset(EMAIL);
        String rawToken = notificationService.lastToken;

        passwordResetService.resetPassword(rawToken, NEW_PASSWORD);

        var pair = authService.login(new LoginDTO(EMAIL, NEW_PASSWORD));
        assertNotNull(pair.jwtToken());
    }
}
