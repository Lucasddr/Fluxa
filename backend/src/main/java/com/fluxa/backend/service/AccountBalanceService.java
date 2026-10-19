package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.Account;
import com.fluxa.backend.domain.entity.AccountBalanceObservation;
import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.domain.enums.BalanceObservationSource;
import com.fluxa.backend.domain.enums.BalanceObservationStatus;
import com.fluxa.backend.domain.enums.BalanceResolution;
import com.fluxa.backend.domain.enums.BalanceTrustStatus;
import com.fluxa.backend.dto.request.create.CreateBalanceObservationDTO;
import com.fluxa.backend.dto.request.update.ResolveBalanceObservationDTO;
import com.fluxa.backend.dto.response.AccountBalanceSummaryResponseDTO;
import com.fluxa.backend.dto.response.BalanceObservationResponseDTO;
import com.fluxa.backend.dto.response.UserBalanceSummaryDTO;
import com.fluxa.backend.exception.AccountNotFoundException;
import com.fluxa.backend.exception.BalanceObservationNotFoundException;
import com.fluxa.backend.exception.InvalidBalanceObservationException;
import com.fluxa.backend.repository.AccountBalanceObservationRepository;
import com.fluxa.backend.repository.AccountRepository;
import com.fluxa.backend.repository.TransactionRepository;
import com.fluxa.backend.repository.UserRepository;
import com.fluxa.backend.security.context.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class AccountBalanceService {

    private final AccountRepository accountRepository;
    private final AccountBalanceObservationRepository observationRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AccountBalanceSummaryResponseDTO> listAccountSummaries() {
        UUID userId = UserContext.getUserId();
        return accountRepository.findAllForUser(userId).stream()
                .map(account -> getAccountSummary(account, userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public AccountBalanceSummaryResponseDTO getAccountSummary(UUID accountId) {
        UUID userId = UserContext.getUserId();
        Account account = findOwnedAccount(accountId, userId);
        return getAccountSummary(account, userId);
    }

    @Transactional(readOnly = true)
    public UserBalanceSummaryDTO getUserSummary(UUID userId) {
        List<AccountBalanceSummaryResponseDTO> summaries = accountRepository
                .findAllForUser(userId).stream()
                .map(account -> getAccountSummary(account, userId))
                .toList();

        BigDecimal currentBalance = summaries.stream()
                .map(AccountBalanceSummaryResponseDTO::currentBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal ledgerBalance = summaries.stream()
                .map(AccountBalanceSummaryResponseDTO::ledgerBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int pendingCount = summaries.stream()
                .mapToInt(AccountBalanceSummaryResponseDTO::pendingReviewCount)
                .sum();
        BigDecimal pendingDifference = summaries.stream()
                .filter(summary -> summary.pendingReviewCount() > 0)
                .map(summary -> summary.difference() == null ? BigDecimal.ZERO : summary.difference())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BalanceTrustStatus status = aggregateStatus(summaries);
        LocalDate balanceAsOf = commonBalanceDate(summaries);

        return new UserBalanceSummaryDTO(
                currentBalance,
                ledgerBalance,
                pendingDifference,
                balanceAsOf,
                status,
                pendingCount);
    }

    @Transactional(readOnly = true)
    public List<BalanceObservationResponseDTO> listObservations(UUID accountId) {
        UUID userId = UserContext.getUserId();
        findOwnedAccount(accountId, userId);
        return observationRepository.findAllForAccount(accountId, userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BalanceObservationResponseDTO createManualObservation(
            UUID accountId, CreateBalanceObservationDTO dto) {
        UUID userId = UserContext.getUserId();
        Account account = findOwnedAccount(accountId, userId);

        if (dto.balanceAsOf().isAfter(LocalDate.now())) {
            throw new InvalidBalanceObservationException(
                    "A data do saldo não pode estar no futuro.");
        }

        BigDecimal ledgerBalance = calculateLedgerBalanceAt(
                accountId, userId, dto.balanceAsOf());
        BigDecimal difference = dto.observedBalance().subtract(ledgerBalance);

        User user = userRepository.findById(userId)
                .orElseThrow(AccountNotFoundException::new);

        AccountBalanceObservation observation = new AccountBalanceObservation();
        observation.setUser(user);
        observation.setAccount(account);
        observation.setObservedBalance(dto.observedBalance());
        observation.setLedgerBalance(ledgerBalance);
        observation.setBalanceAsOf(dto.balanceAsOf());
        observation.setSource(BalanceObservationSource.MANUAL);
        observation.setStatus(difference.signum() == 0
                ? BalanceObservationStatus.RECONCILED
                : BalanceObservationStatus.PENDING_REVIEW);

        return toResponse(observationRepository.saveAndFlush(observation));
    }

    @Transactional
    public BalanceObservationResponseDTO resolveObservation(
            UUID accountId,
            UUID observationId,
            ResolveBalanceObservationDTO dto) {
        UUID userId = UserContext.getUserId();
        findOwnedAccount(accountId, userId);

        AccountBalanceObservation observation = observationRepository
                .lockByIdAndAccountAndUser(observationId, accountId, userId)
                .orElseThrow(BalanceObservationNotFoundException::new);

        if (observation.getStatus() != BalanceObservationStatus.PENDING_REVIEW) {
            throw new InvalidBalanceObservationException(
                    "Esta conferência já foi resolvida.");
        }

        observation.setStatus(dto.resolution() == BalanceResolution.USE_OBSERVED_BALANCE
                ? BalanceObservationStatus.OBSERVED_ACCEPTED
                : BalanceObservationStatus.LEDGER_ACCEPTED);
        observation.setReviewedAt(OffsetDateTime.now());

        return toResponse(observation);
    }

    @Transactional
    public void markPendingReviewForLedgerChange(
            UUID accountId,
            UUID userId,
            LocalDate occurredAt,
            OffsetDateTime transactionCreatedAt) {
        List<AccountBalanceObservation> affected = observationRepository.findAffectedObservations(
                accountId, userId, occurredAt, transactionCreatedAt);
        affected.forEach(observation -> {
            observation.setStatus(BalanceObservationStatus.PENDING_REVIEW);
            observation.setReviewedAt(null);
        });
        if (!affected.isEmpty()) {
            observationRepository.flush();
            affected.forEach(observation -> observation.setLedgerBalance(
                    calculateLedgerBalanceAt(accountId, userId, observation.getBalanceAsOf())));
            observationRepository.flush();
        }
    }

    private AccountBalanceSummaryResponseDTO getAccountSummary(Account account, UUID userId) {
        List<AccountBalanceObservation> observations = observationRepository
                .findAllForAccount(account.getId(), userId);
        AccountBalanceObservation latest = observations.isEmpty() ? null : observations.get(0);
        AccountBalanceObservation pending = observations.stream()
                .filter(observation -> observation.getStatus()
                        == BalanceObservationStatus.PENDING_REVIEW)
                .findFirst()
                .orElse(null);
        AccountBalanceObservation displayedObservation = pending != null ? pending : latest;
        AccountBalanceObservation anchor = observationRepository
                .findResolvedForAccount(account.getId(), userId,
                        BalanceObservationStatus.PENDING_REVIEW)
                .stream()
                .findFirst()
                .orElse(null);

        LocalDate today = LocalDate.now();
        BigDecimal ledgerBalance = transactionRepository.getAccountLedgerBalanceThrough(
                userId, account.getId(), today);
        BigDecimal currentBalance = anchor == null
                ? ledgerBalance
                : effectiveBalance(anchor).add(transactionRepository.getAccountNetMovementAfterObservation(
                        userId, account.getId(), anchor.getBalanceAsOf(),
                        anchor.getRecordedAt(), today));

        long pendingReviewCount = observations.stream()
                .filter(observation -> observation.getStatus()
                        == BalanceObservationStatus.PENDING_REVIEW)
                .count();

        return new AccountBalanceSummaryResponseDTO(
                account.getId(),
                account.getName(),
                displayedObservation == null ? null : displayedObservation.getId(),
                currentBalance,
                ledgerBalance,
                displayedObservation == null ? null : displayedObservation.getObservedBalance(),
                displayedObservation == null ? null : difference(displayedObservation),
                displayedObservation == null ? null : displayedObservation.getBalanceAsOf(),
                displayedObservation == null ? null : displayedObservation.getRecordedAt(),
                pendingReviewCount > 0
                        ? BalanceTrustStatus.PENDING_REVIEW
                        : latest == null
                                ? BalanceTrustStatus.NOT_RECONCILED
                                : toTrustStatus(latest.getStatus()),
                Math.toIntExact(pendingReviewCount));
    }

    private BigDecimal calculateLedgerBalanceAt(UUID accountId, UUID userId, LocalDate balanceAsOf) {
        AccountBalanceObservation prior = observationRepository
                .findResolvedForAccount(accountId, userId, BalanceObservationStatus.PENDING_REVIEW)
                .stream()
                .filter(observation -> !observation.getBalanceAsOf().isAfter(balanceAsOf))
                .findFirst()
                .orElse(null);

        if (prior == null) {
            return transactionRepository.getAccountLedgerBalanceThrough(
                    userId, accountId, balanceAsOf);
        }

        return effectiveBalance(prior).add(transactionRepository.getAccountNetMovementBetween(
                userId, accountId, prior.getBalanceAsOf(), prior.getRecordedAt(), balanceAsOf));
    }

    private Account findOwnedAccount(UUID accountId, UUID userId) {
        return accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(AccountNotFoundException::new);
    }

    private static BigDecimal effectiveBalance(AccountBalanceObservation observation) {
        return observation.getStatus() == BalanceObservationStatus.LEDGER_ACCEPTED
                ? observation.getLedgerBalance()
                : observation.getObservedBalance();
    }

    private static BigDecimal difference(AccountBalanceObservation observation) {
        return observation.getObservedBalance().subtract(observation.getLedgerBalance());
    }

    private static BalanceTrustStatus toTrustStatus(BalanceObservationStatus status) {
        return switch (status) {
            case PENDING_REVIEW -> BalanceTrustStatus.PENDING_REVIEW;
            case RECONCILED -> BalanceTrustStatus.RECONCILED;
            case OBSERVED_ACCEPTED, LEDGER_ACCEPTED -> BalanceTrustStatus.USER_ACCEPTED;
        };
    }

    private static BalanceTrustStatus aggregateStatus(
            List<AccountBalanceSummaryResponseDTO> summaries) {
        if (summaries.isEmpty()) {
            return BalanceTrustStatus.NOT_RECONCILED;
        }
        if (summaries.stream().anyMatch(s -> s.pendingReviewCount() > 0)) {
            return BalanceTrustStatus.PENDING_REVIEW;
        }
        if (summaries.stream().anyMatch(s -> s.status() == BalanceTrustStatus.NOT_RECONCILED)) {
            return BalanceTrustStatus.NOT_RECONCILED;
        }
        if (summaries.stream().anyMatch(s -> s.status() == BalanceTrustStatus.USER_ACCEPTED)) {
            return BalanceTrustStatus.USER_ACCEPTED;
        }
        return BalanceTrustStatus.RECONCILED;
    }

    private static LocalDate commonBalanceDate(List<AccountBalanceSummaryResponseDTO> summaries) {
        if (summaries.isEmpty() || summaries.stream().anyMatch(s -> s.balanceAsOf() == null)) {
            return null;
        }

        LocalDate firstDate = summaries.get(0).balanceAsOf();
        return summaries.stream().allMatch(s -> firstDate.equals(s.balanceAsOf()))
                ? firstDate
                : null;
    }

    private BalanceObservationResponseDTO toResponse(
            AccountBalanceObservation observation) {
        return new BalanceObservationResponseDTO(
                observation.getId(),
                observation.getAccount().getId(),
                observation.getObservedBalance(),
                observation.getLedgerBalance(),
                difference(observation),
                observation.getBalanceAsOf(),
                observation.getRecordedAt(),
                observation.getSource(),
                observation.getStatus(),
                observation.getReviewedAt());
    }
}
