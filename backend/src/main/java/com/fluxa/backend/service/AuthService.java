package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.RefreshToken;
import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.domain.enums.Role;
import com.fluxa.backend.dto.internal.TokenPair;
import com.fluxa.backend.dto.request.LoginDTO;
import com.fluxa.backend.dto.request.RegisterDTO;
import com.fluxa.backend.exception.EmailAlreadyExistsException;
import com.fluxa.backend.exception.InvalidCredentialsException;
import com.fluxa.backend.repository.UserRepository;
import com.fluxa.backend.security.JwtService;
import com.fluxa.backend.security.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Slf4j
@RequiredArgsConstructor
@Service
public class AuthService {


    public final UserRepository userRepository;
    public final PasswordEncoder passwordEncoder;
    public final JwtService jwtService;
    public final AccountService accountService;
    public final CategoriesService categoriesService;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public ResponseEntity<?> register(RegisterDTO dto){
        if (userRepository.existsByEmail(dto.email())){
            throw new EmailAlreadyExistsException();
        }

        User user = new User();

        user.setName(dto.name());
        user.setEmail(dto.email());

        long start = System.currentTimeMillis();
        user.setPasswordHash(passwordEncoder.encode(dto.password()));
        long end = System.currentTimeMillis();


        userRepository.save(user);

        log.info("[REGISTER] email: {}, hashtime: {}ms", user.getEmail(), (end - start));

        accountService.createDefaultAccount(user);

        categoriesService.createDefaultCategories(user);

        return ResponseEntity.ok("ok");
    }

    public TokenPair login(LoginDTO dto){

        log.info("[LOGIN_ATTEMPT] email: {}", dto.email());
        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new InvalidCredentialsException("Credenciais inválidas"));

        if (!passwordEncoder.matches(dto.password(), user.getPasswordHash())){
            log.warn("[LOGIN_FAIL] email: {}", dto.email());
            throw new InvalidCredentialsException("Credenciais inválidas");
        }
        log.info("[LOGIN_SUCCESS] email: {}", dto.email());

        String jwtToken = jwtService.generateJwt(user);
        String refreshToken = refreshTokenService.create(user);


        return new TokenPair(jwtToken, refreshToken);
    }

    public ResponseEntity<?> registerAdmin(RegisterDTO dto){

        if (userRepository.existsByEmail(dto.email())){
            throw new EmailAlreadyExistsException();
        }

        User user = new User();

        user.setName(dto.name());
        user.setEmail(dto.email());
        user.setRole(Role.ADMIN);

        long start = System.currentTimeMillis();
        user.setPasswordHash(passwordEncoder.encode(dto.password()));
        long end = System.currentTimeMillis();

        log.info("[REGISTER] email: {}, hashtime: {}ms", user.getEmail(), (end - start));

        userRepository.save(user);
        return ResponseEntity.ok("ok");
    }

    @Transactional
    public TokenPair refresh(String token){

        RefreshToken refreshToken = refreshTokenService.validate(token);

        User user = refreshToken.getUser();

        refreshTokenService.revoke(refreshToken);

        String newRefreshToken = refreshTokenService.create(user);
        String newAccessToken = jwtService.generateJwt(user);

        return new TokenPair(newAccessToken, newRefreshToken);
    }

}
