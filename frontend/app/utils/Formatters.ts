export function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

export function formatPaymentMethod(
    method: string
    ) {

    switch (method) {

        case "PIX":
        return "Pix";

        case "CREDIT":
        return "Cartão de Crédito";

        case "DEBIT":
        return "Cartão de Débito";

        case "CASH":
        return "Dinheiro";

        default:
        return "Outro";
    }
}