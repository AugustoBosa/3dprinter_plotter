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

## Ciclos

| Ciclo | Resultado |
|---|---|
| 01 | OK: rng, svgpath, exportar aceitos; M5 fechado; 32 pass / 0 fail |
| 02 | OK: fonte e mao aceitos; M1 e M2 fechados; 46 pass / 0 fail |
| 03 | OK: personagem e layout aceitos; M3 e M4 fechados; 62 pass / 0 fail |
| 04 | OK: UI M6 entregue (4 ui-*.js + index.html) e espaçamento do Strahd corrigido; 65 pass / 0 fail; falta verificar M6 no navegador |
