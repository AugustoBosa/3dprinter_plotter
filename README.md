# 3dprinter_plotter

Gerador de caligrafia de traço único para uma impressora 3D (Anycubic i3 Mega S) adaptada como plotter de caneta.

- Cada personagem tem uma mão própria (mistura e mutação de fontes de traço único).
- Variações (formal, apressado, raiva, cansaço...) mudam só a execução; a letra continua reconhecível.
- Exporta SVG e G-code (Z3 escreve, Z6 levanta, mesa 210×210).

Abrir: https://augustobosa.github.io/3dprinter_plotter/ ou, local, `python -m http.server` na raiz e `http://localhost:8000`.

Também: "mostrar trajeto" na prévia (viagem no ar, início/fim e ordem de cada traço), "Baixar todos" (um arquivo por página) e importar texto de um `.txt`.

Testes: `node --test` (Node 20+, sem dependências). A interface tem um roteiro manual em `test/ui-smoke.md`.

Mesa: 210×210 mm. O G-code avisa quando um traço sai da mesa ("fora da mesa").

`workflow/` guarda o quadro de tarefas (`QUADRO.md`) e a definição de pronto (`DOD.md`). `arquivo/` (fora do git) guarda só os arquivos físicos: G-code do suporte da caneta, testes de calibração e `vpype.toml`.

43 fontes de traço único em `fontes/` (EMS, Hershey, Relief, Mistral, TwinSans) — licenças e créditos em `fontes/LICENCAS.md`.

## Scrolls e grimórios de D&D (`grimorio.html`)

Página para plotar props de magia: scroll (uma magia por folha) ou grimório (magias em sequência), em A5, A6, A7 ou A8, retrato ou paisagem.

- Cada magia sai com nome, sigilo, ficha (nível, tempo, alcance, componentes, duração) e efeito. Em "Completo se couber", a letra diminui até o mínimo; se ainda não couber, entra o resumo; por último sai o sigilo.
- Quem escreve é um personagem salvo na página de caligrafia.
- Alfabeto arcano gerado por seed ("tradição"); cada bloco (nome, ficha, efeito) pode sair legível ou cifrado. A página da chave mostra letra e símbolo lado a lado.
- O sigilo codifica a magia: pontas = nível + 2, miolo = escola, anel duplo = concentração, dentes = ritual, marcas no anel = V/S/M.
- "Desenhar símbolos…" troca qualquer letra ou sigilo gerado por um desenho seu. "Exportar tradição" guarda seed, estilo e desenhos em JSON.

Dados das magias: ficam em `dados/` (fora do git, uso próprio). Gerar com `node scripts/gerar-magias.mjs [pasta]` (padrão: `../../dnd/data/spells`, formato 5etools). A tradução (nome e resumo em pt-BR) é `dados/traducao-ptbr.txt`, uma linha `id|Nome|Resumo` por magia; edite e rode o script de novo. Sem `dados/magias.json` (ex.: no GitHub Pages) a página aceita importar o JSON ou criar magias em branco.

Módulos: `src/magia.js` (5etools → ficha pt-BR), `src/arcano.js` (alfabeto, sigilo, moldura), `src/scroll.js` (montagem e ajuste à folha), `src/ui-grimorio.js` (interface). Testes em `test/grimorio.test.mjs`.
