package com.fluxa.backend.service;

import org.springframework.context.annotation.Primary;

/**
 * Test-only notification capture. Isolates tests from the production
 * notification implementation: tokens are held in memory here, never in
 * application logs (regression guard for OPSIRE-SEC-001).
 */
@Primary
public class CapturingNotificationService implements NotificationService {

    public String lastPasswordResetToken;
    public String lastVerificationToken;

    public void reset() {
        lastPasswordResetToken = null;
        lastVerificationToken = null;
    }

    @Override
    public void sendPasswordReset(String email, String rawToken) {
        lastPasswordResetToken = rawToken;
    }

    @Override
    public void sendEmailVerification(String email, String rawToken) {
        lastVerificationToken = rawToken;
    }
}
