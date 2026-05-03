package com.fluxa.backend.security.context;

import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public class UserContext {

    public static UUID getUserId() {
        return (UUID) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }
}