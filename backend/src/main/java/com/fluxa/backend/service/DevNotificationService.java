package com.fluxa.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Profile("!prod")
public class DevNotificationService implements NotificationService {

    public String lastToken;

    @Override
    public void sendPasswordReset(String email, String rawToken) {
        this.lastToken = rawToken;
        log.info("[DEV] Password reset for {}: token={}", email, rawToken);
    }

    @Override
    public void sendEmailVerification(String email, String rawToken) {
        this.lastToken = rawToken;
        log.info("[DEV] Email verification for {}: token={}", email, rawToken);
    }
}
