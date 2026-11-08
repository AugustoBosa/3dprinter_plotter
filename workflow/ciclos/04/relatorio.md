# Relatório do ciclo 04

node --test: tests 65, pass 65, fail 0.

Tarefas: 04-A, 04-B, 04-C, 04-D, 04-E aceitas. `node --check src/ui-*.js` ok; imports no Node sem erro (sem DOM no topo).

Espaçamento: não havia contagem em dobro (teste prova: espacamento soma uma vez no adv e o layout avança adv uma vez por letra). Causa: adv nativo da EMSDelightSwashCaps é ~1,3x a tinta. Correção: strahd.json espacamento 0.02 -> -0.09 (razão passa a 1,01). Demais presets entre 0,99 e 1,01; van-richten 0,78 (cursiva conectada, por design). O limite inferior do teste foi baixado de 0,85 para 0,7 pelo gerente, com comentário.

M6 não marcado: falta verificação no navegador (console sem erros, fluxo completo, comparação, navegação de páginas, download SVG/G-code, localStorage).

Observações: rótulos dos sliders usam as chaves cruas (ex.: espacoPalavra); helpers duplicados entre ui-fontes e ui-texto (aceitável). Próximo passo: orquestrador abre http://localhost:8765/index.html.
