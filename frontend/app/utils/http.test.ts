import { HttpError, friendlyHttpError, getJson } from "@/app/utils/http";

describe("friendlyHttpError", () => {
    it("mapeia status de cliente", () => {
        expect(friendlyHttpError(400)).toBe(
            "Dados inválidos. Confira os campos e tente de novo."
        );
        expect(friendlyHttpError(401)).toBe("Sessão expirada. Entre novamente.");
        expect(friendlyHttpError(403)).toBe("Você não tem permissão para esta ação.");
        expect(friendlyHttpError(404)).toBe(
            "Registro não encontrado. Ele pode ter sido removido."
        );
        expect(friendlyHttpError(409)).toBe(
            "Conflito: este registro já existe ou está em uso."
        );
        expect(friendlyHttpError(429)).toBe(
            "Muitas tentativas. Aguarde um pouco e tente de novo."
        );
    });

    it("422 usa a mensagem de dados inválidos", () => {
        expect(friendlyHttpError(422)).toBe(
            "Dados inválidos. Confira os campos e tente de novo."
        );
    });

    it("5xx usa mensagem de servidor", () => {
        expect(friendlyHttpError(500)).toBe("Erro no servidor. Tente novamente mais tarde.");
        expect(friendlyHttpError(503)).toBe("Erro no servidor. Tente novamente mais tarde.");
    });

    it("status desconhecido cai no fallback", () => {
        expect(friendlyHttpError(418)).toBe("Algo deu errado. Tente novamente.");
        expect(friendlyHttpError(302, "fallback customizado")).toBe(
            "fallback customizado"
        );
    });
});

describe("HttpError", () => {
    it("carrega status e mensagem", () => {
        const err = new HttpError(409, "dupe");
        expect(err.status).toBe(409);
        expect(err.message).toBe("dupe");
        expect(err instanceof Error).toBe(true);
    });

    it("tem mensagem padrão", () => {
        expect(new HttpError(500).message).toBe("Request failed (500)");
    });
});

describe("getJson", () => {
    it("devolve o JSON convertido quando a resposta é ok", async () => {
        const response = new Response(JSON.stringify({ a: 1 }), { status: 200 });

        await expect(getJson(Promise.resolve(response))).resolves.toEqual({ a: 1 });
    });

    it("lança HttpError com o status quando a resposta falha", async () => {
        const response = new Response("{}", { status: 404 });

        await expect(getJson(Promise.resolve(response))).rejects.toMatchObject({
            status: 404,
        });
    });

    it("propaga o erro da rede", async () => {
        await expect(getJson(Promise.reject(new TypeError("failed"))))
            .rejects.toBeInstanceOf(TypeError);
    });
});
