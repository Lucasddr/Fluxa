package com.fluxa.backend.service;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.dto.request.RegisterDTO;
import com.fluxa.backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * CTRL-010: regression guard for OPSIRE-SEC-001.
 *
 * <p>The password reset and email verification flows used to log the raw
 * token in clear text, which allowed account takeover through the log
 * stream. This test fails if any token handed to the notification layer
 * ever shows up in the application logs again.</p>
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(CapturingNotificationService.class)
@Transactional
class LogTokenLeakRegressionTest {

    private static final String PACKAGE = "com.fluxa.backend";
    private static final String EMAIL = "log-token@test.local";
    private static final String PASSWORD = "Teste1234";

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private EmailVerificationService emailVerificationService;

    @Autowired
    private AuthService authService;

    @Autowired
    private CapturingNotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    private Logger appLogger;
    private ListAppender<ILoggingEvent> appender;
    private Level previousLevel;

    @BeforeEach
    void attachAppender() {
        notificationService.reset();
        appLogger = (Logger) LoggerFactory.getLogger(PACKAGE);
        previousLevel = appLogger.getLevel();
        appender = new ListAppender<>();
        appender.start();
        appLogger.setLevel(Level.TRACE);
        appLogger.addAppender(appender);
    }

    @AfterEach
    void detachAppender() {
        if (appLogger != null && appender != null) {
            appLogger.detachAppender(appender);
            appender.stop();
            appLogger.setLevel(previousLevel);
        }
        SecurityContextHolder.clearContext();
    }

    private void registerUser() {
        authService.register(new RegisterDTO("Log Token User", EMAIL, PASSWORD));
    }

    private User findUser() {
        return userRepository.findByEmail(EMAIL).orElseThrow();
    }

    private void authenticateAs(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        user.getId(), null, List.of()));
    }

    /**
     * The detector itself must catch a token that is logged. Without this
     * check a broken appender would make every other assertion pass.
     */
    @Test
    void detectorCatchesTokenThatIsActuallyLogged() {
        String planted = "ctrlt010-planted-token";
        ((Logger) LoggerFactory.getLogger(PACKAGE)).info("planted {}", planted);

        assertTrue(messages().stream().anyMatch(m -> m.contains(planted)),
                "the log appender must capture application log messages");

        appender.list.clear();
        assertFalse(messages().stream().anyMatch(m -> m.contains(planted)),
                "clearing the appender must clear the evidence");
    }

    @Test
    void passwordResetFlowDoesNotLogTheRawToken() {
        registerUser();

        passwordResetService.requestReset(EMAIL);

        String rawToken = notificationService.lastPasswordResetToken;
        assertTrue(rawToken != null, "the flow must have generated a token");
        assertNoTokenInLogs(rawToken);

        passwordResetService.resetPassword(rawToken, "NovaSenha123");

        assertTrue(messages().stream().anyMatch(m -> m.contains("PASSWORD_RESET")),
                "the reset completion must log something, otherwise this test proves nothing");
        assertNoTokenInLogs(rawToken);
    }

    @Test
    void emailVerificationFlowDoesNotLogTheRawToken() {
        registerUser();
        authenticateAs(findUser());

        emailVerificationService.sendVerification();

        String rawToken = notificationService.lastVerificationToken;
        assertTrue(rawToken != null, "the flow must have generated a token");
        assertNoTokenInLogs(rawToken);
    }

    @Test
    void devNotificationServiceDoesNotLogTheRawToken() {
        String resetToken = "ctrlt010-reset-token";
        String verificationToken = "ctrlt010-verification-token";
        DevNotificationService devService = new DevNotificationService();

        devService.sendPasswordReset(EMAIL, resetToken);
        devService.sendEmailVerification(EMAIL, verificationToken);

        assertTrue(messages().stream().anyMatch(m -> m.contains(EMAIL)),
                "the dev notification service must still log the recipient");
        assertNoTokenInLogs(resetToken);
        assertNoTokenInLogs(verificationToken);
    }

    private void assertNoTokenInLogs(String rawToken) {
        List<String> leaked = messages().stream()
                .filter(message -> message.contains(rawToken))
                .toList();

        assertTrue(leaked.isEmpty(),
                "raw token must never reach application logs, leaked in: " + leaked);
    }

    private List<String> messages() {
        return appender.list.stream()
                .map(ILoggingEvent::getFormattedMessage)
                .toList();
    }
}
