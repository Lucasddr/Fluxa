package com.fluxa.backend.controller;

import com.fluxa.backend.domain.entity.Category;
import com.fluxa.backend.domain.entity.Transaction;
import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.domain.enums.CategoryKind;
import com.fluxa.backend.domain.enums.PaymentMethods;
import com.fluxa.backend.dto.request.RegisterDTO;
import com.fluxa.backend.dto.request.create.CreateTransactionDTO;
import com.fluxa.backend.dto.request.update.UpdateTransactionDTO;
import com.fluxa.backend.repository.AccountRepository;
import com.fluxa.backend.repository.CategoryRepository;
import com.fluxa.backend.repository.TransactionRepository;
import com.fluxa.backend.repository.UserRepository;
import com.fluxa.backend.security.JwtService;
import com.fluxa.backend.service.AuthService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import tools.jackson.databind.ObjectMapper;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
class TransactionCategoryControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private AuthService authService;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private AccountRepository accountRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private JwtService jwtService;
    @Autowired private ObjectMapper objectMapper;

    private User owner;
    private UUID accountId;
    private UUID expenseCategoryId;

    @BeforeEach
    void setUp() {
        owner = registerUser();
        accountId = accountRepository.findDefaultForUser(owner.getId()).orElseThrow().getId();
        expenseCategoryId = categoriesFor(owner).stream()
                .filter(category -> category.getKind() == CategoryKind.EXPENSE)
                .findFirst()
                .orElseThrow()
                .getId();
    }

    @Test
    void transactionHttpLifecyclePersistsAndDeletesOwnedTransaction() throws Exception {
        mockMvc.perform(post("/transactions/create")
                        .cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(transaction(expenseCategoryId, accountId, "Aluguel", "25.90"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("transaction created"));

        Transaction saved = transactionsFor(owner).get(0);
        mockMvc.perform(get("/transactions/{id}", saved.getId()).cookie(accessCookie(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Aluguel"));

        UpdateTransactionDTO update = new UpdateTransactionDTO(
                expenseCategoryId, new BigDecimal("30.00"), "Aluguel atualizado",
                LocalDate.now(), null, PaymentMethods.DEBIT, false);
        mockMvc.perform(patch("/transactions/{id}", saved.getId())
                        .cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(update)))
                .andExpect(status().isOk());
        assertEquals(new BigDecimal("30.00"), transactionRepository
                .findByIdAndUserId(saved.getId(), owner.getId()).orElseThrow().getAmount());

        mockMvc.perform(delete("/transactions/{id}", saved.getId()).cookie(accessCookie(owner)))
                .andExpect(status().isOk());
        assertTrue(transactionRepository.findByIdAndUserId(saved.getId(), owner.getId()).isEmpty());
    }

    @Test
    void unauthenticatedTransactionRequestIsRejected() throws Exception {
        mockMvc.perform(get("/transactions/list"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void invalidTransactionDtoReturnsBadRequestWithoutPersisting() throws Exception {
        mockMvc.perform(post("/transactions/create")
                        .cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(transaction(expenseCategoryId, accountId, "Valor inválido", "0.00"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        assertTrue(transactionsFor(owner).isEmpty());
    }

    @Test
    void malformedTransactionIdReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/transactions/not-a-uuid").cookie(accessCookie(owner)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void transactionIdempotencyKeyPreventsDuplicatePersistedTransactions() throws Exception {
        String body = json(transaction(expenseCategoryId, accountId, "Pagamento idempotente", "42.00"));

        mockMvc.perform(post("/transactions/create")
                        .cookie(accessCookie(owner))
                        .header("Idempotency-Key", "qa-idempotency-transaction")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/transactions/create")
                        .cookie(accessCookie(owner))
                        .header("Idempotency-Key", "qa-idempotency-transaction")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("duplicate transaction ignored"));

        assertEquals(1, transactionsFor(owner).size());
    }

    @Test
    void foreignCategoryOnTransactionCreateReturnsNotFoundWithoutPersisting() throws Exception {
        User other = registerUser();
        UUID foreignCategoryId = categoriesFor(other).stream()
                .filter(category -> category.getKind() == CategoryKind.EXPENSE)
                .findFirst()
                .orElseThrow()
                .getId();

        mockMvc.perform(post("/transactions/create")
                        .cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(transaction(foreignCategoryId, accountId, "Categoria alheia", "10.00"))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));

        assertTrue(transactionsFor(owner).isEmpty());
    }

    @Test
    void ownerCannotReadUpdateOrDeleteAnotherUsersTransaction() throws Exception {
        User other = registerUser();
        UUID otherAccount = accountRepository.findDefaultForUser(other.getId()).orElseThrow().getId();
        UUID otherCategory = categoriesFor(other).stream()
                .filter(category -> category.getKind() == CategoryKind.EXPENSE)
                .findFirst().orElseThrow().getId();
        mockMvc.perform(post("/transactions/create")
                        .cookie(accessCookie(other))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(transaction(otherCategory, otherAccount, "Privada", "75.00"))))
                .andExpect(status().isCreated());
        Transaction otherTransaction = transactionsFor(other).get(0);

        mockMvc.perform(get("/transactions/list").cookie(accessCookie(owner)))
                .andExpect(status().isOk())
                .andExpect(result -> assertFalse(result.getResponse().getContentAsString()
                        .contains(otherTransaction.getId().toString())));
        mockMvc.perform(get("/transactions/{id}", otherTransaction.getId()).cookie(accessCookie(owner)))
                .andExpect(status().isNotFound());
        UpdateTransactionDTO update = new UpdateTransactionDTO(
                expenseCategoryId, new BigDecimal("1.00"), "Tentativa alheia",
                LocalDate.now(), null, PaymentMethods.DEBIT, false);
        mockMvc.perform(patch("/transactions/{id}", otherTransaction.getId())
                        .cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(update)))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/transactions/{id}", otherTransaction.getId()).cookie(accessCookie(owner)))
                .andExpect(status().isNotFound());

        Transaction unchanged = transactionRepository
                .findByIdAndUserId(otherTransaction.getId(), other.getId()).orElseThrow();
        assertEquals("Privada", unchanged.getDescription());
        assertEquals(new BigDecimal("75.00"), unchanged.getAmount());
    }

    @Test
    void categoryHttpCrudAndDeleteConflictRespectBusinessRules() throws Exception {
        String createBody = """
                {"name":"QA Temporária","kind":"EXPENSE","icon":"Receipt","description":"Teste QA","color":"#123456","status":true}
                """;
        mockMvc.perform(post("/categories/create")
                        .cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated());
        Category category = categoriesFor(owner).stream()
                .filter(item -> item.getName().equals("QA Temporária"))
                .findFirst().orElseThrow();

        mockMvc.perform(get("/categories").cookie(accessCookie(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.id == '%s')]".formatted(category.getId())).exists());

        mockMvc.perform(patch("/categories/{id}", category.getId())
                        .cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"QA Editada","icon":"Receipt","description":"Atualizada","color":"#654321","status":true}
                                """))
                .andExpect(status().isOk());
        assertEquals("QA Editada", categoryRepository.findByIdAndUserId(category.getId(), owner.getId())
                .orElseThrow().getName());

        mockMvc.perform(post("/transactions/create")
                        .cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(transaction(category.getId(), accountId, "Vínculo", "18.00"))))
                .andExpect(status().isCreated());
        mockMvc.perform(delete("/categories/{id}", category.getId()).cookie(accessCookie(owner)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
        assertTrue(categoryRepository.findByIdAndUserId(category.getId(), owner.getId()).isPresent());
    }

    @Test
    void inactiveCategoryIsHiddenAndCannotBeUsedForNewTransactionUntilReactivated() throws Exception {
        mockMvc.perform(post("/categories/create")
                        .cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"QA Inativa","kind":"EXPENSE","icon":"Receipt","description":"Teste","color":"#123456","status":true}
                                """))
                .andExpect(status().isCreated());
        Category category = categoriesFor(owner).stream()
                .filter(item -> item.getName().equals("QA Inativa"))
                .findFirst().orElseThrow();

        mockMvc.perform(post("/transactions/create")
                        .cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(transaction(category.getId(), accountId, "Histórico preservado", "8.00"))))
                .andExpect(status().isCreated());

        mockMvc.perform(patch("/categories/{id}", category.getId())
                        .cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"QA Inativa","icon":"Receipt","description":"Teste","color":"#123456","status":false}
                                """))
                .andExpect(status().isOk());
        mockMvc.perform(get("/categories/select").cookie(accessCookie(owner)))
                .andExpect(status().isOk())
                .andExpect(result -> assertFalse(result.getResponse().getContentAsString()
                        .contains(category.getId().toString())));
        mockMvc.perform(post("/transactions/create")
                        .cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(transaction(category.getId(), accountId, "Tentativa inativa", "12.00"))))
                .andExpect(status().isBadRequest());
        assertEquals(1, transactionsFor(owner).size());

        mockMvc.perform(patch("/categories/{id}", category.getId())
                        .cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"QA Inativa","icon":"Receipt","description":"Teste","color":"#123456","status":true}
                                """))
                .andExpect(status().isOk());
        mockMvc.perform(get("/categories/select").cookie(accessCookie(owner)))
                .andExpect(status().isOk())
                .andExpect(result -> assertTrue(result.getResponse().getContentAsString()
                        .contains(category.getId().toString())));
        mockMvc.perform(post("/transactions/create")
                        .cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(transaction(category.getId(), accountId, "Categoria reativada", "12.00"))))
                .andExpect(status().isCreated());
        assertEquals(2, transactionsFor(owner).size());
    }

    @Test
    void unusedCategoryCanBeDeletedAndForeignCategoryCannotBeChangedOrDeleted() throws Exception {
        mockMvc.perform(post("/categories/create")
                        .cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"QA Excluir","kind":"EXPENSE","icon":"Receipt","description":"Teste","color":"#123456","status":true}
                                """))
                .andExpect(status().isCreated());
        Category deletable = categoriesFor(owner).stream()
                .filter(item -> item.getName().equals("QA Excluir"))
                .findFirst().orElseThrow();
        mockMvc.perform(delete("/categories/{id}", deletable.getId()).cookie(accessCookie(owner)))
                .andExpect(status().isAccepted());
        assertTrue(categoryRepository.findByIdAndUserId(deletable.getId(), owner.getId()).isEmpty());

        User other = registerUser();
        Category otherCategory = categoriesFor(other).stream()
                .filter(item -> item.getKind() == CategoryKind.EXPENSE)
                .findFirst().orElseThrow();
        mockMvc.perform(patch("/categories/{id}", otherCategory.getId())
                        .cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Alterada","icon":"Receipt","description":"Teste","color":"#123456","status":false}
                                """))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/categories/{id}", otherCategory.getId()).cookie(accessCookie(owner)))
                .andExpect(status().isNotFound());
        assertTrue(categoryRepository.findByIdAndUserId(otherCategory.getId(), other.getId()).isPresent());
    }

    @Test
    void invalidCategoryCreateReturnsBadRequestWithoutCreatingCategory() throws Exception {
        int initialCount = categoriesFor(owner).size();
        mockMvc.perform(post("/categories/create")
                        .cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":" ","kind":"EXPENSE","icon":"Receipt","description":"Teste","color":"#123456","status":true}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
        assertEquals(initialCount, categoriesFor(owner).size());
    }

    private User registerUser() {
        String email = "controller-" + UUID.randomUUID() + "@test.local";
        authService.register(new RegisterDTO("Controller QA", email, "Teste1234"));
        return userRepository.findByEmail(email).orElseThrow();
    }

    private Cookie accessCookie(User user) {
        return new Cookie("access_token", jwtService.generateJwt(user));
    }

    private java.util.List<Category> categoriesFor(User user) {
        return categoryRepository.findCategoryByUserId(user.getId(), PageRequest.of(0, 50)).getContent();
    }

    private java.util.List<Transaction> transactionsFor(User user) {
        return transactionRepository.findByUserId(user.getId(), PageRequest.of(0, 50)).getContent();
    }

    private CreateTransactionDTO transaction(UUID categoryId, UUID accountId, String description, String amount) {
        return new CreateTransactionDTO(categoryId, new BigDecimal(amount), description,
                LocalDate.now(), null, PaymentMethods.DEBIT, false, accountId);
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
