# 3dprinter_plotter

Gerador de caligrafia de traço único para uma impressora 3D (Anycubic i3 Mega S) adaptada como plotter de caneta.

- Cada personagem tem uma mão própria (mistura e mutação de fontes de traço único).
- Variações (formal, apressado, raiva, cansaço...) mudam só a execução; a letra continua reconhecível.
- Exporta SVG e G-code (Z3 escreve, Z6 levanta, mesa 210×210).

Abrir: https://augustobosa.github.io/3dprinter_plotter/ ou, local, `python -m http.server` na raiz e `http://localhost:8000`.

Testes: `node --test` (Node 20+, sem dependências).

Fontes em `fontes/`: EMS (SIL OFL, ver `fontes/OFL.txt`) e Relief SingleLine (SIL OFL).
