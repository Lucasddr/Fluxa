# Avaliação e plano de melhoria de UI/UX

**Data:** 17/10/2026  
**Escopo:** avaliação do frontend Opsire/Fluxa, achados priorizados e acompanhamento da implementação solicitada.

## Estado da implementação

**Implementado em 17/10/2026:** contraste de `--ink-3` nos dois temas; sequência de títulos e estado sem dados do gráfico; área rolável acima da navegação mobile; remoção dos filtros inertes de Categorias; Configurações limitadas à troca de tema e ao fluxo existente de redefinição de senha; filtros de Transações extraídos para componente, recolhidos por padrão em telas estreitas e com indicação de filtros ativos; e paginação compartilhada para transações, categorias e compras parceladas. A landing também recebeu hierarquia editorial mais específica, sem dados financeiros fictícios.

**Validação:** `npm --prefix frontend run lint`, `npm --prefix frontend run build` e `git diff --check` passaram. Contraste calculado para `--ink-3`: tema claro **4,68:1** sobre `--paper` e **5,10:1** sobre `--surface`; tema escuro **6,32:1** sobre `--paper` e **5,73:1** sobre `--surface`. axe encontrou zero violações na landing em ambos os temas. A captura desktop foi revisada e, em viewport de 390px, a largura do documento permaneceu em 390px. axe nas rotas autenticadas, caminhada manual por teclado e teste com leitor de tela permanecem pendentes.

## Direção mantida

- Preservar a identidade **Quiet Ledger**: grafite e neutros, acentos semânticos contidos, tipografia Geist e ícones Lucide.
- Preservar regras de negócio, contratos da API, autenticação e fluxos que já funcionam.
- Priorizar legibilidade, confiança financeira, estados reais e uso confortável em telas pequenas.
- Não acrescentar dependências nem redesenhar páginas inteiras sem evidência de necessidade.

## Primeira impressão

- Em poucos segundos, landing e dashboard comunicam gestão financeira pessoal; a navegação e as ações principais são reconhecíveis.
- A direção neutra e os componentes compartilhados já dão uma base visual coerente. O desktop tem bastante espaço e as telas de listas se adaptam para itens empilhados no mobile.
- A hierarquia do dashboard fica menos clara quando não há dados: há valores e percentuais zerados, sem uma explicação suficiente sobre como iniciar e sobre o que o gráfico representa nesse estado.
- As telas de Categorias e Configurações exibem controles que não concluem uma ação real. Isso reduz a confiança mais do que a falta dessas funções.
- Em 390px, os controles de paginação das listas ficam próximos/por baixo da barra fixa inferior; é necessário garantir espaço de rolagem dentro do conteúdo principal.
- A marca parece encoberta por um círculo “N” nas capturas feitas em desenvolvimento. O DOM contém o texto `Fluxa` e o elemento está associado ao portal das ferramentas do Next.js; tratar como indicador de desenvolvimento, não como defeito confirmado do logo.

## Evidências e limitações

- Inspeção visual de landing, login, dashboard, transações, categorias, contas e configurações em capturas de **1440×900** e **390×844**.
- Auditoria axe em rotas públicas e autenticadas. Foi detectado contraste insuficiente de **2,31:1** para texto `#A3A3A3` sobre `#F5F5F5` e **2,52:1** sobre superfícies brancas; o esperado para texto pequeno é **4,5:1** (WCAG 2.2 AA, 1.4.3).
- axe também detectou ordem de títulos inválida no dashboard: o subtítulo “Distribuição” é `h3` sem nível anterior correspondente (`frontend/app/components/GraficoDonut.tsx`).
- A inspeção não encontrou overflow horizontal a 390px. A medição automatizada da altura da BottomNav não foi conclusiva porque havia mais de um `nav[aria-label="Principal"]`; confirmar a reserva de espaço visualmente e com um seletor inequívoco.
- Não foi feita caminhada completa por teclado nem teste com leitor de tela. A verificação axe não substitui esses testes.

## Achados priorizados

### P0 — Acessibilidade: contraste de textos auxiliares

**Onde:** `frontend/app/globals.css`, token `--ink-3`, aplicado em metadados, contagens, descrições, estados vazios e labels da navegação.  
**Problema:** contraste medido de 2,31:1 no fundo principal e 2,52:1 em superfícies claras; falha WCAG para texto normal em várias rotas.  
**Plano:** escurecer o token no tema claro e ajustar separadamente o valor do tema escuro; medir sobre `--paper` e `--surface` nos dois temas antes de aceitar. Preservar `--ink-3` como nível terciário, mas não como texto ilegível.

### P1 — Mobile: área rolável sob navegação fixa

**Onde:** `frontend/app/home/layout.tsx` e `frontend/app/components/navigation/BottomNav.tsx`.  
**Problema:** a barra fixa pode cobrir o fim de tabelas/listas e seus controles em viewport pequeno; a classe `safe-area-pb` não está definida no CSS/Tailwind observado.  
**Plano:** reservar no próprio `<main>` o espaço correspondente à altura real da barra mais `env(safe-area-inset-bottom)`; aplicar o inset diretamente à BottomNav. Revalidar o último item, paginação e diálogos em 390px e em aparelho com safe area.

### P1 — Categorias: affordances sem ação

**Onde:** `frontend/app/home/categories/page.tsx`, bloco “filtros”; `frontend/services/categories.ts`.  
**Problema:** a busca não está ligada a estado, o seletor tem `onChange` vazio e o botão “Filtros” não abre nem altera filtros. A API de listagem atual recebe apenas página e tamanho.  
**Plano:** remover temporariamente controles inertes e manter a paginação funcional; se a busca/filtro for requisito, definir primeiro se o escopo será local ou se exige suporte de consulta no backend, evitando apresentar resultados parciais como se fossem globais.

### P1 — Configurações: estado e ações enganosos

**Onde:** `frontend/app/home/configurations/page.tsx`.  
**Problema:** toggles de notificação só alteram estado React e se perdem; a página afirma que preferências são salvas localmente. “Salvar preferências” e “Cancelar” ficam desabilitados; “Alterar senha” e “Exportar meus dados” são botões sem ação.  
**Plano:** manter o seletor de tema, que é funcional; ligar a recuperação de senha ao fluxo existente; ocultar exportação até existir suporte; remover ações de salvar/cancelar se a configuração for imediata. Para notificações, só expor controles quando houver comportamento real e persistência definida (local ou API), com texto que explique o alcance.

### P1 — Dashboard: estrutura de títulos e estado sem dados

**Onde:** `frontend/app/components/GraficoDonut.tsx` e `frontend/app/home/dashboard/page.tsx`.  
**Problema:** o título “Distribuição” aparece como `h3` sem nível anterior e axe acusa ordem inválida. Com valores zerados, fatias/percentuais não comunicam distribuição útil.  
**Plano:** corrigir o nível semântico do título conforme a estrutura da página; quando não houver valores, mostrar um estado vazio explícito no gráfico e explicar como registrar a primeira transação, sem sugerir porcentagens significativas. Testar zero, valores parciais e dados mistos.

### P2 — Hierarquia visual e densidade

**Onde:** landing (`frontend/app/page.tsx`), dashboard e filtros de transações.  
**Problema:** a landing tem muito espaço vazio e uma proposta de valor genérica; os filtros de transações ocupam várias linhas no mobile. Não há overflow, mas o conteúdo principal pode ganhar prioridade visual e os filtros podem consumir menos altura.  
**Plano:** ajustar conteúdo e espaçamento apenas depois das correções P0/P1; compactar filtros mobile sem esconder controles, usando uma divulgação explícita e acessível caso se recolham. Não adicionar cards ou decoração apenas para preencher espaço.

### P2 — Arquitetura dos componentes

**Onde:** `frontend/app/home/accounts/page.tsx`, `transactions/page.tsx` e `categories/page.tsx`.  
**Problema:** páginas extensas concentram carregamento, estado, diálogos e renderização de listas. Isso aumenta o custo de revisão e torna estados de erro/vazio mais fáceis de divergir.  
**Plano:** após consolidar comportamentos, extrair componentes/hooks pequenos para filtros, paginação e itens de lista; manter contratos e fluxos existentes e evitar refactor estrutural simultâneo às correções de UX.

## Plano de ação recomendado

1. **Acessibilidade primeiro:** corrigir contraste do token em claro/escuro e hierarquia dos títulos; obter zero violações axe para essas regras.
2. **Mobile e navegação:** reservar espaço da BottomNav no scroll container; validar final de página, safe area, foco visível e toque em 390px.
3. **Ações honestas:** decidir o tratamento dos controles de Categorias e Configurações; remover affordances sem operação ou especificar e implementar seu comportamento numa tarefa própria.
4. **Estados financeiros:** desenhar zero dados, vazio por filtro, carregamento, falha recuperável e sucesso do dashboard/listas; evitar números ou gráficos sem interpretação útil.
5. **Refinamento visual:** revisar hierarquia da landing, densidade dos filtros e consistência de títulos, preservando a direção Quiet Ledger.
6. **Arquitetura incremental:** extrair componentes só quando os comportamentos estiverem estabilizados.
7. **Validação antes de aprovar:** lint/build, axe em tema claro/escuro, teste manual por teclado e screenshots em 1440×900 e 390×844; verificar console e ausência de scroll horizontal.

## Critérios de aceite

- Texto normal com contraste mínimo 4,5:1 e componentes visuais relevantes com 3:1, nos dois temas.
- Nenhum controle aparenta funcionar sem resposta ou feedback claro.
- Conteúdo final das páginas autenticadas alcançável sem ficar sob a BottomNav; sem scroll horizontal em 390px.
- Títulos têm sequência semântica válida; controles mantêm nome acessível, foco visível e operação por teclado.
- Estados vazios e de erro indicam claramente o que ocorreu e o próximo passo possível.
- `npm --prefix frontend run lint` e `npm --prefix frontend run build` passam.

## Fora do escopo deste documento

- Implementar agora qualquer item deste plano.
- Alterar regras de negócio, contratos da API, autenticação ou cookies.
- Fazer push ou deploy para Vercel. O destino de deploy continua sendo o projeto `opsire`, após revisão e autorização do usuário.
