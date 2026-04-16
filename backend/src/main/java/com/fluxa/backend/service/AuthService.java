package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.dto.LoginDTO;
import com.fluxa.backend.dto.LoginResponseDTO;
import com.fluxa.backend.dto.RegisterDTO;
import com.fluxa.backend.exception.EmailAlreadyExistsException;
import com.fluxa.backend.exception.InvalidCredentialsException;
import com.fluxa.backend.repository.UserRepository;
import com.fluxa.backend.security.JwtService;
import io.jsonwebtoken.Jwt;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AuthService {

    public final UserRepository userRepository;
    public final PasswordEncoder passwordEncoder;
    public final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder, JwtService jwtService){
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }


    public void test(RegisterDTO dto){
        log.info("===ENDPOINT-TEST===");
        log.info("Email: " + dto.email());
        log.info("Senha: " + dto.password());
        log.info("===================");
    }

    public void register(RegisterDTO dto){
        if (userRepository.existsByEmail(dto.email())){
            throw new EmailAlreadyExistsException();
        }

        User user = new User();

        user.setName(dto.name());
        user.setEmail(dto.email());

        long start = System.currentTimeMillis();
        user.setPasswordHash(passwordEncoder.encode(dto.password()));
        long end = System.currentTimeMillis();

        log.info("[REGISTER] email: {}, hashtime: {}ms", user.getEmail(), (end - start));

        userRepository.save(user);
    }

    public LoginResponseDTO login(LoginDTO dto){

        log.info("[LOGIN_ATTEMPT] email: {}", dto.email());
        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(dto.password(), user.getPasswordHash())){
            log.warn("[LOGIN_FAIL] email: {}", dto.email());
            throw new InvalidCredentialsException();
        }
        log.info("[LOGIN_SUCESS] email: {}", dto.email());

        String token = jwtService.generateJwt(user);

        return new LoginResponseDTO(token);
    }

}
