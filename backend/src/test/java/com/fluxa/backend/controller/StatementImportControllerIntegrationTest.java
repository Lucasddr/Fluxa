package com.fluxa.backend.controller;

import com.fluxa.backend.domain.entity.Category;
import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.domain.enums.CategoryKind;
import com.fluxa.backend.dto.request.RegisterDTO;
import com.fluxa.backend.repository.AccountRepository;
import com.fluxa.backend.repository.CategoryRepository;
import com.fluxa.backend.repository.StatementImportCategoryRuleRepository;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class StatementImportControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private AuthService authService;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private AccountRepository accountRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private StatementImportCategoryRuleRepository categoryRuleRepository;
    @Autowired private JwtService jwtService;

    private User owner;
    private UUID accountId;
    private UUID expenseCategoryId;
    private UUID incomeCategoryId;

    @BeforeEach
    void setUp() {
        owner = registerUser();
        accountId = accountRepository.findDefaultForUser(owner.getId()).orElseThrow().getId();
        List<Category> categories = categoryRepository
                .findCategoryByUserId(owner.getId(), PageRequest.of(0, 50)).getContent();
        expenseCategoryId = categories.stream().filter(category -> category.getKind() == CategoryKind.EXPENSE)
                .findFirst().orElseThrow().getId();
        incomeCategoryId = categories.stream().filter(category -> category.getKind() == CategoryKind.INCOME)
                .findFirst().orElseThrow().getId();
    }

    @Test
    void missingNullAndFalseRememberRuleAreSafeOptOuts() throws Exception {
        assertImportDoesNotSaveRule("absent", null, 0);
        assertImportDoesNotSaveRule("null", "null", 0);
        assertImportDoesNotSaveRule("false", "false", 0);
    }

    @Test
    void trueRememberRuleSavesOnlyAfterSuccessfulImport() throws Exception {
        mockMvc.perform(importRequest("remember-true", "true"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.importedCount").value(1))
                .andExpect(jsonPath("$.categoryRulesSaved").value(1));

        assertEquals(1, transactionRepository.findByUserId(owner.getId(), PageRequest.of(0, 10))
                .getTotalElements());
        assertEquals(1, categoryRuleRepository.findAllForAccount(accountId, owner.getId()).size());
    }

    @Test
    void emptySelectionAndMissingRequiredImportFieldsReturnBadRequestWithoutSideEffects() throws Exception {
        mockMvc.perform(post(importPath()).cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"transactions\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        mockMvc.perform(post(importPath()).cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"transactions\":[{\"sourceReference\":\"missing\"}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        assertTrue(transactionRepository.findByUserId(owner.getId(), PageRequest.of(0, 10)).isEmpty());
        assertTrue(categoryRuleRepository.findAllForAccount(accountId, owner.getId()).isEmpty());
    }

    @Test
    void categoryKindMismatchReturnsBadRequestWithoutPersistingImport() throws Exception {
        mockMvc.perform(post(importPath()).cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(importPayload("wrong-kind", incomeCategoryId, "false")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        assertTrue(transactionRepository.findByUserId(owner.getId(), PageRequest.of(0, 10)).isEmpty());
    }

    @Test
    void categoryOwnedByAnotherUserReturnsNotFoundWithoutPersistingImport() throws Exception {
        User other = registerUser();
        UUID foreignCategoryId = categoryRepository
                .findCategoryByUserId(other.getId(), PageRequest.of(0, 50)).getContent().stream()
                .filter(category -> category.getKind() == CategoryKind.EXPENSE)
                .findFirst().orElseThrow().getId();

        mockMvc.perform(post(importPath()).cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(importPayload("foreign-category", foreignCategoryId, "false")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));

        assertTrue(transactionRepository.findByUserId(owner.getId(), PageRequest.of(0, 10)).isEmpty());
    }

    @Test
    void previewRequiresAuthenticationAndRejectsEmptyFileAsBadRequest() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "empty.csv", "text/csv", new byte[0]);
        mockMvc.perform(multipart(previewPath()).file(file))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(multipart(previewPath()).file(file).cookie(accessCookie(owner)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void previewRejectsMalformedCsvAndUnsupportedFileWithoutSideEffects() throws Exception {
        MockMultipartFile malformed = new MockMultipartFile(
                "file", "statement.csv", "text/csv",
                "date,description,amount\n2026-10-20,Shop,not-money\n"
                        .getBytes(java.nio.charset.StandardCharsets.UTF_8));
        mockMvc.perform(multipart(previewPath()).file(malformed).cookie(accessCookie(owner)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        MockMultipartFile unsupported = new MockMultipartFile(
                "file", "statement.xlsx", "application/octet-stream", "test".getBytes());
        mockMvc.perform(multipart(previewPath()).file(unsupported).cookie(accessCookie(owner)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        assertTrue(transactionRepository.findByUserId(owner.getId(), PageRequest.of(0, 10)).isEmpty());
    }

    @Test
    void previewRejectsFileAboveConfiguredFiveMegabyteLimit() throws Exception {
        byte[] oversizedContent = new byte[5 * 1024 * 1024 + 1];
        MockMultipartFile oversized = new MockMultipartFile(
                "file", "statement.csv", "text/csv", oversizedContent);

        mockMvc.perform(multipart(previewPath()).file(oversized).cookie(accessCookie(owner)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        assertTrue(transactionRepository.findByUserId(owner.getId(), PageRequest.of(0, 10)).isEmpty());
    }

    @Test
    void importRejectsMoreThanFiveThousandRowsBeforePersistingAnything() throws Exception {
        StringBuilder payload = new StringBuilder("{\"transactions\":[");
        for (int index = 0; index < 5_001; index++) {
            if (index > 0) payload.append(',');
            payload.append("{\"sourceReference\":\"row-").append(index)
                    .append("\",\"occurredAt\":\"").append(LocalDate.now().minusDays(1))
                    .append("\",\"signedAmount\":-1.00,\"description\":\"Item ")
                    .append(index).append("\",\"categoryId\":\"").append(expenseCategoryId)
                    .append("\",\"rememberCategoryRule\":false}");
        }
        payload.append("]}");

        mockMvc.perform(post(importPath()).cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        assertTrue(transactionRepository.findByUserId(owner.getId(), PageRequest.of(0, 10)).isEmpty());
    }

    @Test
    void previewCannotAccessAccountOwnedByAnotherUser() throws Exception {
        User other = registerUser();
        UUID foreignAccountId = accountRepository.findDefaultForUser(other.getId()).orElseThrow().getId();
        MockMultipartFile file = new MockMultipartFile(
                "file", "statement.csv", "text/csv", "date,description,amount\n2026-10-20,Shop,-1.00\n"
                        .getBytes(java.nio.charset.StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/accounts/{accountId}/statement-imports/preview", foreignAccountId)
                        .file(file)
                        .cookie(accessCookie(owner)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    private void assertImportDoesNotSaveRule(String reference, String rememberValue, int expectedRules)
            throws Exception {
        mockMvc.perform(post(importPath()).cookie(accessCookie(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(importPayload(reference, expenseCategoryId, rememberValue)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.importedCount").value(1))
                .andExpect(jsonPath("$.categoryRulesSaved").value(expectedRules));

        assertEquals(expectedRules, categoryRuleRepository.findAllForAccount(accountId, owner.getId()).size());
    }

    private String importPayload(String reference, UUID categoryId, String rememberValue) {
        String optionalRemember = rememberValue == null
                ? ""
                : ",\"rememberCategoryRule\":" + rememberValue;
        return "{\"transactions\":[{\"sourceReference\":\"" + reference
                + "\",\"occurredAt\":\"" + LocalDate.now().minusDays(1)
                + "\",\"signedAmount\":-42.90,\"description\":\"Farmácia QA\",\"categoryId\":\""
                + categoryId + "\"" + optionalRemember + "}]}";
    }

    private String importPath() {
        return "/accounts/" + accountId + "/statement-imports";
    }

    private String previewPath() {
        return "/accounts/" + accountId + "/statement-imports/preview";
    }

    private User registerUser() {
        String email = "import-controller-" + UUID.randomUUID() + "@test.local";
        authService.register(new RegisterDTO("Import Controller QA", email, "Teste1234"));
        return userRepository.findByEmail(email).orElseThrow();
    }

    private Cookie accessCookie(User user) {
        return new Cookie("access_token", jwtService.generateJwt(user));
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder importRequest(
            String reference, String rememberValue) {
        return post(importPath()).cookie(accessCookie(owner))
                .contentType(MediaType.APPLICATION_JSON)
                .content(importPayload(reference, expenseCategoryId, rememberValue));
    }
}
