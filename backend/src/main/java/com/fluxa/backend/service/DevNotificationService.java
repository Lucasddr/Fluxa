package com.fluxa.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class DevNotificationService implements NotificationService {

    public String lastToken;

    @Override
    public void sendPasswordReset(String email, String rawToken) {
        this.lastToken = rawToken;
        log.info("[DEV] Password reset for {}: token={}", email, rawToken);
    }
}
