# Roteiro de verificação da interface (manual, no navegador)

Roda sob demanda. Não entra no `node --test`. Rode depois de mexer em `src/ui-*.js` ou `index.html`.

## Preparar
1. Na raiz do projeto: `python -m http.server 8765`.
2. Abra `http://127.0.0.3:8765/`. Use um IP 127.x diferente a cada rodada: o Ctrl+Shift+R não limpa o cache dos módulos.

## Conferir
1. **Console:** nenhum erro. O campo `#erro` da página fica vazio.
2. **Ajuda:** cada controle tem um "?" (`.ajuda`) no rótulo ou no título do painel. Exceções aceitas: Nome do personagem, lista de personagens salvos, seletor de variação B, filtros da tabela de fontes.
3. **Prévia:** digite um texto. Mexa no slider de inclinação. O SVG de `#previa` muda.
4. **Tabela de fontes:** botão "Tabela de fontes" abre um diálogo com 43 linhas. Só a `EMSSpaceRocks` mostra "sem acentos".
5. **Usar:** o botão "Usar" de uma linha troca a base da mão e a prévia muda.

## Rodada de referência (2026-11-08)
Todos os 5 itens passaram. 43 linhas, console limpo.
Medida de `compor` (A4 cheia, 3 fontes misturadas, variacao=1, pressa=1): mediana 43 ms, pior 60 ms. Meta: abaixo de 100 ms.
