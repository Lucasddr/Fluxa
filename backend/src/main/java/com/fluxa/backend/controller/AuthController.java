package com.fluxa.backend.controller;

import com.fluxa.backend.dto.RegisterDTO;
import com.fluxa.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService){
        this.authService = authService;
    }

    @PostMapping("/test")
    public ResponseEntity<?> registerTest(@RequestBody RegisterDTO dto){

        authService.test(dto);

        return ResponseEntity.ok(dto);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterDTO dto){

        authService.register(dto);

        return ResponseEntity.ok("Salvo no banco");
    }
}
