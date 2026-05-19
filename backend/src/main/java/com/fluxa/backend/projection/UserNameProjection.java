package com.fluxa.backend.projection;

import com.fluxa.backend.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserNameProjection {
    String getName();
}
