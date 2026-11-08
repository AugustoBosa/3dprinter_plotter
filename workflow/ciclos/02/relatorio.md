# Relatório do ciclo 02

`node --test`: tests 46, pass 46, fail 0.

Tarefas: 02-A fonte.js aceita; 02-B mao.js aceita. Código e testes lidos; interfaces batem com o contrato; só arquivos permitidos.

DoD marcado: M1 parseFonte (M1 fechado); M2 todos os 6 itens (M2 fechado).

Observações: parseFonte dá upm NaN se faltar units-per-em (arquivos reais têm). misturar com traço de 0 pontos devolve traço vazio. Convenção fixada em mao.js: fontes = {[nome]: Fonte}, mao.base[i].fonte = nome; espacamento entra no adv; tremor, queda e espacoPalavra ficam para o layout. Proposta ao contrato: documentar essas convenções no DOD.md.

Próximo passo (ciclo 03): personagem.js + presets (M3, importa EXECUCAO/IDENTIDADE de mao.js) e layout.js (M4, usa glifo; tremor/queda/espacoPalavra lá). Duas tarefas em arquivos separados; presets exigem ler arquivo/plotter/cartas/personagens.md.
