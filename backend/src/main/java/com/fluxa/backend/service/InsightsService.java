package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.dto.response.BiggestExpenseDTO;
import com.fluxa.backend.dto.response.EconomyCardDTO;
import com.fluxa.backend.repository.TransactionRepository;
import com.fluxa.backend.security.context.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@Service
public class InsightsService {

    private final TransactionRepository transactionRepository;

    public BiggestExpenseDTO getBiggestExpense() {

        UUID userId = UserContext.getUserId();

        List<Object[]> result = transactionRepository.findBiggestExpense(userId);

        if (result.isEmpty()) {
            return new BiggestExpenseDTO(
                    "most_expense_category",
                    "N/A",
                    BigDecimal.ZERO,
                    0,
                    10,
                    BigDecimal.ZERO
            );
        }

        Object[] row = result.get(0);

        String categoryName = String.valueOf(row[0]);
        BigDecimal totalSpent = new BigDecimal(row[1].toString());

        BigDecimal totalExpenses = transactionRepository.sumAllExpenses(userId);

        Integer percentageOfExpenses = 0;

        if (totalExpenses != null && totalExpenses.compareTo(BigDecimal.ZERO) > 0) {
            percentageOfExpenses = totalSpent
                    .multiply(BigDecimal.valueOf(100))
                    .divide(totalExpenses, 0, RoundingMode.HALF_UP)
                    .intValue();
        }

        Integer suggestedReduction = 10;

        BigDecimal savingIfReduced = totalSpent
                .multiply(BigDecimal.valueOf(suggestedReduction))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        return new BiggestExpenseDTO(
                "most_expense_category",
                categoryName,
                totalSpent,
                percentageOfExpenses,
                suggestedReduction,
                savingIfReduced
        );
    }

    public EconomyCardDTO economyCardDTO() {

        UUID userId = UserContext.getUserId();

        BigDecimal totalIncome = Optional.ofNullable(
                transactionRepository.sumAllIncomes(userId)
        ).orElse(BigDecimal.ZERO);

        BigDecimal totalExpense = Optional.ofNullable(
                transactionRepository.sumAllExpenses(userId)
        ).orElse(BigDecimal.ZERO);

        BigDecimal savedAmount = totalIncome.subtract(totalExpense);

        Integer savingsPercentage = 0;

        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            savingsPercentage = savedAmount
                    .multiply(BigDecimal.valueOf(100))
                    .divide(totalIncome, 0, RoundingMode.HALF_UP)
                    .intValue();
        }

        Integer goalPercentage = 20; // depois pode vir do user settings

        return new EconomyCardDTO(
                "economy",
                savingsPercentage,
                savedAmount,
                totalIncome,
                goalPercentage
        );
    }
}
