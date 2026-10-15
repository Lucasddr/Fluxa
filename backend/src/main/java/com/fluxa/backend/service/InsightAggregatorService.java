package com.fluxa.backend.service;

import com.fluxa.backend.dto.response.BiggestExpenseDTO;
import com.fluxa.backend.dto.response.EconomyCardDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InsightAggregatorService {

    private final InsightsService insightsService;

    public List<Object> getInsightCards(LocalDate start, LocalDate end) {

        EconomyCardDTO economy = insightsService.economyCardDTO(start, end);
        BiggestExpenseDTO biggestExpense = insightsService.getBiggestExpense(start, end);

        return List.of(
                economy,
                biggestExpense
        );
    }
}