package com.fluxa.backend.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public boolean isLoginAllowed(String ip) {
        return tryConsume(
                "login:" + ip,
                5,
                5,
                Duration.ofMinutes(1)
        );
    }

    public boolean isRegisterAllowed(String ip) {
        return tryConsume(
                "register:" + ip,
                3,
                3,
                Duration.ofMinutes(1)
        );
    }

    public boolean tryConsume(String key, int capacity, int refillTokens, Duration refillDuration) {

        Bucket bucket = buckets.computeIfAbsent(
                key,
                ignored -> createBucket(capacity, refillTokens, refillDuration)
        );

        return bucket.tryConsume(1);
    }

    private Bucket createBucket(
            int capacity,
            int refillTokens,
            Duration refillDuration
    ) {
        Refill refill = Refill.greedy(
                refillTokens,
                refillDuration
        );

        Bandwidth limit = Bandwidth.classic(
                capacity,
                refill
        );

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
