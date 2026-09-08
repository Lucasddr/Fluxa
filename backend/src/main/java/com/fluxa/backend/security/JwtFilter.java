package com.fluxa.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String jwt = null;
        log.info("[JWT] Request: {}", request.getRequestURI());

        Cookie[] cookies = request.getCookies();

        if (cookies == null) {
            log.info("[JWT] Nenhum cookie recebido");
        } else {
            for (Cookie cookie : cookies) {
                log.info("[JWT] Cookie recebido: {}", cookie.getName());

                if ("access_token".equals(cookie.getName())) {
                    jwt = cookie.getValue();
                    log.info("[JWT] access_token encontrado");
                    break;
                }
            }
        }

        if (jwt == null || jwt.isBlank()) {
            log.info("[JWT] Token não encontrado, seguindo sem autenticação");
            filterChain.doFilter(request, response);
            return;
        }

        log.info("[JWT] Token encontrado, tentando extrair userId");

        final UUID userId;

        try {
            userId = UUID.fromString(
                    jwtService.extractUserId(jwt)
            );

            log.info("[JWT] UserId extraído: {}", userId);

        } catch (Exception e) {
            log.warn("[JWT] Token inválido: {}", e.getMessage());
            filterChain.doFilter(request, response);
            return;
        }

        if (SecurityContextHolder.getContext().getAuthentication() == null) {

            log.info("[JWT] Criando Authentication");

            String role = jwtService.extractRole(jwt);

            log.info("[JWT] Role: {}", role);

            List<SimpleGrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_" + role)
            );

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            userId,
                            null,
                            authorities
                    );

            authToken.setDetails(
                    new WebAuthenticationDetailsSource()
                            .buildDetails(request)
            );

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(authToken);

            log.info("[JWT] Authentication criada com sucesso");
        }

        filterChain.doFilter(request, response);
    }
}