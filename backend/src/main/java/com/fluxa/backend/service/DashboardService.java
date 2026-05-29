package com.fluxa.backend.service;

import com.fluxa.backend.dto.response.BuildDashboardResponseDTO;
import com.fluxa.backend.dto.request.DashboardDTO;
import com.fluxa.backend.repository.AccountRepository;
import com.fluxa.backend.repository.InstallmentRepository;
import com.fluxa.backend.repository.TransactionRepository;
import com.fluxa.backend.repository.UserRepository;
import com.fluxa.backend.security.context.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor

@Service
public class DashboardService {

    public final UserRepository userRepository;
    public final AccountRepository accountRepository;
    public final TransactionRepository transactionRepository;
    public final InstallmentRepository installmentRepository;
    public final TransactionService transactionService;

    public BuildDashboardResponseDTO buildDashboardDTO(DashboardDTO dto){

        UUID userId = UserContext.getUserId();

        String user = userRepository.findNameById(userId);
        String accountName = accountRepository.findAccountNameByUserId(userId);
        BigDecimal entry = transactionRepository.getTotalIncome(userId, dto.start(), dto.end());
        BigDecimal expenses = transactionRepository.getTotalExpense(userId, dto.start(), dto.end());
        BigDecimal payableAccounts = installmentRepository.getTotalPayableAccounts(userId, dto.start(), dto.end());
        BigDecimal montlhyBalance = entry.subtract(expenses).subtract(payableAccounts);

        return new BuildDashboardResponseDTO(
                user,
                accountName,
                entry,
                expenses,
                payableAccounts,
                montlhyBalance

        );
    }
}
