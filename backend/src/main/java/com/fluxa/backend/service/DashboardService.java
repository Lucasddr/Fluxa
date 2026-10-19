package com.fluxa.backend.service;

import com.fluxa.backend.dto.response.BuildDashboardResponseDTO;
import com.fluxa.backend.dto.request.DashboardDTO;
import com.fluxa.backend.repository.InstallmentRepository;
import com.fluxa.backend.repository.TransactionRepository;
import com.fluxa.backend.repository.UserRepository;
import com.fluxa.backend.security.context.UserContext;
import com.fluxa.backend.dto.response.UserBalanceSummaryDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor

@Service
public class DashboardService {

    public final UserRepository userRepository;
    public final TransactionRepository transactionRepository;
    public final InstallmentRepository installmentRepository;
    private final AccountBalanceService accountBalanceService;

    public BuildDashboardResponseDTO buildDashboardDTO(DashboardDTO dto){

        UUID userId = UserContext.getUserId();

        String user = userRepository.findNameById(userId);
        String accountName = "Todas as contas";
        BigDecimal entry = transactionRepository.getTotalIncome(userId, dto.start(), dto.end());
        BigDecimal expenses = transactionRepository.getTotalExpense(userId, dto.start(), dto.end());
        UserBalanceSummaryDTO balance = accountBalanceService.getUserSummary(userId);
        BigDecimal payableAccounts = installmentRepository.getTotalPayableForward(
                userId, LocalDate.now().plusDays(dto.horizonDays() - 1L));
        BigDecimal monthlyBalance = entry.subtract(expenses);
        BigDecimal availableBalance = balance.currentBalance().subtract(payableAccounts);

        return new BuildDashboardResponseDTO(
                user,
                accountName,
                entry,
                expenses,
                payableAccounts,
                monthlyBalance,
                balance.currentBalance(),
                availableBalance,
                dto.horizonDays(),
                balance.status(),
                balance.pendingDifference(),
                balance.balanceAsOf(),
                balance.pendingReviewCount()
        );
    }
}
