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
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor

@Service
public class DashboardService {

    public final UserRepository userRepository;
    public final AccountRepository accountRepository;
    public final TransactionRepository transactionRepository;
    public final InstallmentRepository installmentRepository;

    public BuildDashboardResponseDTO buildDashboardDTO(DashboardDTO dto){

        UUID userId = UserContext.getUserId();

        String user = userRepository.findNameById(userId);
        String accountName = accountRepository.findAccountNameByUserId(userId);
        BigDecimal entry = transactionRepository.getTotalIncome(userId, dto.start(), dto.end());
        BigDecimal expenses = transactionRepository.getTotalExpense(userId, dto.start(), dto.end());
        BigDecimal payableAccounts = installmentRepository.getTotalPayableForward(
                userId, horizonEnd(dto));
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

    private static LocalDate horizonEnd(DashboardDTO dto) {
        long days = ChronoUnit.DAYS.between(dto.start(), dto.end()) + 1;

        return LocalDate.now().plusDays(days - 1);
    }
}
