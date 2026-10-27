package com.fluxa.backend.controller;

import com.fluxa.backend.domain.entity.Category;
import com.fluxa.backend.domain.enums.CategoryKind;
import com.fluxa.backend.domain.enums.InstallmentStatus;
import com.fluxa.backend.dto.request.create.CreateCreditPurchaseDTO;
import com.fluxa.backend.dto.request.update.UpdateCreditPurchaseDTO;
import com.fluxa.backend.dto.request.update.UpdateInstallmentDTO;
import com.fluxa.backend.repository.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CreditPurchaseInstallmentHttpIntegrationTest extends HttpIntegrationTestSupport {

    @Autowired private TransactionRepository transactionRepository;

    @Test
    void purchaseEndpointsRequireAuthentication() throws Exception {
        mockMvc.perform(post("/credit-purchases/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(shapedPurchase("Sem Cookie", "100.00", 1,
                                LocalDate.now().plusMonths(1), null, null, null))))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/installments/list")).andExpect(status().isUnauthorized());
    }

    @Test
    void equalInstallmentsGetResidueOnLastAndMonthlyDueDates() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("purchase-equal");
        UUID purchaseId = createPurchase(user, "Notebook QA", "100.00", 3,
                LocalDate.now().plusDays(1), null);

        String details = mockMvc.perform(get("/credit-purchases/{id}", purchaseId)
                        .cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Notebook QA"))
                .andExpect(jsonPath("$.installmentsQty").value(3))
                .andExpect(jsonPath("$.pendingCount").value(3))
                .andExpect(jsonPath("$.paidCount").value(0))
                .andExpect(jsonPath("$.generatedTransactionsCount").value(0))
                .andExpect(jsonPath("$.installments.length()").value(3))
                .andExpect(jsonPath("$.installments[0].number").value(1))
                .andReturn().getResponse().getContentAsString();
        assertDecimal(details, "$.totalAmount", "100.00");
        assertDecimal(details, "$.installments[0].amount", "33.33");
        assertDecimal(details, "$.installments[1].amount", "33.33");
        assertDecimal(details, "$.installments[2].amount", "33.34");
        assertDate(details, "$.installments[0].dueDate", LocalDate.now().plusDays(1));
        assertDate(details, "$.installments[2].dueDate", LocalDate.now().plusDays(1).plusMonths(2));
    }

    @Test
    void manualInstallmentsArePersistedAsProvided() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("purchase-manual");
        UUID purchaseId = createPurchase(user, "Compra Manual QA", "15.00", 2,
                LocalDate.now().plusMonths(1),
                List.of(new CreateCreditPurchaseDTO.ManualInstallmentDTO(
                                new BigDecimal("12.50"), LocalDate.now().plusDays(2)),
                        new CreateCreditPurchaseDTO.ManualInstallmentDTO(
                                new BigDecimal("2.50"), LocalDate.now().plusMonths(2))));

        String details = mockMvc.perform(get("/credit-purchases/{id}", purchaseId)
                        .cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.installments.length()").value(2))
                .andReturn().getResponse().getContentAsString();
        assertDecimal(details, "$.installments[0].amount", "12.50");
        assertDecimal(details, "$.installments[1].amount", "2.50");
        assertDate(details, "$.installments[0].dueDate", LocalDate.now().plusDays(2));
        assertDate(details, "$.installments[1].dueDate", LocalDate.now().plusMonths(2));
    }

    @Test
    void manualInstallmentsMustMatchTotalAndQuantity() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("purchase-manual-invalid");
        UUID categoryId = categoryId(user, CategoryKind.EXPENSE);

        mockMvc.perform(post("/credit-purchases/create").cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateCreditPurchaseDTO("Compra QA", null,
                                new BigDecimal("20.00"), LocalDate.now(), 2,
                                LocalDate.now().plusMonths(1), categoryId, null,
                                List.of(new CreateCreditPurchaseDTO.ManualInstallmentDTO(
                                                new BigDecimal("10.00"), LocalDate.now().plusDays(1)),
                                        new CreateCreditPurchaseDTO.ManualInstallmentDTO(
                                                new BigDecimal("5.00"), LocalDate.now().plusMonths(1))),
                                defaultAccountId(user)))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0]").value(
                        "Soma das parcelas deve ser igual ao valor total da compra"));

        mockMvc.perform(post("/credit-purchases/create").cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateCreditPurchaseDTO("Compra QA", null,
                                new BigDecimal("15.00"), LocalDate.now(), 3,
                                LocalDate.now().plusMonths(1), categoryId, null,
                                List.of(new CreateCreditPurchaseDTO.ManualInstallmentDTO(
                                                new BigDecimal("10.00"), LocalDate.now().plusDays(1)),
                                        new CreateCreditPurchaseDTO.ManualInstallmentDTO(
                                                new BigDecimal("5.00"), LocalDate.now().plusMonths(1))),
                                defaultAccountId(user)))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/credit-purchases/list").cookie(accessCookie(user)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void createPurchaseValidationsReturnBadRequest() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("purchase-validation");
        UUID categoryId = categoryId(user, CategoryKind.EXPENSE);
        UUID accountId = defaultAccountId(user);

        mockMvc.perform(post("/credit-purchases/create").cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new CreateCreditPurchaseDTO(" ", "Mercado",
                                new BigDecimal("100.00"), LocalDate.now(), 1,
                                LocalDate.now().plusMonths(1), categoryId, null, null, accountId))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0]").value("Título é obrigatório"));

        List<String> invalidBodies = List.of(
                json(new CreateCreditPurchaseDTO("Compra QA", "Mercado",
                        new BigDecimal("100.00"), LocalDate.now(), 0,
                        LocalDate.now().plusMonths(1), categoryId, null, null, accountId)),
                json(new CreateCreditPurchaseDTO("Compra QA", "Mercado",
                        new BigDecimal("100.001"), LocalDate.now(), 1,
                        LocalDate.now().plusMonths(1), categoryId, null, null, accountId)),
                json(new CreateCreditPurchaseDTO("Compra QA", "Mercado",
                        new BigDecimal("100.00"), LocalDate.now(), 1,
                        LocalDate.now().plusMonths(1), categoryId, "x".repeat(251), null, accountId)));

        for (String body : invalidBodies) {
            mockMvc.perform(post("/credit-purchases/create").cookie(accessCookie(user))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isBadRequest());
        }

        mockMvc.perform(get("/credit-purchases/list").cookie(accessCookie(user)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void purchaseRequiresAnOwnedActiveExpenseCategory() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("purchase-category");
        com.fluxa.backend.domain.entity.User other = registerUser("purchase-category-other");
        UUID accountId = defaultAccountId(user);

        mockMvc.perform(post("/credit-purchases/create").cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(shapedPurchase("Compra QA", "50.00", 1,
                                LocalDate.now().plusMonths(1),
                                categoryId(other, CategoryKind.EXPENSE), null, null))))
                .andExpect(status().isNotFound());

        com.fluxa.backend.domain.entity.Category income = categoryRepository
                .findByIdAndUserId(categoryId(user, CategoryKind.INCOME), user.getId()).orElseThrow();
        mockMvc.perform(post("/credit-purchases/create").cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(shapedPurchase("Compra QA", "50.00", 1,
                                LocalDate.now().plusMonths(1), income.getId(), null, null))))
                .andExpect(status().isBadRequest());

        com.fluxa.backend.domain.entity.Category active = categoryRepository
                .findByIdAndUserId(categoryId(user, CategoryKind.EXPENSE), user.getId()).orElseThrow();
        active.setActive(false);
        mockMvc.perform(post("/credit-purchases/create").cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(shapedPurchase("Compra QA", "50.00", 1,
                                LocalDate.now().plusMonths(1), active.getId(), null, null))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/credit-purchases/list").cookie(accessCookie(user)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void purchaseAccountDefaultsAndRejectsForeignAccount() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("purchase-account");
        com.fluxa.backend.domain.entity.User other = registerUser("purchase-account-other");

        mockMvc.perform(post("/credit-purchases/create").cookie(accessCookie(other))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(shapedPurchase("Compra QA", "30.00", 1,
                                LocalDate.now().plusMonths(1),
                                categoryId(other, CategoryKind.EXPENSE),
                                defaultAccountId(user), null))))
                .andExpect(status().isNotFound());

        UUID purchaseId = createPurchase(user, "Compra QA", "30.00", 1,
                LocalDate.now().plusMonths(1), null);

        assertTrue(accountRepository
                .findByIdAndUserId(defaultAccountId(user), user.getId()).isPresent());
        mockMvc.perform(get("/credit-purchases/{id}", purchaseId).cookie(accessCookie(user)))
                .andExpect(status().isOk());
    }

    @Test
    void payGeneratesTransactionAndUpdatesCounters() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("purchase-pay");
        UUID purchaseId = createPurchase(user, "Fone QA", "100.00", 3,
                LocalDate.now().plusMonths(1), null);
        UUID installment = firstInstallmentId(user, purchaseId);

        String pay = mockMvc.perform(post("/installments/{id}/pay", installment)
                        .cookie(accessCookie(user))
                        .header("Idempotency-Key", shortKey("pay")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Parcela paga com sucesso"))
                .andReturn().getResponse().getContentAsString();
        UUID transactionId = uuidAt(pay, "$.transactionId");

        var generated = transactionRepository
                .findByUserIdAndInstallment_CreditPurchase_Id(user.getId(), purchaseId);
        assertEquals(1, generated.size());
        var transaction = generated.get(0);
        assertEquals(0, transaction.getAmount().compareTo(new BigDecimal("33.33")));
        assertEquals(com.fluxa.backend.domain.enums.PaymentMethods.CREDIT,
                transaction.getPaymentMethod());
        assertEquals("Fone QA - parcela 1/3", transaction.getDescription());
        assertEquals(LocalDate.now(), transaction.getOccurredAt());

        mockMvc.perform(get("/credit-purchases/{id}", purchaseId).cookie(accessCookie(user)))
                .andExpect(jsonPath("$.paidCount").value(1))
                .andExpect(jsonPath("$.pendingCount").value(2))
                .andExpect(jsonPath("$.generatedTransactionsCount").value(1));

        mockMvc.perform(get("/installments/list?status=PAID").cookie(accessCookie(user)))
                .andExpect(jsonPath("$.totalElements").value(1));
        mockMvc.perform(get("/installments/list?status=PENDING").cookie(accessCookie(user)))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void repeatedPaymentIsRejectedWithoutCreatingDuplicates() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("purchase-pay-twice");
        UUID purchaseId = createPurchase(user, "Livros QA", "20.00", 2,
                LocalDate.now().plusMonths(1), null);
        UUID installment = firstInstallmentId(user, purchaseId);
        String key = shortKey("dup");

        mockMvc.perform(post("/installments/{id}/pay", installment)
                        .cookie(accessCookie(user)).header("Idempotency-Key", key))
                .andExpect(status().isOk());

        mockMvc.perform(post("/installments/{id}/pay", installment).cookie(accessCookie(user)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));

        mockMvc.perform(post("/installments/{id}/pay", installment)
                        .cookie(accessCookie(user)).header("Idempotency-Key", key))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/credit-purchases/{id}", purchaseId).cookie(accessCookie(user)))
                .andExpect(jsonPath("$.generatedTransactionsCount").value(1));
    }

    @Test
    void oversizedIdempotencyKeyIsRejected() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("purchase-pay-key");
        UUID purchaseId = createPurchase(user, "Camisa QA", "40.00", 1,
                LocalDate.now().plusMonths(1), null);
        UUID installment = firstInstallmentId(user, purchaseId);

        mockMvc.perform(post("/installments/{id}/pay", installment)
                        .cookie(accessCookie(user))
                        .header("Idempotency-Key", "k".repeat(37)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0]").value(
                        "Idempotency-Key inválida (máximo 36 caracteres)"));

        mockMvc.perform(get("/installments/{id}", installment).cookie(accessCookie(user)))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void patchUpdatesPurchaseAndRecategorizesGeneratedTransactions() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("purchase-patch");
        UUID oldCategory = categoryId(user, CategoryKind.EXPENSE);
        com.fluxa.backend.domain.entity.Category newCategory = newExpenseCategory(user, "Streaming QA");
        UUID purchaseId = createPurchase(user, "Video QA", "30.00", 1,
                LocalDate.now().plusMonths(1), null);
        payFirst(user, purchaseId);

        mockMvc.perform(patch("/credit-purchases/{id}", purchaseId).cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new UpdateCreditPurchaseDTO(
                                "Video QA Renomeado", "Loja X", newCategory.getId(), null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Compra atualizada com sucesso"));

        var generated = transactionRepository
                .findByUserIdAndInstallment_CreditPurchase_Id(user.getId(), purchaseId);
        assertEquals(1, generated.size());
        assertEquals(newCategory.getId(), generated.get(0).getCategory().getId());

        mockMvc.perform(get("/credit-purchases/{id}", purchaseId).cookie(accessCookie(user)))
                .andExpect(jsonPath("$.title").value("Video QA Renomeado"))
                .andExpect(jsonPath("$.categoryName").value("Streaming QA"));
    }

    @Test
    void deleteRemovesPurchaseInstallmentsAndGeneratedTransactions() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("purchase-delete");
        UUID purchaseId = createPurchase(user, "Cadeira QA", "60.00", 3,
                LocalDate.now().plusMonths(1), null);
        UUID installment = firstInstallmentId(user, purchaseId);
        payFirst(user, purchaseId);

        mockMvc.perform(delete("/credit-purchases/{id}", purchaseId).cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(
                        "Compra excluída com parcelas e lançamentos gerados"));

        mockMvc.perform(get("/credit-purchases/{id}", purchaseId).cookie(accessCookie(user)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/installments/{id}", installment).cookie(accessCookie(user)))
                .andExpect(status().isNotFound());
        assertEquals(0, transactionRepository
                .findByUserIdAndInstallment_CreditPurchase_Id(user.getId(), purchaseId).size());
    }

    @Test
    void overdueInstallmentsRefreshAndCanBePostponed() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("purchase-overdue");
        UUID purchaseId = createPurchase(user, "Conta QA", "10.00", 1,
                LocalDate.now().minusMonths(1), null);

        mockMvc.perform(get("/credit-purchases/{id}", purchaseId).cookie(accessCookie(user)))
                .andExpect(jsonPath("$.installments[0].status").value("OVERDUE"));

        UUID installment = firstInstallmentId(user, purchaseId);
        mockMvc.perform(patch("/installments/{id}", installment).cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new UpdateInstallmentDTO(null, LocalDate.now().plusDays(5)))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/installments/{id}", installment).cookie(accessCookie(user)))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.number").value(1));
    }

    @Test
    void installmentUpdateRulesAreEnforced() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("installment-update");
        UUID purchaseId = createPurchase(user, "Ensino QA", "300.00", 3,
                LocalDate.now().plusMonths(1), null);
        UUID installment = firstInstallmentId(user, purchaseId);

        mockMvc.perform(patch("/installments/{id}", installment).cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new UpdateInstallmentDTO(null, null))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0]").value(
                        "Nada para atualizar: informe valor e/ou vencimento"));

        mockMvc.perform(patch("/installments/{id}?scope=FOLLOWING", installment)
                        .cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new UpdateInstallmentDTO(new BigDecimal("150.00"), null))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0]").value(
                        "Escopo FOLLOWING aceita apenas mudança de vencimento"));

        mockMvc.perform(patch("/installments/{id}", installment).cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new UpdateInstallmentDTO(new BigDecimal("150.00"), null))))
                .andExpect(status().isOk());

        String details = mockMvc.perform(get("/credit-purchases/{id}", purchaseId)
                        .cookie(accessCookie(user)))
                .andExpect(jsonPath("$.pendingCount").value(3))
                .andReturn().getResponse().getContentAsString();
        assertDecimal(details, "$.totalAmount", "350.00");
        assertDecimal(details, "$.installments[0].amount", "150.00");

        payFirst(user, purchaseId);
        mockMvc.perform(patch("/installments/{id}", installment).cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new UpdateInstallmentDTO(new BigDecimal("10.00"), null))))
                .andExpect(status().isConflict());
    }

    @Test
    void followingShiftMovesAllOpenDueDatesTogether() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("installment-following");
        UUID purchaseId = createPurchase(user, "Turno QA", "90.00", 3,
                LocalDate.now().plusMonths(1), null);
        UUID installment = firstInstallmentId(user, purchaseId);
        LocalDate current = LocalDate.now().plusMonths(1);

        mockMvc.perform(patch("/installments/{id}?scope=FOLLOWING", installment)
                        .cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new UpdateInstallmentDTO(null, current.plusDays(10)))))
                .andExpect(status().isOk());

        String details = mockMvc.perform(get("/credit-purchases/{id}", purchaseId)
                        .cookie(accessCookie(user)))
                .andExpect(jsonPath("$.installments.length()").value(3))
                .andReturn().getResponse().getContentAsString();
        assertDate(details, "$.installments[0].dueDate", current.plusDays(10));
        assertDate(details, "$.installments[2].dueDate", current.plusMonths(2).plusDays(10));
    }

    @Test
    void installmentListFiltersByDateRange() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("installment-range");
        LocalDate firstDue = LocalDate.now().plusMonths(1);
        UUID purchaseId = createPurchase(user, "Curso QA", "90.00", 3, firstDue, null);

        mockMvc.perform(get("/installments/list?start={s}&end={e}",
                        firstDue.minusDays(1), firstDue.plusDays(1)).cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].number").value(1));

        mockMvc.perform(get("/installments/list").cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    void anotherUserCannotUsePurchaseOrInstallments() throws Exception {
        com.fluxa.backend.domain.entity.User owner = registerUser("purchase-owner");
        com.fluxa.backend.domain.entity.User other = registerUser("purchase-other");
        UUID purchaseId = createPurchase(owner, "Privado QA", "30.00", 1,
                LocalDate.now().plusMonths(1), null);
        UUID installment = firstInstallmentId(owner, purchaseId);

        mockMvc.perform(get("/credit-purchases/{id}", purchaseId).cookie(accessCookie(other)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/credit-purchases/list").cookie(accessCookie(other)))
                .andExpect(jsonPath("$.totalElements").value(0));
        mockMvc.perform(get("/installments/{id}", installment).cookie(accessCookie(other)))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/installments/{id}/pay", installment).cookie(accessCookie(other)))
                .andExpect(status().isNotFound());
        mockMvc.perform(patch("/installments/{id}", installment).cookie(accessCookie(other))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new UpdateInstallmentDTO(new BigDecimal("5.00"), null))))
                .andExpect(status().isNotFound());
        mockMvc.perform(patch("/credit-purchases/{id}", purchaseId).cookie(accessCookie(other))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new UpdateCreditPurchaseDTO("Hacker", null, null, null))))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/credit-purchases/{id}", purchaseId).cookie(accessCookie(other)))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/credit-purchases/{id}", purchaseId).cookie(accessCookie(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paidCount").value(0));
    }

    @Test
    void purchaseBlocksAccountDeletion() throws Exception {
        com.fluxa.backend.domain.entity.User user = registerUser("purchase-blocks-account");
        UUID accountId = defaultAccountId(user);
        createPurchase(user, "Compras QA", "30.00", 1,
                LocalDate.now().plusMonths(1), null);

        mockMvc.perform(delete("/accounts/{id}", accountId).cookie(accessCookie(user)))
                .andExpect(status().isConflict());

        assertTrue(accountRepository.findByIdAndUserId(accountId, user.getId()).isPresent());
    }

    private UUID createPurchase(com.fluxa.backend.domain.entity.User user, String title,
                                String total, int qty, LocalDate firstDue,
                                List<CreateCreditPurchaseDTO.ManualInstallmentDTO> manual) throws Exception {
        UUID categoryId = categoryId(user, CategoryKind.EXPENSE);
        String body = mockMvc.perform(post("/credit-purchases/create")
                        .cookie(accessCookie(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(shapedPurchase(title, total, qty, firstDue,
                                categoryId, null, manual))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Compra parcelada criada com sucesso"))
                .andReturn().getResponse().getContentAsString();
        return uuidAt(body, "$.creditPurchaseId");
    }

    /** accountId null (default) plus optional manual installments in one shape. */
    private CreateCreditPurchaseDTO shapedPurchase(String title, String total, int qty,
                                                   LocalDate firstDue, UUID categoryId,
                                                   UUID accountId,
                                                   List<CreateCreditPurchaseDTO.ManualInstallmentDTO> manual) {
        return new CreateCreditPurchaseDTO(title, "Loja", new BigDecimal(total),
                LocalDate.now(), qty, firstDue, categoryId, null, manual, accountId);
    }

    private com.fluxa.backend.domain.entity.Category newExpenseCategory(
            com.fluxa.backend.domain.entity.User user, String name) {
        com.fluxa.backend.domain.entity.Category category = new com.fluxa.backend.domain.entity.Category(
                user, name, CategoryKind.EXPENSE, "Sparkles", "#EF4444", true, null);
        return categoryRepository.save(category);
    }

    private UUID firstInstallmentId(com.fluxa.backend.domain.entity.User user,
                                    UUID purchaseId) throws Exception {
        String details = mockMvc.perform(get("/credit-purchases/{id}", purchaseId)
                        .cookie(accessCookie(user)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return uuidAt(details, "$.installments[0].id");
    }

    private void payFirst(com.fluxa.backend.domain.entity.User user, UUID purchaseId) throws Exception {
        UUID installment = firstInstallmentId(user, purchaseId);
        mockMvc.perform(post("/installments/{id}/pay", installment)
                        .cookie(accessCookie(user)))
                .andExpect(status().isOk());
    }
}
