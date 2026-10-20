package com.fluxa.backend.exception;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GlobalExceptionHandlerInputErrorsTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void malformedJsonReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .header("Content-Type", "application/json")
                        .content("{\"email\": not valid json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0]").value("Corpo da requisição inválido ou JSON malformado."));
    }

    @Test
    void missingRequiredParameterReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/auth/verify-email"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0]").value("Parâmetro obrigatório ausente: token."));
    }

    @Test
    void unsupportedMethodReturns405() throws Exception {
        mockMvc.perform(post("/auth/verify-email?token=x"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.errors[0]").value("Método não suportado para esta rota."));
    }

    @Test
    void authContentTypeWithoutBodyCharsetVariants() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .header("Content-Type", "text/plain")
                        .content("email=test@test.test"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.errors[0]").value("Content-Type não suportado."));
    }

    @Test
    void test500EndpointIsRemoved() throws Exception {
        mockMvc.perform(get("/auth/test-500"))
                .andExpect(status().isNotFound());
    }
}
