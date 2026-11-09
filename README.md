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
