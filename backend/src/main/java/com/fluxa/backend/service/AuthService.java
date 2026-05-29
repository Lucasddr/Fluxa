package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.domain.enums.Role;
import com.fluxa.backend.dto.request.LoginDTO;
import com.fluxa.backend.dto.response.LoginResponseDTO;
import com.fluxa.backend.dto.request.RegisterDTO;
import com.fluxa.backend.exception.EmailAlreadyExistsException;
import com.fluxa.backend.exception.InvalidCredentialsException;
import com.fluxa.backend.repository.AccountRepository;
import com.fluxa.backend.repository.UserRepository;
import com.fluxa.backend.security.JwtService;
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
    public final AccountRepository accountRepository;
    public final CategoriesService categoriesService;


    public void test(RegisterDTO dto){
        log.info("===ENDPOINT-TEST===");
        log.info("Email: " + dto.email());
        log.info("Senha: " + dto.password());
        log.info("===================");
    }

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
        String accountId = accountRepository.findByUserId(user.getId());


        return new LoginResponseDTO(token, accountId);
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

}
