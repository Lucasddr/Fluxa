package com.fluxa.backend.security.filter;

import com.fluxa.backend.service.RateLimitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import tools.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

class RateLimitFilterTest {

    private RateLimitFilter filter;

    @BeforeEach
    void setUp() {
        filter = new RateLimitFilter(new RateLimitService(), new ObjectMapper());
    }

    private MockHttpServletResponse call(String method, String uri, String ip) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setRemoteAddr(ip);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        return response;
    }

    @Test
    void statementImportIsLimitedPerIp() throws Exception {
        String uri = "/accounts/11111111-1111-1111-1111-111111111111/statement-imports";

        for (int i = 0; i < 10; i++) {
            assertNotEquals(429, call("POST", uri, "203.0.113.7").getStatus());
        }

        assertEquals(429, call("POST", uri, "203.0.113.7").getStatus());
        assertNotEquals(429, call("POST", uri, "203.0.113.8").getStatus());
    }

    @Test
    void statementImportPreviewIsLimitedPerIp() throws Exception {
        String uri = "/accounts/11111111-1111-1111-1111-111111111111/statement-imports/preview";

        for (int i = 0; i < 20; i++) {
            assertNotEquals(429, call("POST", uri, "203.0.113.9").getStatus());
        }

        assertEquals(429, call("POST", uri, "203.0.113.9").getStatus());
    }

    @Test
    void pastedTextPreviewSharesThePreviewLimit() throws Exception {
        String uri = "/accounts/11111111-1111-1111-1111-111111111111/statement-imports/preview-text";

        for (int i = 0; i < 20; i++) {
            assertNotEquals(429, call("POST", uri, "203.0.113.10").getStatus());
        }

        assertEquals(429, call("POST", uri, "203.0.113.10").getStatus());
    }

    @Test
    void balanceObservationIsLimitedPerIp() throws Exception {
        String uri = "/accounts/11111111-1111-1111-1111-111111111111/balance-observations";

        for (int i = 0; i < 20; i++) {
            assertNotEquals(429, call("POST", uri, "203.0.113.11").getStatus());
        }

        assertEquals(429, call("POST", uri, "203.0.113.11").getStatus());
    }

    @Test
    void readRequestsAreNotLimitedByTheNewBuckets() throws Exception {
        String uri = "/accounts/11111111-1111-1111-1111-111111111111/statement-imports";

        for (int i = 0; i < 25; i++) {
            assertNotEquals(429, call("GET", uri, "203.0.113.12").getStatus());
        }
    }
}
