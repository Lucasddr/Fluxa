package com.fluxa.backend.controller;

import com.fluxa.backend.domain.enums.BalanceTrustStatus;
import com.fluxa.backend.domain.enums.CategoryKind;
import com.fluxa.backend.domain.enums.PaymentMethods;
import com.fluxa.backend.dto.request.create.CreateAccountDTO;
import com.fluxa.backend.dto.request.create.CreateBalanceObservationDTO;
import com.fluxa.backend.dto.request.create.CreateTransactionDTO;
import com.fluxa.backend.dto.request.update.ResolveBalanceObservationDTO;
import com.fluxa.backend.dto.request.update.UpdateAccountDTO;
import com.fluxa.backend.repository.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AccountBalanceHttpIntegrationTest extends HttpIntegrationTestSupport {

    @Autowired private TransactionRepository transactionRepository;

    @Test
    void accountEndpointsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/accounts")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/accounts/balances")).andExpect(status().isUnauthorized());
    }

    @Test
    void newUserStartsWithOneDefaultAccount() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("accounts-list");

        mockMvc.perform(get("/accounts").cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Principal"))
                .andExpect(jsonPath("$[0].currency").value("BRL"));
    }

    @Test
    void createAccountPersistsNonDefaultAccount() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("accounts-create");
        UUID defaultId = defaultAccountId(user);

        mockMvc.perform(post("/accounts").cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateAccountDTO("Poupanca QA"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Poupanca QA"))
                .andExpect(jsonPath("$.currency").value("BRL"));

        assertEquals(2, accountRepository.findAllForUser(user.getId()).size());
        assertEquals(1, accountRepository.findAllForUser(user.getId()).stream()
                .filter(com.fluxa.backend.domain.entity.Account::isDefault).count());
        assertEquals(defaultId, defaultAccountId(user));
    }

    @Test
    void invalidAccountNamesReturnBadRequestWithoutPersisting() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("accounts-invalid");

        mockMvc.perform(post("/accounts").cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateAccountDTO(" "))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
        mockMvc.perform(post("/accounts").cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateAccountDTO("x".repeat(101)))))
                .andExpect(status().isBadRequest());

        assertEquals(1, accountRepository.findAllForUser(user.getId()).size());
    }

    @Test
    void duplicateAccountNameIgnoringCaseReturnsConflict() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("accounts-duplicate");
        createAccount(user, "Reserva");

        mockMvc.perform(post("/accounts").cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateAccountDTO("reserva"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void renameAndDefaultSwitchArePersisted() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("accounts-rename");
        UUID reserva = createAccount(user, "Reserva");

        mockMvc.perform(patch("/accounts/{id}", reserva).cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new UpdateAccountDTO("Reserva Renomeada"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Reserva Renomeada"));
        mockMvc.perform(put("/accounts/{id}/default", reserva).cookie(accessCookie(user)))
                .andExpect(status().isOk());

        assertEquals(reserva, defaultAccountId(user));
        assertEquals("Reserva Renomeada", accountRepository
                .findByIdAndUserId(reserva, user.getId()).orElseThrow().getName());
    }

    @Test
    void accountWithTransactionOrObservationCannotBeDeleted() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("accounts-in-use");
        UUID withTransaction = createAccount(user, "Com Movimento");
        UUID withObservation = createAccount(user, "Com Saldo");

        mockMvc.perform(post("/transactions/create").cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(expense(user, withTransaction, "10.00", "Compra"))))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/accounts/{id}/balance-observations", withObservation)
                        .cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateBalanceObservationDTO(
                                BigDecimal.ZERO, LocalDate.now()))))
                .andExpect(status().isCreated());

        mockMvc.perform(delete("/accounts/{id}", withTransaction).cookie(accessCookie(user)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
        mockMvc.perform(delete("/accounts/{id}", withObservation).cookie(accessCookie(user)))
                .andExpect(status().isConflict());

        assertTrue(accountRepository.findByIdAndUserId(withTransaction, user.getId()).isPresent());
        assertTrue(accountRepository.findByIdAndUserId(withObservation, user.getId()).isPresent());
    }

    @Test
    void lastAccountCannotBeDeletedButEmptyExtraAccountCan() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("accounts-delete");
        UUID onlyAccount = defaultAccountId(user);

        mockMvc.perform(delete("/accounts/{id}", onlyAccount).cookie(accessCookie(user)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors[0]").value(
                        "A última conta do usuário não pode ser excluída."));

        UUID extra = createAccount(user, "Extra");
        mockMvc.perform(delete("/accounts/{id}", extra).cookie(accessCookie(user)))
                .andExpect(status().isOk());

        assertEquals(1, accountRepository.findAllForUser(user.getId()).size());
    }

    @Test
    void deletingEmptyDefaultAccountPromotesAnotherAccount() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("accounts-promote");
        UUID original = defaultAccountId(user);
        UUID replacement = createAccount(user, "Reserva");

        mockMvc.perform(delete("/accounts/{id}", original).cookie(accessCookie(user)))
                .andExpect(status().isOk());

        assertEquals(replacement, defaultAccountId(user));
        assertTrue(accountRepository.findByIdAndUserId(replacement, user.getId())
                .orElseThrow().isDefault());
    }

    @Test
    void anotherUserCannotReadOrChangeAccount() throws Exception {
        com.fluxa.backend.domain.entity.User owner = registerUser("owner-account");
        com.fluxa.backend.domain.entity.User other = registerUser("other-account");
        UUID ownerAccount = defaultAccountId(owner);

        mockMvc.perform(get("/accounts/{id}/balance", ownerAccount).cookie(accessCookie(other)))
                .andExpect(status().isNotFound());
        mockMvc.perform(patch("/accounts/{id}", ownerAccount).cookie(accessCookie(other))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new UpdateAccountDTO("Invadida"))))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/accounts/{id}/default", ownerAccount).cookie(accessCookie(other)))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/accounts/{id}", ownerAccount).cookie(accessCookie(other)))
                .andExpect(status().isNotFound());

        assertEquals("Principal", accountRepository
                .findByIdAndUserId(ownerAccount, owner.getId()).orElseThrow().getName());
    }

    @Test
    void balanceSummariesListOnlyTheCallersAccounts() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("summary-owner");
        com.fluxa.backend.domain.entity.User other = registerUser("summary-other");
        createAccount(user, "Saving");

        mockMvc.perform(get("/accounts/balances").cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
        mockMvc.perform(get("/accounts/balances").cookie(accessCookie(other)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value(BalanceTrustStatus.NOT_RECONCILED.name()));
    }

    @Test
    void manualObservationCreatesPendingReviewWithoutAdjustingTransactions() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("obs-pending");
        UUID accountId = defaultAccountId(user);

        String body = mockMvc.perform(post("/accounts/{id}/balance-observations", accountId)
                        .cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateBalanceObservationDTO(
                                new BigDecimal("1500.00"), LocalDate.now()))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING_REVIEW"))
                .andExpect(jsonPath("$.source").value("MANUAL"))
                .andExpect(jsonPath("$.reviewedAt").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        assertDecimal(body, "$.observedBalance", "1500.00");
        assertDecimal(body, "$.ledgerBalance", "0");
        assertDecimal(body, "$.difference", "1500.00");

        MvcResult summary = mockMvc.perform(get("/accounts/{id}/balance", accountId)
                        .cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(BalanceTrustStatus.PENDING_REVIEW.name()))
                .andExpect(jsonPath("$.pendingReviewCount").value(1))
                .andReturn();
        assertDecimal(summary.getResponse().getContentAsString(), "$.difference", "1500.00");

        assertEquals(0, transactionRepository.findAll().stream()
                .filter(tx -> tx.getUser().getId().equals(user.getId()))
                .count());
    }

    @Test
    void invalidObservationsAreRejected() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("obs-invalid");
        UUID accountId = defaultAccountId(user);

        mockMvc.perform(post("/accounts/{id}/balance-observations", accountId)
                        .cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateBalanceObservationDTO(
                                new BigDecimal("10.00"), LocalDate.now().plusDays(1)))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0]").value(
                        "A data do saldo não pode estar no futuro."));
        mockMvc.perform(post("/accounts/{id}/balance-observations", accountId)
                        .cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateBalanceObservationDTO(
                                new BigDecimal("10.123"), LocalDate.now()))))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/accounts/{id}/balance-observations", accountId)
                        .cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"observedBalance\":10}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/accounts/{id}/balance-observations", accountId)
                        .cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void resolvingObservationAcceptsItOnceAndRejectsRepeat() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("obs-resolve");
        UUID accountId = defaultAccountId(user);
        UUID observation = createObservation(user, accountId, "1500.00", LocalDate.now());

        mockMvc.perform(post("/accounts/{id}/balance-observations/{obs}/resolve", accountId, observation)
                        .cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new ResolveBalanceObservationDTO(
                                com.fluxa.backend.domain.enums.BalanceResolution.USE_OBSERVED_BALANCE))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OBSERVED_ACCEPTED"));

        mockMvc.perform(post("/accounts/{id}/balance-observations/{obs}/resolve", accountId, observation)
                        .cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new ResolveBalanceObservationDTO(
                                com.fluxa.backend.domain.enums.BalanceResolution.USE_REGISTERED_TRANSACTIONS))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0]").value("Esta conferência já foi resolvida."));

        MvcResult summary = mockMvc.perform(get("/accounts/{id}/balance", accountId)
                        .cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(BalanceTrustStatus.USER_ACCEPTED.name()))
                .andExpect(jsonPath("$.pendingReviewCount").value(0))
                .andReturn();
        assertDecimal(summary.getResponse().getContentAsString(), "$.currentBalance", "1500.00");
    }

    @Test
    void resolveRequiresChoiceAndExistingObservation() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("obs-resolve-missing");
        UUID accountId = defaultAccountId(user);
        UUID observation = createObservation(user, accountId, "50.00", LocalDate.now());

        mockMvc.perform(post("/accounts/{id}/balance-observations/{obs}/resolve", accountId, observation)
                        .cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/accounts/{id}/balance-observations/{obs}/resolve", accountId, UUID.randomUUID())
                        .cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new ResolveBalanceObservationDTO(
                                com.fluxa.backend.domain.enums.BalanceResolution.USE_OBSERVED_BALANCE))))
                .andExpect(status().isNotFound());
    }

    @Test
    void observationMatchingLedgerIsReconciledWithoutPendingReview() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("obs-reconciled");
        UUID accountId = defaultAccountId(user);
        mockMvc.perform(post("/transactions/create").cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(income(user, accountId, "100.00", "Receita"))))
                .andExpect(status().isCreated());

        String body = mockMvc.perform(post("/accounts/{id}/balance-observations", accountId)
                        .cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateBalanceObservationDTO(
                                new BigDecimal("100.00"), LocalDate.now()))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("RECONCILED"))
                .andReturn().getResponse().getContentAsString();
        assertDecimal(body, "$.difference", "0");

        MvcResult summary = mockMvc.perform(get("/accounts/{id}/balance", accountId)
                        .cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(BalanceTrustStatus.RECONCILED.name()))
                .andExpect(jsonPath("$.pendingReviewCount").value(0))
                .andReturn();
        assertDecimal(summary.getResponse().getContentAsString(), "$.currentBalance", "100.00");
    }

    @Test
    void observationMustMatchAnOwnedAccount() throws Exception {
        com.fluxa.backend.domain.entity.User owner = registerUser("obs-owner");
        com.fluxa.backend.domain.entity.User other = registerUser("obs-other");
        UUID ownerAccount = defaultAccountId(owner);
        UUID observation = createObservation(owner, ownerAccount, "900.00", LocalDate.now());

        mockMvc.perform(get("/accounts/{id}/balance-observations", ownerAccount)
                        .cookie(accessCookie(other)))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/accounts/{id}/balance-observations", ownerAccount)
                        .cookie(accessCookie(other))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateBalanceObservationDTO(BigDecimal.ONE, LocalDate.now()))))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/accounts/{id}/balance-observations/{obs}/resolve", ownerAccount, observation)
                        .cookie(accessCookie(other))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new ResolveBalanceObservationDTO(
                                com.fluxa.backend.domain.enums.BalanceResolution.USE_OBSERVED_BALANCE))))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/accounts/{id}/balance-observations", ownerAccount)
                        .cookie(accessCookie(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("PENDING_REVIEW"));
    }

    private UUID createAccount(com.fluxa.backend.domain.entity.User user, String name) throws Exception {
        String body = mockMvc.perform(post("/accounts").cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateAccountDTO(name))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return uuidAt(body, "$.id");
    }

    private UUID createObservation(com.fluxa.backend.domain.entity.User user, UUID accountId,
                                   String balance, LocalDate asOf) throws Exception {
        String body = mockMvc.perform(post("/accounts/{id}/balance-observations", accountId)
                        .cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateBalanceObservationDTO(new BigDecimal(balance), asOf))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return uuidAt(body, "$.id");
    }

    private CreateTransactionDTO expense(com.fluxa.backend.domain.entity.User user, UUID accountId,
                                         String amount, String description) {
        return new CreateTransactionDTO(categoryId(user, CategoryKind.EXPENSE),
                new BigDecimal(amount), description, LocalDate.now(), null,
                PaymentMethods.DEBIT, false, accountId);
    }

    private CreateTransactionDTO income(com.fluxa.backend.domain.entity.User user, UUID accountId,
                                        String amount, String description) {
        return new CreateTransactionDTO(categoryId(user, CategoryKind.INCOME),
                new BigDecimal(amount), description, LocalDate.now(), null,
                PaymentMethods.PIX, false, accountId);
    }
}
