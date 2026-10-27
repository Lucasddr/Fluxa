package com.fluxa.backend.controller;

import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.domain.enums.CategoryKind;
import com.fluxa.backend.dto.request.RegisterDTO;
import com.fluxa.backend.repository.AccountRepository;
import com.fluxa.backend.repository.CategoryRepository;
import com.fluxa.backend.repository.UserRepository;
import com.fluxa.backend.security.JwtService;
import com.fluxa.backend.service.AuthService;
import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Shared helpers for HTTP integration tests. Users are real rows created through
 * AuthService; requests are authenticated with a JWT cookie signed by the test secret.
 */
abstract class HttpIntegrationTestSupport {

    @Autowired protected MockMvc mockMvc;
    @Autowired protected AuthService authService;
    @Autowired protected UserRepository userRepository;
    @Autowired protected CategoryRepository categoryRepository;
    @Autowired protected AccountRepository accountRepository;
    @Autowired protected JwtService jwtService;
    @Autowired protected ObjectMapper objectMapper;

    protected User registerUser(String label) {
        String email = label + "-" + UUID.randomUUID() + "@test.local";
        authService.register(new RegisterDTO("QA " + label, email, "Teste1234"));
        return userRepository.findByEmail(email).orElseThrow();
    }

    protected Cookie accessCookie(User user) {
        return new Cookie("access_token", jwtService.generateJwt(user));
    }

    protected UUID defaultAccountId(User user) {
        return accountRepository.findDefaultForUser(user.getId()).orElseThrow().getId();
    }

    protected UUID categoryId(User user, CategoryKind kind) {
        return categoryRepository.findCategoryByUserId(user.getId(), PageRequest.of(0, 50))
                .getContent().stream()
                .filter(category -> category.getKind() == kind && category.isActive())
                .findFirst()
                .orElseThrow()
                .getId();
    }

    protected String json(Object value) {
        return objectMapper.writeValueAsString(value);
    }

    /** Compares a numeric JSON value by value, ignoring scale ("30.0" equals "30.00"). */
    protected static void assertDecimal(String body, String jsonPath, String expected) {
        Object raw = JsonPath.read(body, jsonPath);
        assertEquals(0, new BigDecimal(raw.toString()).compareTo(new BigDecimal(expected)),
                jsonPath + " expected " + expected + " but was " + raw);
    }

    /** Idempotency keys are validated against a 36-character domain limit. */
    protected static String shortKey(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 28);
    }

    protected static UUID uuidAt(String body, String jsonPath) {
        return UUID.fromString(JsonPath.read(body, jsonPath));
    }

    /** Accepts "2026-10-21" or "2026-10-21T00:00:00Z" for a LocalDate field. */
    protected static void assertDate(String body, String jsonPath, java.time.LocalDate expected) {
        Object raw = JsonPath.read(body, jsonPath);
        String text = raw == null ? null : raw.toString();
        assertTrue(text != null && text.startsWith(expected.toString()),
                jsonPath + " expected " + expected + " but was " + text);
    }
}
