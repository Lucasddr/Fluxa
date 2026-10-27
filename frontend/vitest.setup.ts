// Definida ANTES de qualquer import de testes: services/api.ts lança
// em tempo de módulo se NEXT_PUBLIC_API_URL não existir.
process.env.NEXT_PUBLIC_API_URL = "http://localhost:8080/api";

import "@testing-library/jest-dom/vitest";
