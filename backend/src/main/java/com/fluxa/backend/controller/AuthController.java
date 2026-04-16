package com.fluxa.backend.controller;

import com.fluxa.backend.dto.LoginDTO;
import com.fluxa.backend.dto.LoginResponseDTO;
import com.fluxa.backend.dto.RegisterDTO;
import com.fluxa.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/test")
    public ResponseEntity<?> registerTest(@RequestBody RegisterDTO dto){

        authService.test(dto);

        return ResponseEntity.ok(dto);
    }

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody RegisterDTO dto){

        authService.register(dto);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginDTO dto){

        LoginResponseDTO response = authService.login(dto);

        return ResponseEntity.ok(response);
    }
}
