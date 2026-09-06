package com.fluxa.backend.controller;

import com.fluxa.backend.dto.request.LoginDTO;
import com.fluxa.backend.dto.response.LoginResponseDTO;
import com.fluxa.backend.dto.request.RegisterDTO;
import com.fluxa.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDTO dto){

        authService.register(dto);

        return ResponseEntity.status(HttpStatus.CREATED).body( Map.of(
                "message", "Conta criada com sucesso",
                "email", dto.email())
        );
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginDTO dto){

        LoginResponseDTO response = authService.login(dto);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/registerAdmin")
    public ResponseEntity<?> registerAdmin(@Valid @RequestBody RegisterDTO dto){

        authService.registerAdmin(dto);

        return ResponseEntity.status(HttpStatus.CREATED).body( Map.of(
                "message", "Conta criada com sucesso",
                "email", dto.email())
        );
    }
}
