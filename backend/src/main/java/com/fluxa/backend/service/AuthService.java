package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.dto.RegisterDTO;
import com.fluxa.backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AuthService {

    public final UserRepository userRepository;
    public final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository,
                          PasswordEncoder passwordEncoder){
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }


    public void test(RegisterDTO dto){

        log.info("===ENDPOINT-TEST===");
        log.info("Email: " + dto.email());
        log.info("Senha: " + dto.password());
        log.info("===================");

    }

    public void register(RegisterDTO dto){

        User user = new User();

        user.setName(dto.name());
        user.setEmail(dto.email());

        long start = System.currentTimeMillis();

        user.setPasswordHash(passwordEncoder.encode(dto.password()));

        long end = System.currentTimeMillis();

        log.info("===============");
        log.info("Email: " + user.getEmail());
        log.info("Senha encriptada: " + user.getPasswordHash());
        log.info("Tempo de hash: " + (end - start));
        log.info("===============");

        userRepository.save(user);
    }

}
