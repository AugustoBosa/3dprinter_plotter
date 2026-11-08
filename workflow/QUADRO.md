# Quadro

Atualizado pelo gerente a cada ciclo. Status de tarefa: pendente | em andamento | aceita | devolvida (n) | bloqueada.

## Marcos

| Marco | Status |
|---|---|
| M1 Fontes | FECHADO (ciclo 02) |
| M2 Mão | FECHADO (ciclo 02) |
| M3 Personagens e variações | FECHADO (ciclo 03) |
| M4 Texto e layout | FECHADO (ciclo 03) |
| M5 Exportar | FECHADO (ciclo 01) |
| M6 Página integrada | FECHADO (ciclo 04, verificado no navegador pelo orquestrador) |
| M7 Sem presets, personagens na UI | FECHADO (ciclo 05, verificado no navegador pelo orquestrador) |
| M8 Tabela de fontes | FECHADO (ciclo 05, verificado no navegador pelo orquestrador) |
| M9 Ajuda "?" em cada configuração | FECHADO (ciclo 05, verificado no navegador pelo orquestrador) |

## Itens do DoD comprovados

- M1 `rng`/`hash` — test/rng.test.mjs (7 testes)
- M1 `parsePath` — test/svgpath.test.mjs (13 testes)
- M5 `svg` — test/exportar.test.mjs ('svg com página retangular')
- M5 `otimizar` — test/exportar.test.mjs ('funde', 'inverte', 'não aumenta a viagem', 'não muta')
- M5 `gcode` header/footer/formato/Y invertido/offset/aviso — test/exportar.test.mjs
- M5 `nTracos`/`comprimento` — test/exportar.test.mjs ('traço de 3 pontos', 'traço de 1 ponto')
- M1 `parseFonte` — test/fonte.test.mjs (7 testes: 11 fontes, acentos EMS, espaço, entidades, valores reais)
- M2 determinismo/seed, NEUTRA, idio vs variacao, misturar, mutar (JSON), caractere ausente — test/mao.test.mjs (7 testes)
- M3 todos os 4 itens — test/personagem.test.mjs (resolver/erro, identidade intacta, 4 presets validar, glifo de Teste)
- M4 todos os 6 itens — test/layout.test.mjs (PAGINAS, quebra, parágrafo/página, alinhamentos, limites, queda)

## Tarefas

| ID | Marco | Arquivos | Status | Nota |
|---|---|---|---|---|
| 01-A | M1 | src/rng.js, test/rng.test.mjs | aceita | 7 testes |
| 01-B | M1 | src/svgpath.js, test/svgpath.test.mjs | aceita | 13 testes |
| 01-C | M5 | src/exportar.js, test/exportar.test.mjs | aceita | 12 testes |
| 02-A | M1 | src/fonte.js, test/fonte.test.mjs | aceita | 7 testes |
| 02-B | M2 | src/mao.js, test/mao.test.mjs | aceita | 7 testes |
| 03-A | M3 | src/personagem.js, personagens/*.json, test/personagem.test.mjs | aceita | 6 testes |
| 03-B | M4 | src/layout.js, test/layout.test.mjs | aceita | 10 testes |
| 04-A | M6 | src/ui-personagem.js | aceita | node --check + import ok |
| 04-B | M6 | src/ui-fontes.js, src/ui-texto.js | aceita | idem |
| 04-C | M6 | src/ui-exportar.js | aceita | idem |
| 04-D | M6 | index.html | aceita | ids e sintaxe conferidos; falta navegador |
| 04-E | ajuste | personagens/strahd.json, test/espacamento.test.mjs | aceita | strahd espacamento -0.09 |
| 05-A | M9 | src/ajuda.js, test/ajuda.test.mjs | aceita | 6 testes; textos revisados |
| 05-B | M8 | src/ui-catalogo.js, test/catalogo.test.mjs | aceita | 5 testes |
| 05-C | M7 | src/personagem.js, test/personagem.test.mjs, test/espacamento.test.mjs | aceita | novoPersonagem, ajustarVariacao |
| 05-D | M7/M9 | index.html, src/ui-personagem.js | aceita | sem presets, CSS .ajuda |
| 05-E | M8/M9 | src/ui-fontes.js | aceita | botão Tabela de fontes |
| 05-F | M9 | src/ui-texto.js, src/ui-exportar.js | aceita | rótulos + ? |

## Ciclos

| Ciclo | Resultado |
|---|---|
| 01 | OK: rng, svgpath, exportar aceitos; M5 fechado; 32 pass / 0 fail |
| 02 | OK: fonte e mao aceitos; M1 e M2 fechados; 46 pass / 0 fail |
| 03 | OK: personagem e layout aceitos; M3 e M4 fechados; 62 pass / 0 fail |
| 04 | OK: UI M6 entregue (4 ui-*.js + index.html) e espaçamento do Strahd corrigido; 65 pass / 0 fail; falta verificar M6 no navegador |
| 05 | OK: Fase 2 entregue (M7-M9) em 2 lotes; personagens/ apagado; 76 pass / 0 fail; falta verificação no navegador |

## Retomada (2026-11-08)

- Tudo fechado: M1–M9, 76/76 testes, commit `e3098c4` publicado em `main` e no Pages (https://augustobosa.github.io/3dprinter_plotter/).
- Nenhuma tarefa aberta. Próximo pedido do usuário vira M10 no `DOD.md` e roda no mesmo loop (gerente sonnet → workers haiku → orquestrador confere testes e navegador).
- Pendências conhecidas, não pedidas: offset caneta↔bico não medido (padrão 0); EMSSpaceRocks sem acentos.
- Fontes da pesquisa de fontes: github.com/golanlevin/p5-single-line-font-resources, gitlab.com/oskay/svg-fonts, github.com/isdat-type/Mistral-SingleLine, github.com/isdat-type/Relief-SingleLine.
- Verificar no navegador do app: cache não limpa com Ctrl+Shift+R; abrir http://127.0.0.2:8765/ (ou outro 127.x) depois de `preview_start caligrafia`.

## Notas do orquestrador

- 2026-11-08: fontes expandidas de 11 para 43 (resto das EMS, 11 Hershey-EMS, Mistral SingleLine convertida de OTF-SVG, TwinSans). Créditos em `fontes/LICENCAS.md`; catálogo em `src/catalogo.js` (feito pelo orquestrador). Descartadas: duplicatas Hershey do vpype, ISO3098 e Shriinivas (licença não documentada), Relief Ornament (não é letra). Tabela de fontes ganhou coluna com nome da fonte e linhas compactas.

## Varredura geral (2026-11-08) — pontos em aberto

Estado: 78/78 testes. **Lote 1 (itens 1, 2 e 4) feito em `src/layout.js`**: troca de aspas/`…`/`—` por ASCII quando a fonte não tem, aviso `glifo ausente: X` (cobre os acentos da EMSSpaceRocks), e medição de largura com as mesmas ocorrências do desenho (excesso de margem 6,5 → 1,4 mm no pior caso com variacao=1 e pressa=1; o resto é a inclinação do glifo, dentro da tolerância). Demais itens abertos.

### Prioridade (candidatos a M10)
1. **Glifo ausente some sem aviso** (`src/layout.js`). `‘ ’ …` faltam em 40/43 fontes; `“ ” — – « » €` e acentos `á ã ç é ê õ` faltam em `EMSSpaceRocks`. Correção: `compor` avisar "glifo ausente: X" e/ou trocar `“ ” ‘ ’ … —` por `" ' ... -`. ~15 linhas + teste.
2. **Largura medida ≠ desenhada** (`medir()` usa ocorrência 0; desenho usa `variacao`/`pressa` por ocorrência). Caso medido: texto passou 0,55 mm da margem direita (A5, justificado, variacao=1, pressa=1). Desalinha centro/justificado. Correção: medir com as mesmas ocorrências ou dar folga.

### Outros
3. Offset caneta↔bico não medido (`offsetX/Y = 0`) — exige teste físico; maior impacto real.
4. ~~`EMSSpaceRocks` sem acentos~~ FEITO: a tabela de fontes mostra "sem acentos" (usa `SEM_ACENTOS` de `src/fonte.js`).
5. ~~Sem teste de UI~~ FEITO: roteiro manual em `test/ui-smoke.md`, rodado no navegador (5/5 ok). Sem automação (ceiling: virar script Playwright se incomodar).
6. ~~Desempenho~~ MEDIDO: `compor` com A4 cheia, 3 fontes, variacao=1: mediana 43 ms, pior 60 ms. Sem correção necessária.
7. `otimizar` guloso, início fixo em (0,0) (já marcado `ponytail:`); só mexer se a viagem pesar.

### Higiene
- `arquivo/` LIMPO (2026-11-08): 147 MB → 3,7 MB. Ficou `vpype.toml`, `testes-fisicos/` e `modelos/`. O resto (scripts Python, mapas, cartas, originais de fontes) foi apagado por ser obsoleto.
- README atualizado com `workflow/`, mesa 210×210 e aviso "fora da mesa".

### Ideias M10 (não pedidas)
Exportar todas as páginas de uma vez; prévia com ordem de traçado e viagens; importar `.txt`.

### Verificado nesta varredura
Nenhum traço com <2 pontos nos glifos (descarte em `valido()` não perde dados); CRLF no texto funciona.
