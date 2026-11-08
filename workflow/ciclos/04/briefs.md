# Ciclo 04 — M6 página integrada

Resumo: a UI é dividida em módulos `src/ui-*.js` (podem usar DOM; é a única exceção ao contrato "sem DOM em src/") e um `index.html` que só tem markup, CSS e um `<script type="module">` que conecta tudo. Não existe teste de DOM. Verificação de cada módulo ui: `node --check src/ui-X.js` E `node -e "import('./src/ui-X.js').then(m=>console.log(Object.keys(m)))"` (não pode usar `document`/`window` no topo do módulo, só dentro de funções).

## Interface comum (vale para 04-A, 04-B, 04-C, 04-D)

Todo módulo de painel exporta `montar(elemento, estado, aoMudar)`:
- `elemento`: contêiner (um `<div>` vazio do index.html). O módulo constrói os controles dentro dele com `document.createElement` / `innerHTML` estático.
- `estado`: o objeto compartilhado (abaixo). O módulo LÊ e ESCREVE nele diretamente (mutação no lugar). Nunca substitua o objeto `estado`; pode substituir propriedades dele.
- `aoMudar()`: callback sem argumentos. Chamar SEMPRE depois de alterar o estado por ação do usuário. O index recompõe a prévia e depois chama o `atualizar()` de todos os painéis.
- `montar` DEVOLVE uma função `atualizar()` (sem argumentos) que apenas ressincroniza os controles já criados com o `estado` (define `.value`, `.checked`, `.textContent`; reconstrói listas/opções só se mudaram). `atualizar()` NÃO chama `aoMudar()` (senão loop infinito). Ela é chamada a cada mudança, inclusive enquanto o usuário arrasta um slider: não recrie o elemento que está sendo arrastado/digitado; só mude o valor se `String(el.value) !== String(novo)`.
- Eventos: sliders/inputs usam o evento `input`; selects e checkboxes usam `change`.

### Objeto `estado` (criado no index.html; nomes exatos)

```js
estado = {
  fontes: {},                 // {[nome]: Fonte}  (preenchido pelo index após fetch)
  nomesFontes: [],            // = FONTES de src/fonte.js (11 nomes)
  presets: {},                // {[id]: Personagem} originais intocados; ids: strahd, kolyan, van-richten, fiona
  presetId: 'strahd',
  personagem: null,           // Personagem editável = structuredClone(presets[presetId]); {nome, mao, variacoes}
  variacao: 'formal',         // chave de personagem.variacoes, ou '' = sem variação (mão base)
  comparar: false,            // (só o index usa)
  variacaoB: 'apressado',     // (só o index usa)
  texto: '',                  // string
  paginaNome: 'A5',           // 'A4' | 'A5' | 'mesa' | 'personalizada'
  pagina: {largura:148, altura:210, margens:{topo:15,dir:15,base:15,esq:15}},   // mm; é cópia, nunca a referência de PAGINAS
  opcoes: {tamanho: 6, entrelinha: 1.6, alinhamento: 'esquerda'},               // 'esquerda'|'centro'|'justificado'
  perfil: {},                 // cópia de PERFIL_PADRAO (src/exportar.js), editável
  otimizar: true,             // aplicar otimizar() antes de exportar
  paginaAtual: 0,             // índice (0-based) da página mostrada
  resultado: null,            // {paginas, avisos} de compor() para a variação A; preenchido pelo index ANTES de chamar atualizar()
  resultadoB: null,           // idem para a variação B (só quando comparar)
}
```

Mão efetiva da variação A = `resolver(estado.personagem, estado.variacao || null)` (de `src/personagem.js`; com `null` devolve a mão base).

### Ids dos elementos do index.html (nomes exatos)

`#painel-personagem`, `#painel-fontes`, `#painel-texto`, `#painel-exportar` (contêineres passados a `montar`); `#previa` (SVG da variação A), `#previa-b` (SVG da variação B, oculto se `!estado.comparar`), `#comparar` (checkbox), `#variacao-b` (select), `#pag-ant`, `#pag-prox`, `#pag-info` (texto "Página 1 de 3"), `#avisos` (lista de avisos), `#erro` (mensagem de falha).

### Módulos e o que exportam

| Arquivo | Exporta |
|---|---|
| `src/ui-personagem.js` | `restaurar(estado)`, `montar(elemento, estado, aoMudar)` |
| `src/ui-fontes.js` | `montar(elemento, estado, aoMudar)` |
| `src/ui-texto.js` | `montar(elemento, estado, aoMudar)` |
| `src/ui-exportar.js` | `montar(elemento, estado, aoMudar)` |

Imports permitidos nos módulos ui: apenas de `./mao.js`, `./personagem.js`, `./layout.js`, `./exportar.js`, `./fonte.js` (nomes exportados exatamente como no contrato: `IDENTIDADE, EXECUCAO, NEUTRA, mutar` de mao.js; `resolver, validar` de personagem.js; `PAGINAS` de layout.js; `PERFIL_PADRAO, svg, otimizar, gcode` de exportar.js).

### Estilo comum dos controles (para o CSS do index.html funcionar sem classes especiais)

Cada controle = `<label>` contendo texto + `<input>`/`<select>`; sliders: `<label class="slider">nome <input type="range" ...> <output>valor</output></label>`. Títulos de subseção = `<h3>`. Botões = `<button type="button">`. Mensagens de erro do painel = `<p class="erro">`. Nenhum CSS inline além do estritamente necessário; o CSS fica no index.html.

---

## Tarefa 04-A

Arquivo único: `src/ui-personagem.js`. NÃO toque outro arquivo.

Painel Personagem. Exporta:

1. `restaurar(estado)`: lê `localStorage.getItem('writer.personagem')` (JSON `{presetId, personagem, variacao}`) dentro de try/catch; se existir e `validar(p).length === 0`, define `estado.presetId`, `estado.personagem`, `estado.variacao` (só se `variacao === ''` ou for chave de `personagem.variacoes`; senão ignora a variacao salva). Qualquer erro: ignora silenciosamente. Chamada pelo index antes de `montar`.
2. `montar(elemento, estado, aoMudar)` constrói:
   - `<select>` Preset: opções = `Object.keys(estado.presets)` com texto `estado.presets[id].nome`. Ao mudar: `estado.presetId = id; estado.personagem = structuredClone(estado.presets[id]); estado.variacao = 'formal' in variacoes ? 'formal' : primeira chave ('' se não houver)`; `aoMudar()`.
   - `<select>` Variação: opção vazia "(nenhuma)" com value `''` + uma opção por chave de `estado.personagem.variacoes`. Ao mudar: `estado.variacao = valor; aoMudar()`.
   - Sliders de identidade (editam `estado.personagem.mao[chave]`), título `<h3>Identidade</h3>`: inclinacao [-30,30] passo 0.5; largura [0.5,1.5] .01; altura [0.5,1.5] .01; espacamento [-0.2,0.3] .005; espacoPalavra [0,0.6] .01; idio [0,1] .01.
   - Sliders de execução, título `<h3>Execução</h3>`: pressa [0,1] .01; capricho [0,1] .01; tremor [0,2] .05; queda [-2,2] .05; compressao [0.6,1.4] .01; variacao [0,1] .01; desleixo [0,1] .01. REGRA: o valor mostrado é `resolver(estado.personagem, estado.variacao || null)[chave]`; ao arrastar: se `estado.variacao` for não vazia, grava em `estado.personagem.variacoes[estado.variacao][chave] = Number(valor)`; senão grava em `estado.personagem.mao[chave]`. (Nunca escreva chave de EXECUCAO fora dessas duas posições nem chave de identidade em variacoes.)
   - Cada slider mostra o valor num `<output>`.
   - Botões: "Salvar JSON" (baixa `estado.personagem` como `<slug-do-nome>.json` via Blob + `<a download>` + `URL.revokeObjectURL`), "Abrir JSON" (`<input type="file" accept=".json,application/json">` escondido + botão que o aciona; lê com `file.text()`, `JSON.parse` em try/catch, `validar(p)`; se houver erros mostrar em um `<p class="erro">` dentro do painel e NÃO alterar o estado; se ok: `estado.personagem = p; estado.variacao = primeira chave de variacoes ou ''; aoMudar()`; `presetId` não muda), "Restaurar preset" (`estado.personagem = structuredClone(estado.presets[estado.presetId])`; variacao mantida se ainda existir, senão primeira; `aoMudar()`).
   - Persistência: dentro de `atualizar()` (que roda após toda mudança) grave `localStorage.setItem('writer.personagem', JSON.stringify({presetId, personagem, variacao}))` em try/catch.
   - `atualizar()`: ressincroniza selects (reconstruindo as opções de Variação se as chaves mudaram), valores e `<output>` dos sliders.

Não fazer: não tocar em `base`/`seed` (outro painel); não criar CSS; não usar innerHTML com dados do usuário (nome de personagem vindo de JSON: use `textContent`).

Verificação: `node --check src/ui-personagem.js` e `node -e "import('./src/ui-personagem.js').then(m=>console.log(Object.keys(m)))"` deve listar `montar` e `restaurar`. Rode também `node --test` (deve continuar verde).

---

## Tarefa 04-B

Arquivos: `src/ui-fontes.js` e `src/ui-texto.js`. NÃO toque outro arquivo.

### `src/ui-fontes.js` — painel Fontes (edita `estado.personagem.mao.base` e `seed`)
- Lista de linhas, uma por item de `estado.personagem.mao.base`: `<select>` com `estado.nomesFontes`, slider de peso [0,1] passo .05 com `<output>`, botão "remover" (desabilitado se só há 1 item). Alterar select/peso grava no item (`peso` como Number, no mínimo 0.01 — `validar` exige peso > 0) e chama `aoMudar()`.
- Botão "adicionar fonte": `base.push({fonte: estado.nomesFontes[0], peso: 0.5})`; `aoMudar()`.
- Mutar: `<input type="number">` seed (valor inicial 1), slider "força" [0,1] passo .05 (inicial 0.3), botão "Mutar": `estado.personagem.mao = mutar(estado.personagem.mao, Number(seedInput.value), Number(forca))` (import `mutar` de `./mao.js`); depois incrementa o input de seed em 1 e chama `aoMudar()`.
- `<input type="number">` "Seed da mão" ligado a `estado.personagem.mao.seed` (inteiro; `Math.trunc`; se `NaN` ignore).
- `atualizar()`: reconstrói a lista de linhas SE o nº de itens mudou ou algum valor difere dos controles; senão só atualiza valores (não recrie a linha cujo slider está sendo arrastado). Atualiza o input de seed da mão.

### `src/ui-texto.js` — painel Texto (edita `estado.texto`, `paginaNome`, `pagina`, `opcoes`)
- `<textarea rows="8">` ligado a `estado.texto` (evento `input`).
- `<select>` Página com opções A4, A5, mesa, personalizada. Ao escolher A4/A5/mesa: `estado.paginaNome = nome; estado.pagina = structuredClone(PAGINAS[nome]); estado.paginaAtual = 0`. Ao escolher 'personalizada': só `estado.paginaNome = 'personalizada'` (mantém as medidas atuais).
- Inputs numéricos (mm, passo 1): largura, altura, e 4 margens (topo, dir, base, esq). Editar qualquer um grava em `estado.pagina` (margens em `estado.pagina.margens`), define `estado.paginaNome = 'personalizada'` e chama `aoMudar()`. Ignore `NaN`; largura/altura mínimo 20, margens mínimo 0.
- Slider tamanho [3,15] passo .5 (mm do em), slider entrelinha [1,3] passo .05, `<select>` alinhamento (esquerda, centro, justificado) → `estado.opcoes.*` (números como Number).
- `atualizar()`: ressincroniza todos (textarea só se `estado.texto !== textarea.value`, para não perder o cursor).

Não fazer: não validar texto; não compor nada aqui; não criar CSS.

Verificação: `node --check src/ui-fontes.js && node --check src/ui-texto.js` e `node -e "import('./src/ui-fontes.js').then(m=>console.log(Object.keys(m)));import('./src/ui-texto.js').then(m=>console.log(Object.keys(m)))"` deve imprimir `[ 'montar' ]` duas vezes. `node --test` continua verde.

---

## Tarefa 04-C

Arquivo único: `src/ui-exportar.js`. NÃO toque outro arquivo.

Painel Exportar. `montar(elemento, estado, aoMudar)`:
- Campos numéricos ligados a `estado.perfil` (passo 0.1 para z e offsets, 1 para f e mesa): zEscrita, zLevantada, fDesenho, fViagem, fZ, offsetX, offsetY, mesaX, mesaY. Cada um com rótulo em português (ex.: "Z escrita (mm)", "Offset X da caneta (mm)"). `Number`; ignore `NaN`.
- Duas `<textarea>` (monoespaçada via `style="font-family:monospace"` é aceitável): "Header G-code" ↔ `estado.perfil.header`, "Footer G-code" ↔ `estado.perfil.footer`.
- Checkbox "Otimizar ordem dos traços" ↔ `estado.otimizar`.
- Botão "Restaurar perfil padrão": `estado.perfil = structuredClone(PERFIL_PADRAO)`; `aoMudar()`.
- Botões "Baixar SVG" e "Baixar G-code". Ambos usam os traços da página atual: `const tr0 = estado.resultado?.paginas[estado.paginaAtual] ?? []`; `const tr = estado.otimizar ? otimizar(tr0) : tr0`. SVG: `svg(tr, estado.pagina)`; G-code: `gcode(tr, estado.pagina, estado.perfil).texto`. Download via `Blob` + `<a download>` + `URL.createObjectURL` / `revokeObjectURL`. Nomes: `escrita-p<N>.svg` e `escrita-p<N>.gcode` (N = paginaAtual+1). MIME `image/svg+xml` e `text/plain`.
- Bloco de estatísticas (`<dl>` ou `<p>`), recalculado em `atualizar()`: "Traços: <nTracos>", "Comprimento: <comprimento, 1 casa> mm" e os avisos de `gcode(...)` (lista `<ul>`; se vazia, "sem avisos"). Calcule com `gcode(tr, estado.pagina, estado.perfil)` sobre os mesmos traços (otimizados se `estado.otimizar`). Se `estado.resultado` for null mostre "—". Envolva o cálculo em try/catch (mostre a mensagem do erro no bloco).
- Recalcular o gcode em todo `atualizar()` é aceitável (sem otimização).
- `atualizar()` ressincroniza todos os campos (só altera `.value` se diferir, para não perder cursor).

Não fazer: não compor texto aqui; não alterar `estado.resultado`; não criar CSS; não usar `innerHTML` com texto de aviso (use `textContent`).

Verificação: `node --check src/ui-exportar.js` e `node -e "import('./src/ui-exportar.js').then(m=>console.log(Object.keys(m)))"` deve imprimir `[ 'montar' ]`. `node --test` continua verde.

---

## Tarefa 04-D

Arquivo único: `index.html` (na raiz `writer/`). NÃO toque outro arquivo (os 4 módulos `src/ui-*.js` são escritos em paralelo por outros; você só os importa pelos nomes da tabela acima; eles existirão quando o orquestrador abrir a página).

Markup + CSS + um único `<script type="module">`. Layout: cabeçalho com título "Caligrafia para plotter" e `#erro`; duas colunas: esquerda (largura ~360px, rolável) com 4 blocos `<details open>` (Personagem, Fontes, Texto, Exportar) cada um contendo o `<div id="painel-...">`; direita: barra com `#comparar` (checkbox "Comparar duas variações"), `#variacao-b` (select, oculto quando não comparar), navegação `#pag-ant` `#pag-info` `#pag-prox`, depois `<div id="previas">` com `#previa` e `#previa-b` lado a lado (CSS grid; uma coluna quando comparar desligado) e `#avisos` abaixo. Prévia: fundo da página branco com sombra sobre fundo cinza, SVG com `width:100%; height:auto`. CSS compacto e legível, labels de slider em linha (`label.slider` com grid: texto | range | output). Responsivo: abaixo de 800px as colunas empilham.

Script (módulo), fluxo exato:
```js
import { parseFonte, FONTES } from './src/fonte.js';
import { PAGINAS, compor } from './src/layout.js';
import { PERFIL_PADRAO, svg } from './src/exportar.js';
import { resolver } from './src/personagem.js';
import * as pPersonagem from './src/ui-personagem.js';   // restaurar, montar
import * as pFontes from './src/ui-fontes.js';
import * as pTexto from './src/ui-texto.js';
import * as pExportar from './src/ui-exportar.js';
```
1. Cria `estado` com os campos EXATOS da seção "Objeto estado" (texto inicial: dois parágrafos curtos em português separados por linha em branco, com acentos, ex.: "Caro viajante,\n\nA neblina cobre Barovia e o castelo espera por você. Venha antes do pôr do sol."; `pagina` = `structuredClone(PAGINAS.A5)`; `perfil = structuredClone(PERFIL_PADRAO)`; `nomesFontes = FONTES`).
2. Carrega com `fetch('fontes/' + nome + '.svg').then(r => r.text())` → `parseFonte(texto, nome)` para os 11 nomes de `FONTES` (em paralelo, `Promise.all`), e `fetch('personagens/' + id + '.json').then(r => r.json())` para a LISTA FIXA `['strahd','kolyan','van-richten','fiona']` → `estado.presets[id]`. Se qualquer fetch falhar (`!r.ok` lança erro), escreva a mensagem em `#erro` e pare.
3. `estado.personagem = structuredClone(estado.presets[estado.presetId])`; `estado.variacao = 'formal'`; chame `pPersonagem.restaurar(estado)` (em try/catch).
4. Monte os painéis: `const IDS = ['painel-personagem','painel-fontes','painel-texto','painel-exportar']; const paineis = [pPersonagem, pFontes, pTexto, pExportar].map((m, i) => m.montar(document.getElementById(IDS[i]), estado, aoMudar))`; cada retorno é uma função `atualizar`.
5. `aoMudar()`: agenda com `requestAnimationFrame` (uma só execução por quadro) a função `renderizar()`.
6. `renderizar()`:
   - garante `estado.variacaoB` ∈ chaves de `estado.personagem.variacoes` (senão a primeira chave diferente de `estado.variacao`, senão a primeira, senão ''); repovoa `#variacao-b` só se as chaves mudaram; mostra/oculta `#variacao-b` e `#previa-b` conforme `estado.comparar`.
   - `compor(estado.texto, estado.fontes, resolver(estado.personagem, estado.variacao || null), estado.pagina, estado.opcoes)` → `estado.resultado`. Se comparar: idem com `estado.variacaoB || null` → `estado.resultadoB`; senão `resultadoB = null`. Tudo dentro de try/catch: em erro escreva em `#erro` e retorne; sem erro limpe `#erro`.
   - clampa `estado.paginaAtual` a `[0, n-1]` (n = maior nº de páginas entre A e B); `#pag-info` = `Página X de N`; desabilita `#pag-ant`/`#pag-prox` nas pontas.
   - `#previa.innerHTML = svg(estado.resultado.paginas[estado.paginaAtual] ?? [], estado.pagina)`; idem `#previa-b` com `resultadoB`. Cada prévia precedida por um rótulo (`<p class="rotulo">`, ids livres `rotulo-a`/`rotulo-b`) com o nome da variação.
   - `#avisos`: lista dos `avisos` de A (e de B prefixados "B: ") via `createElement('li')` + `textContent`, ignorando a linha que começa com "tolerancia de limites".
   - chama cada `atualizar()` de `paineis`.
7. Ligações: `#comparar` `change` → `estado.comparar = checked; aoMudar()`; `#variacao-b` `change` → `estado.variacaoB = valor; aoMudar()`; `#pag-ant`/`#pag-prox` → `estado.paginaAtual ∓ 1; aoMudar()`.
8. Ao final do carregamento chame `renderizar()` uma vez diretamente.

Não fazer: não criar outros arquivos CSS/JS; não usar bibliotecas externas/CDN; não colocar lógica de domínio (o index só conecta); não usar `eval`/`innerHTML` com texto que não seja SVG gerado por `svg()`.

Verificação (sem navegador): rode `node -e "const h=require('fs').readFileSync('index.html','utf8');for(const id of ['painel-personagem','painel-fontes','painel-texto','painel-exportar','previa','previa-b','comparar','variacao-b','pag-ant','pag-prox','pag-info','avisos','erro'])if(!h.includes('id=\"'+id+'\"'))console.log('FALTA',id);console.log('ok')"` — deve imprimir só `ok`. Copie o conteúdo do `<script type="module">` para um arquivo `.mjs` na pasta temp do sistema (fora do repo) e rode `node --check` nele; apague o temporário.

---

## Tarefa 04-E

Arquivos: `personagens/strahd.json` (só o campo `espacamento`) e `test/espacamento.test.mjs` (novo). NÃO toque `src/`.

Contexto (investigado pelo gerente): `src/mao.js` soma `espacamento` UMA vez no `adv` e `layout.js` usa esse `adv` uma vez por glifo: NÃO há contagem em dobro (o teste abaixo deve provar isso). A causa das letras soltas é que os `adv` nativos da fonte `EMSDelightSwashCaps` (usada por Strahd) são ~30% maiores que a largura da tinta (razão adv/largura-da-tinta ≈ 1,3; as outras fontes dos presets ficam em ≈ 1,0). Correção: em `personagens/strahd.json`, trocar `"espacamento": 0.02` por `"espacamento": -0.09` (edite só essa linha; o campo está em `mao`).

`test/espacamento.test.mjs` (node:test + node:assert/strict; carregue fontes com `fs` e `parseFonte`/`FONTES` de `../src/fonte.js`, `glifo`/`NEUTRA` de `../src/mao.js`, `compor`/`PAGINAS` de `../src/layout.js`, `resolver` de `../src/personagem.js`; leia `personagens/*.json` com `fs`):
1. "espacamento soma uma vez": mão `{...NEUTRA, base:[{fonte:'EMSBird',peso:1}]}`; `glifo(fontes, mao, 'a', 0).adv` com `espacamento: 0.1` menos o `adv` com `espacamento: 0` deve ser 0.1 (tolerância 1e-9).
2. "compor avança adv uma vez por letra": compor "aa" com a mão neutra (EMSBird) em A4 com tamanho 10, `espacamento` 0 e depois 0.1; o x máximo de todos os pontos de todos os traços com espacamento 0.1 menos o de espacamento 0 deve valer 0.1*10 = 1 mm (tolerância 1e-6): só a 2ª letra desloca, então a diferença é 1 mm e não 2 mm — isso prova que não dobra.
3. "presets: espaçamento é razoável": para cada um dos 4 JSONs, `espacamento` entre -0.15 e 0.1; e para o texto "eaonmt" a razão (soma dos `adv` dos glifos via `glifo` com a mão resolvida na variação `formal`, ocorrência 0) / (soma das larguras da tinta; largura da tinta de um glifo = max x − min x sobre todos os pontos de todos os traços, em em) fica entre 0.85 e 1.25.
Se a asserção 3 falhar para algum preset por pouco, NÃO afrouxe o teste: relate os números na resposta.

Verificação: `node --test test/espacamento.test.mjs` e depois `node --test` (tudo verde).
