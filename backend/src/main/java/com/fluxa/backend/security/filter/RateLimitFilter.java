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
import org.springframework.web.ErrorResponse;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

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
