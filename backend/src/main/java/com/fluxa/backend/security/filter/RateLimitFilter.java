package com.fluxa.backend.security.filter;

import com.fluxa.backend.dto.response.ErrorResponseDTO;
import com.fluxa.backend.service.RateLimitService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.List;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Pattern STATEMENT_IMPORT_PREVIEW =
            Pattern.compile("^/accounts/[^/]+/statement-imports/(preview|preview-text)$");
    private static final Pattern STATEMENT_IMPORT =
            Pattern.compile("^/accounts/[^/]+/statement-imports$");
    private static final Pattern BALANCE_OBSERVATION =
            Pattern.compile("^/accounts/[^/]+/balance-observations$");

    private final RateLimitService rateLimitService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String uri = request.getRequestURI();
        String ip = request.getRemoteAddr();

        if (uri.equals("/auth/login")
                && !rateLimitService.isLoginAllowed(ip)) {

                sendTooManyRequests(response);
                return;

        }

        if (uri.equals("/auth/register")
                && !rateLimitService.isRegisterAllowed(ip)) {

                sendTooManyRequests(response);
                return;

        }

        if (uri.equals("/transactions/create")
                && "POST".equalsIgnoreCase(request.getMethod())
                && !rateLimitService.isTransactionCreateAllowed(ip)) {

                sendTooManyRequests(response);
                return;

        }

        if (uri.equals("/auth/forgot-password")
                && !rateLimitService.isForgotPasswordAllowed(ip)) {

                sendTooManyRequests(response);
                return;

        }

        if (uri.equals("/auth/reset-password")
                && !rateLimitService.isResetPasswordAllowed(ip)) {

                sendTooManyRequests(response);
                return;

        }

        if (uri.equals("/auth/send-verification")
                && !rateLimitService.isSendVerificationAllowed(ip)) {

                sendTooManyRequests(response);
                return;

        }

        if (uri.equals("/auth/verify-email")
                && !rateLimitService.isVerifyEmailAllowed(ip)) {

                sendTooManyRequests(response);
                return;

        }

        if (uri.equals("/credit-purchases/create")
                && "POST".equalsIgnoreCase(request.getMethod())
                && !rateLimitService.isCreditPurchaseCreateAllowed(ip)) {

                sendTooManyRequests(response);
                return;

        }

        if (uri.startsWith("/installments/")
                && uri.endsWith("/pay")
                && "POST".equalsIgnoreCase(request.getMethod())
                && !rateLimitService.isInstallmentPayAllowed(ip)) {

                sendTooManyRequests(response);
                return;

        }

        if ("POST".equalsIgnoreCase(request.getMethod())) {

            if (STATEMENT_IMPORT_PREVIEW.matcher(uri).matches()
                    && !rateLimitService.isStatementImportPreviewAllowed(ip)) {

                sendTooManyRequests(response);
                return;
            }

            if (STATEMENT_IMPORT.matcher(uri).matches()
                    && !rateLimitService.isStatementImportAllowed(ip)) {

                sendTooManyRequests(response);
                return;
            }

            if (BALANCE_OBSERVATION.matcher(uri).matches()
                    && !rateLimitService.isBalanceObservationAllowed(ip)) {

                sendTooManyRequests(response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void sendTooManyRequests(HttpServletResponse response) throws IOException {

        ErrorResponseDTO error = new ErrorResponseDTO(
                429,
                List.of("Muitas requisições. Por favor tente novamente mais tarde")
        );

        response.setStatus(429);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        response.getWriter().write(
                objectMapper.writeValueAsString(error)
        );
        response.setHeader("Retry-After", "60");
    }
}
