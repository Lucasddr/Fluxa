package com.fluxa.backend.controller;

import com.fluxa.backend.domain.enums.CategoryKind;
import com.fluxa.backend.domain.enums.PaymentMethods;
import com.fluxa.backend.dto.request.create.CreateCreditPurchaseDTO;
import com.fluxa.backend.dto.request.create.CreateBalanceObservationDTO;
import com.fluxa.backend.dto.request.create.CreateTransactionDTO;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DashboardHttpIntegrationTest extends HttpIntegrationTestSupport {

    private static final LocalDate START = LocalDate.now().minusDays(5);
    private static final LocalDate END = LocalDate.now();

    @Test
    void dashboardRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/dashboard/buildDashboard?start={s}&end={e}", START, END))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/dashboard/insightCards")).andExpect(status().isUnauthorized());
    }

    @Test
    void dashboardRejectsInvalidRanges() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("dash-range");

        mockMvc.perform(get("/dashboard/buildDashboard?start={s}&end={e}", END, START)
                        .cookie(accessCookie(user)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("start deve ser anterior ou igual a end"));

        String nearLimit = START.minusDays(370) + "T00:00:00";
        mockMvc.perform(get("/dashboard/buildDashboard?start={s}&end={e}",
                        START.minusDays(370), END).cookie(accessCookie(user)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("intervalo máximo permitido: 366 dias"));

        mockMvc.perform(get("/dashboard/buildDashboard?end={e}", END).cookie(accessCookie(user)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0]").value(
                        "Parâmetro obrigatório ausente: start."));

        mockMvc.perform(get("/dashboard/buildDashboard?start=x&end={e}", END)
                        .cookie(accessCookie(user)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void dashboardAcceptsOnlyBuiltInHorizons() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("dash-horizon");

        mockMvc.perform(get("/dashboard/buildDashboard?start={s}&end={e}&horizonDays=15",
                        START, END).cookie(accessCookie(user)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("horizonDays deve ser 7, 30 ou 90"));

        mockMvc.perform(get("/dashboard/buildDashboard?start={s}&end={e}&horizonDays=7",
                        START, END).cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.forecastDays").value(7));

        mockMvc.perform(get("/dashboard/buildDashboard?start={s}&end={e}&horizonDays=90",
                        START, END).cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.forecastDays").value(90));
    }

    @Test
    void dashboardAggregatesIncomeExpensesAndPayableInstallments() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("dash-aggregate");
        UUID accountId = defaultAccountId(user);

        createViaTransaction(user, accountId, CategoryKind.INCOME, "250.00",
                "Salario QA", LocalDate.now(), PaymentMethods.PIX);
        createViaTransaction(user, accountId, CategoryKind.EXPENSE, "80.00",
                "Mercado QA", LocalDate.now(), PaymentMethods.DEBIT);
        mockMvc.perform(post("/credit-purchases/create")
                        .cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateCreditPurchaseDTO("Notebook QA", "Loja",
                                new BigDecimal("240.00"), LocalDate.now(), 3,
                                LocalDate.now().plusDays(2), categoryId(user, CategoryKind.EXPENSE),
                                null,
                                List.of(new CreateCreditPurchaseDTO.ManualInstallmentDTO(
                                                new BigDecimal("70.00"), LocalDate.now().plusDays(2)),
                                        new CreateCreditPurchaseDTO.ManualInstallmentDTO(
                                                new BigDecimal("70.00"), LocalDate.now().plusDays(10)),
                                        new CreateCreditPurchaseDTO.ManualInstallmentDTO(
                                                new BigDecimal("100.00"), LocalDate.now().plusDays(25))),
                                null))))
                .andExpect(status().isCreated());

        String body = mockMvc.perform(get(
                        "/dashboard/buildDashboard?start={s}&end={e}&horizonDays=30", START, END)
                        .cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountName").value("Todas as contas"))
                .andExpect(jsonPath("$.forecastDays").value(30))
                .andExpect(jsonPath("$.balanceStatus").value("NOT_RECONCILED"))
                .andExpect(jsonPath("$.pendingBalanceReviews").value(0))
                .andReturn().getResponse().getContentAsString();

        assertDecimal(body, "$.entry", "250.00");
        assertDecimal(body, "$.expenses", "80.00");
        assertDecimal(body, "$.monthlyBalance", "170.00");
        assertDecimal(body, "$.accountsPayable", "240.00");
        assertDecimal(body, "$.currentBalance", "170.00");
        assertDecimal(body, "$.availableBalance", "-70.00");
    }

    @Test
    void dashboardReflectsBalanceReviewState() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("dash-review");
        UUID accountId = defaultAccountId(user);

        mockMvc.perform(get("/dashboard/buildDashboard?start={s}&end={e}", START, END)
                        .cookie(accessCookie(user)))
                .andExpect(jsonPath("$.balanceStatus").value("NOT_RECONCILED"))
                .andExpect(jsonPath("$.pendingBalanceReviews").value(0))
                .andExpect(jsonPath("$.user").value("QA dash-review"));

        String created = mockMvc.perform(post("/accounts/{id}/balance-observations", accountId)
                        .cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateBalanceObservationDTO(
                                new BigDecimal("900.00"), LocalDate.now()))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        UUID observation = uuidAt(created, "$.id");

        String pending = mockMvc.perform(get(
                        "/dashboard/buildDashboard?start={s}&end={e}&horizonDays=7", START, END)
                        .cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balanceStatus").value("PENDING_REVIEW"))
                .andExpect(jsonPath("$.pendingBalanceReviews").value(1))
                .andReturn().getResponse().getContentAsString();
        assertDecimal(pending, "$.balanceDifference", "900.00");
        assertDecimal(pending, "$.currentBalance", "0");
        assertDate(pending, "$.balanceAsOf", LocalDate.now());

        mockMvc.perform(post("/accounts/{id}/balance-observations/{obs}/resolve",
                        accountId, observation)
                        .cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new com.fluxa.backend.dto.request.update.ResolveBalanceObservationDTO(
                                com.fluxa.backend.domain.enums.BalanceResolution.USE_OBSERVED_BALANCE))))
                .andExpect(status().isOk());

        String resolved = mockMvc.perform(get(
                        "/dashboard/buildDashboard?start={s}&end={e}", START, END)
                        .cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balanceStatus").value("USER_ACCEPTED"))
                .andExpect(jsonPath("$.pendingBalanceReviews").value(0))
                .andReturn().getResponse().getContentAsString();
        assertDecimal(resolved, "$.currentBalance", "900.00");
        assertDecimal(resolved, "$.balanceDifference", "0");
        assertDecimal(resolved, "$.availableBalance", "900.00");
    }

    @Test
    void recentTransactionsListsAndValidatesRange() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("dash-recent");
        UUID accountId = defaultAccountId(user);
        createViaTransaction(user, accountId, CategoryKind.INCOME, "100.00",
                "Freelance QA", LocalDate.now(), PaymentMethods.PIX);
        createViaTransaction(user, accountId, CategoryKind.EXPENSE, "30.00",
                "Cinema QA", LocalDate.now(), PaymentMethods.DEBIT);

        mockMvc.perform(get("/dashboard/recentTransactions").cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2));

        mockMvc.perform(get("/dashboard/recentTransactions?start={s}&end={e}", START, END)
                        .cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2));

        mockMvc.perform(get("/dashboard/recentTransactions?start={s}", START)
                        .cookie(accessCookie(user)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("start e end devem ser informados juntos"));

        mockMvc.perform(get("/dashboard/recentTransactions?start={s}&end={e}", END, START)
                        .cookie(accessCookie(user)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("start deve ser anterior ou igual a end"));
    }

    @Test
    void insightCardsRespondForAuthenticatedUser() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("dash-cards");

        mockMvc.perform(get("/dashboard/insightCards").cookie(accessCookie(user)))
                .andExpect(status().isOk());
    }

    private void createViaTransaction(com.fluxa.backend.domain.entity.User user,
                                      UUID accountId, CategoryKind kind, String amount,
                                      String description, LocalDate occurredAt,
                                      PaymentMethods method) throws Exception {
        mockMvc.perform(post("/transactions/create").cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateTransactionDTO(categoryId(user, kind),
                                new BigDecimal(amount), description, occurredAt,
                                null, method, false, accountId))))
                .andExpect(status().isCreated());
    }
}
