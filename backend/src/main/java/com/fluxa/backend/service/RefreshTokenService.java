package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.RefreshToken;
import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.exception.InvalidCredentialsException;
import com.fluxa.backend.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();
    @Value("${refresh.token.expiration}")
    private long refreshTokenExpiration;

    public String create(User user) {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);

        String rawToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);

        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken = new RefreshToken();

        refreshToken.setUser(user);
        refreshToken.setTokenHash(tokenHash);
        refreshToken.setCreatedAt(Instant.now());
        refreshToken.setExpiresAt(
                Instant.now().plusMillis(refreshTokenExpiration)
        );
        refreshToken.setRevoked(false);

        refreshTokenRepository.save(refreshToken);

        return rawToken;
    }

    private String hashToken(String token) {

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    token.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(hash);

        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(
                    "SHA-256 não disponível",
                    e
            );
        }


    }

    public RefreshToken validate(String rawToken) {

        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() ->
                        new InvalidCredentialsException("Refresh token inválido"));


        if (refreshToken.isRevoked()) {
            throw new InvalidCredentialsException("Refresh token revogado");
        }

        if ((refreshToken.getExpiresAt().isBefore(Instant.now()))) {
            throw new InvalidCredentialsException("Refresh token expirado");
        }

        return refreshToken;
    }

    public void revoke(RefreshToken refreshToken) {

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
    }
}
