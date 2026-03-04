# Fluxa --- Documento de Requisitos

## 1. Visão Geral

O Fluxa é um sistema de controle financeiro pessoal com foco em fornecer
ao usuário uma visão clara do seu saldo disponível real, considerando
não apenas o dinheiro atual, mas também obrigações futuras já assumidas,
como compras parceladas no crédito.

Seu principal diferencial é evitar a falsa percepção de saldo causada
pela desconsideração de compromissos futuros.

------------------------------------------------------------------------

## 2. Objetivos do Sistema

### 2.1 Objetivo Principal

Permitir ao usuário:

-   Registrar receitas e despesas.
-   Registrar compras parceladas no crédito.
-   Visualizar seu saldo disponível real.
-   Tomar decisões financeiras com base em dados reais, não estimativas
    incorretas.

------------------------------------------------------------------------

## 3. Conceitos Fundamentais

### 3.1 Saldo Real

Valor total que o usuário possui no momento atual, considerando:

-   Entradas registradas.
-   Saídas registradas.

------------------------------------------------------------------------

### 3.2 Saldo Comprometido

Valor total de obrigações futuras já assumidas, incluindo:

-   Parcelas futuras de compras no crédito.
-   Outras obrigações registradas com data futura.

------------------------------------------------------------------------

### 3.3 Saldo Disponível

Valor que o usuário pode gastar com segurança.

Calculado com base em:

Saldo Disponível = Saldo Real − Saldo Comprometido

Este é o principal indicador do sistema.

------------------------------------------------------------------------

## 4. Funcionalidades do Sistema

## 4.1 Autenticação

O sistema deve permitir:

-   Cadastro com:
    -   Email
    -   Senha
-   Login com:
    -   Email
    -   Senha

Login com Google será implementado futuramente.

------------------------------------------------------------------------

## 4.2 Dashboard (Tela Inicial)

A tela inicial deve exibir:

### Informação principal

-   Saldo Disponível (destaque principal)

### Informações secundárias

-   Saldo Real
-   Saldo Comprometido

### Elementos visuais

-   Gráfico financeiro
-   Lista das transações recentes

### Ações

-   Botão para adicionar nova transação

------------------------------------------------------------------------

## 4.3 Registro de Transações

O sistema deve permitir registrar:

### Receitas

Exemplo:

-   Salário
-   Pix recebido

------------------------------------------------------------------------

### Despesas

Exemplo:

-   Mercado
-   Aluguel
-   Contas

------------------------------------------------------------------------

Cada transação deve conter:

-   Valor
-   Descrição
-   Categoria
-   Data

------------------------------------------------------------------------

## 4.4 Compras no Crédito Parceladas

O sistema deve permitir registrar:

-   Valor total
-   Número de parcelas
-   Data de início

O sistema deve automaticamente:

-   Gerar parcelas futuras
-   Distribuir corretamente o impacto financeiro

Estas parcelas devem afetar o saldo comprometido.

------------------------------------------------------------------------

## 4.5 Visualização de Transações

O sistema deve possuir uma tela dedicada contendo:

-   Lista de transações
-   Histórico completo

------------------------------------------------------------------------

## 5. Funcionalidades Futuras

Estas funcionalidades não fazem parte do MVP, mas fazem parte do
roadmap:

### 5.1 Login com Google

Permitir autenticação via conta Google.

------------------------------------------------------------------------

### 5.2 Simulação Financeira

Permitir ao usuário:

-   Simular compras
-   Ver impacto no saldo disponível antes de realizar a compra

------------------------------------------------------------------------

### 5.3 Exportação de Dados

Permitir exportar:

-   Relatórios
-   Histórico financeiro

------------------------------------------------------------------------

## 6. Requisitos Não Funcionais

### 6.1 Segurança

-   Senhas devem ser armazenadas com hash.
-   Comunicação deve ser segura.

------------------------------------------------------------------------

### 6.2 Performance

O sistema deve responder rapidamente às consultas de saldo e transações.

------------------------------------------------------------------------

### 6.3 Usabilidade

O sistema deve ser:

-   Simples
-   Intuitivo
-   Fácil de usar

------------------------------------------------------------------------

## 7. Stack Tecnológica

Frontend:

-   Next.js
-   React
-   TailwindCSS

Backend:

-   Spring Boot

Banco de Dados:

-   PostgreSQL

Autenticação:

-   JWT

------------------------------------------------------------------------

## 8. Objetivo do MVP

O MVP deve permitir:

-   Cadastro de usuário
-   Login
-   Registro de receitas
-   Registro de despesas
-   Registro de compras parceladas
-   Visualização de saldo disponível
-   Visualização de histórico

------------------------------------------------------------------------

## 9. Diferencial do Produto

O Fluxa resolve o principal problema dos controles financeiros
tradicionais:

Evitar que o usuário acredite ter mais dinheiro disponível do que
realmente possui.

Isso é feito através do cálculo correto das obrigações futuras.

------------------------------------------------------------------------

Fim do Documento
