package com.fluxa.backend.domain.entity;

import com.fluxa.backend.domain.enums.BalanceObservationSource;
import com.fluxa.backend.domain.enums.BalanceObservationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "account_balance_observations")
public class AccountBalanceObservation {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "observed_balance", nullable = false, precision = 12, scale = 2)
    private BigDecimal observedBalance;

    @Column(name = "ledger_balance", nullable = false, precision = 12, scale = 2)
    private BigDecimal ledgerBalance;

    @Column(name = "balance_as_of", nullable = false)
    private LocalDate balanceAsOf;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BalanceObservationSource source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private BalanceObservationStatus status;

    @Column(name = "recorded_at", nullable = false, updatable = false)
    @CreationTimestamp
    private OffsetDateTime recordedAt;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;
}
