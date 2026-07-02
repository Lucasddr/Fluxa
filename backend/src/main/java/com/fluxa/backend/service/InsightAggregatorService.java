package com.fluxa.backend.service;

import com.fluxa.backend.dto.response.BiggestExpenseDTO;
import com.fluxa.backend.dto.response.EconomyCardDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InsightAggregatorService {

    private final InsightsService insightsService;

    public List<Object> getInsightCards() {

        EconomyCardDTO economy = insightsService.economyCardDTO();
        BiggestExpenseDTO biggestExpense = insightsService.getBiggestExpense();

        return List.of(
                economy,
                biggestExpense
        );
    }
}