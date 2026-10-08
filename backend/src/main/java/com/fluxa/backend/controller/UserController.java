package com.fluxa.backend.controller;

import com.fluxa.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/user")
public class UserController {

    private final UserService userService;

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteUser(@AuthenticationPrincipal UUID userId){

        userService.deleteUser(userId);

        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }

    @GetMapping
            ("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(Map.of("id", userId));
    }

}
