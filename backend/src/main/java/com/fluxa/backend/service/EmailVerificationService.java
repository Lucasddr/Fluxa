package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.EmailVerificationToken;
import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.exception.InvalidCredentialsException;
import com.fluxa.backend.repository.EmailVerificationTokenRepository;
import com.fluxa.backend.repository.UserRepository;
import com.fluxa.backend.security.context.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@Service
public class EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${email-verification.token.expiration:86400000}")
    private long tokenExpiration;

    @Transactional
    public void sendVerification() {
        UUID userId = UserContext.getUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidCredentialsException(
                        "Usuário não encontrado"));

        if (user.isVerified()) {
            return;
        }

        tokenRepository.invalidateAllForUser(userId);

        String rawToken = generateToken();

        EmailVerificationToken token = new EmailVerificationToken();
        token.setUser(user);
        token.setTokenHash(hashToken(rawToken));
        token.setExpiresAt(Instant.now().plusMillis(tokenExpiration));
        token.setCreatedAt(Instant.now());
        token.setUsed(false);
        tokenRepository.save(token);

        notificationService.sendEmailVerification(
                user.getEmail(), rawToken);
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        EmailVerificationToken token = tokenRepository
                .findByTokenHash(hashToken(rawToken))
                .orElseThrow(() ->
                        new InvalidCredentialsException("Token inválido"));

        if (token.isUsed()) {
            throw new InvalidCredentialsException("Token já utilizado");
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidCredentialsException("Token expirado");
        }

        User user = token.getUser();
        user.setVerified(true);
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);

        log.info("[EMAIL_VERIFICATION] email verified for user: {}",
                user.getId());
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(
                    digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 não disponível", e);
        }
    }
}
