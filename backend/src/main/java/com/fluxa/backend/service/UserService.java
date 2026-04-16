package com.fluxa.backend.service;

import com.fluxa.backend.repository.UserRepository;
import com.fluxa.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@Service
public class UserService {

    public final JwtService jwtService;
    public final UserRepository userRepository;

    public void deleteUser(UUID userId){
        userRepository.deleteById(userId);
        log.info("[DELETE] user: {}, deleted the account", userId);

    }

}
