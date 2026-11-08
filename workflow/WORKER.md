# Protocolo do worker

Você executa UMA tarefa do projeto de caligrafia para plotter. Raiz: `C:\Users\augus\Desktop\augusto\writer`.

Regras:
1. Crie/edite só os arquivos listados no seu brief. Não toque `workflow/`, `arquivo/`, `fontes/`. Não faça commit. Não instale pacotes.
2. JavaScript moderno, módulos ES (`export function ...`). Sem dependências. Sem DOM em `src/` (precisa rodar no Node 25 e no navegador).
3. Código simples e curto. Sem abstração que o brief não pediu. Nomes em português como no contrato.
4. Escreva o teste em `test/<modulo>.test.mjs` com `import { test } from 'node:test'` e `import assert from 'node:assert/strict'`. Leia arquivos com `fs` relativo a `new URL('../', import.meta.url)`.
5. Rode o comando de verificação do brief. Se falhar, corrija e rode de novo. Não desligue nem afrouxe teste para passar.
6. Se o brief estiver errado ou impossível, pare e explique na resposta, sem inventar outra interface.

Resposta final (máx. 10 linhas): arquivos criados/editados, funções exportadas, saída resumida do teste (`# pass N`, `# fail N`), e qualquer dúvida/limitação.
