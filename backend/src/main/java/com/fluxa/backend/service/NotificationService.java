package com.fluxa.backend.service;

public interface NotificationService {

    void sendPasswordReset(String email, String rawToken);

    void sendEmailVerification(String email, String rawToken);
}
