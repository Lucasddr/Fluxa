export class HttpError extends Error {
  status: number;

  constructor(status: number, message?: string) {
    super(message ?? `Request failed (${status})`);
    this.status = status;
  }
}

export function friendlyHttpError(
  status: number,
  fallback = "Algo deu errado. Tente novamente."
): string {
  switch (status) {
    case 400:
      return "Dados inválidos. Confira os campos e tente de novo.";
    case 401:
      return "Sessão expirada. Entre novamente.";
    case 403:
      return "Você não tem permissão para esta ação.";
    case 404:
      return "Registro não encontrado. Ele pode ter sido removido.";
    case 409:
      return "Conflito: este registro já existe ou está em uso.";
    case 422:
      return "Dados inválidos. Confira os campos e tente de novo.";
    case 429:
      return "Muitas tentativas. Aguarde um pouco e tente de novo.";
    default:
      if (status >= 500) {
        return "Erro no servidor. Tente novamente mais tarde.";
      }
      return fallback;
  }
}
