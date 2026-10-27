package com.fluxa.backend.security.filter;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

/**
 * Prova que o rate limit usa o IP do cliente encaminhado pelo proxy confiavel
 * (X-Forwarded-For) e nao o IP do proxy. Sem server.forward-headers-strategy
 * nativo, todos os usuarios atras do nginx/Render compartilhariam um bucket.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class RateLimitForwardedIpIntegrationTest {

    @LocalServerPort
    private int port;

    private final HttpClient client = HttpClient.newHttpClient();

    private int login(String forwardedFor) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://127.0.0.1:" + port + "/auth/login"))
                .header("Content-Type", "application/json")
                .header("X-Forwarded-For", forwardedFor)
                .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"email\":\"nobody@example.com\",\"password\":\"wrong-password\"}"))
                .build();

        return client.send(request, HttpResponse.BodyHandlers.discarding()).statusCode();
    }

    @Test
    void forwardedClientIpGetsItsOwnBucket() throws Exception {
        for (int i = 0; i < 5; i++) {
            assertEquals(401, login("198.51.100.10"));
        }

        assertEquals(429, login("198.51.100.10"));
        assertNotEquals(429, login("198.51.100.11"));
    }
}
