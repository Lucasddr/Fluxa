// Tipos de resposta compartilhados entre serviços e páginas.

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};
