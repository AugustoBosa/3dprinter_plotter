# Relatório do ciclo 01

`node --test`: tests 32, pass 32, fail 0.

Tarefas: 01-A rng aceita; 01-B svgpath aceita; 01-C exportar aceita. Nenhuma devolvida. Código e testes lidos, interfaces batem com o contrato, sem arquivos fora do permitido.

Itens do DoD marcados: M1 rng, M1 parsePath, M5 inteiro (svg, otimizar, gcode, nTracos/comprimento). M5 fechado. M1 falta `parseFonte`.

Observações: Node 25 detecta ESM em `.js` sem package.json; no navegador não há problema. `A` vira reta e flags compactas de arco não são separadas (aceito pelo contrato).

Próximo passo (ciclo 02): `src/fonte.js` (fecha M1). Cuidados nos fatos: Relief tem glifos sem `unicode` (.notdef), `d` relativo compacto, `glyph-name` antes de `unicode`, tag `<glyph` quebrada em duas linhas; `&apos;` aparece nas EMS; EMS têm ascent 800/descent -200, upm 1000. Depois `src/mao.js` (M2).
