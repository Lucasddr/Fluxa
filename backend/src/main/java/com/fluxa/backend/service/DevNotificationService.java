package com.fluxa.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Slf4j
@Profile("!prod")
@Service
public class DevNotificationService implements NotificationService {

    @Override
    public void sendPasswordReset(String email, String rawToken) {
        log.info("[DEV] Password reset requested for {}", email);
    }

    @Override
    public void sendEmailVerification(String email, String rawToken) {
        log.info("[DEV] Email verification requested for {}", email);
    }
}
