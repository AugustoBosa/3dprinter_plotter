# Definition of Done

Projeto: página HTML+JS puro que gera caligrafia de traço único para a plotter (Anycubic i3 Mega S com caneta) e exporta SVG e G-code.
Objetivo: cada personagem tem uma mão reconhecível; variações (formal, apressado, raiva, medo...) mudam só a execução.

## Regras gerais (valem para todo marco)

- `node --test` verde na raiz `writer/` (Node 25, sem dependências npm).
- Só arquivos do contrato abaixo. Módulos ES (`export`), sem DOM nos módulos de `src/` (rodam no Node e no navegador).
- `arquivo/` é só leitura. Nada de commit.
- Funções puras e determinísticas: todo aleatório vem de `src/rng.js` com seed.

## Contrato de arquivos e interfaces

```
index.html          UI única
src/rng.js          export function rng(seed:number|string) -> () => number em [0,1)   (mulberry32)
                    export function hash(str) -> uint32                                 (FNV-1a)
src/svgpath.js      export function parsePath(d, tol=2) -> Array<Array<[x,y]>>          (M L H V C S Q T Z, abs+rel; curvas achatadas com erro <= tol em unidades da fonte; A pode ser aproximado por reta)
src/fonte.js        export function parseFonte(svgText, nome) -> Fonte                 (regex, sem DOMParser; decodifica &#xNN; &#NN; &amp; &quot; &lt; &gt;)
                    Fonte = {nome, upm, ascent, descent, advPadrao, glifos: {[ch]: {adv, tracos: Array<Array<[x,y]>>}}}   (y para cima, unidades da fonte)
                    export const FONTES = [lista dos 11 arquivos de fontes/ sem extensão]
src/mao.js          export const IDENTIDADE = ['base','seed','inclinacao','largura','altura','espacamento','espacoPalavra','idio']
                    export const EXECUCAO   = ['pressa','capricho','tremor','queda','compressao','variacao','desleixo']
                    export const NEUTRA = {...} (todos os parâmetros com valor que não altera a fonte)
                    Mao = {base: [{fonte, peso}], seed, inclinacao(graus), largura(fator), altura(fator), espacamento(em), espacoPalavra(em), idio(0-1), pressa(0-1), capricho(0-1), tremor(mm), queda(mm/linha), compressao(fator), variacao(0-1), desleixo(0-1)}
                    export function glifo(fontes, mao, ch, ocorrencia) -> {adv, tracos}   (em em: 1 em = 1.0; y para cima)
                    export function misturar(glifoA, glifoB, t) -> glifo | null            (null se nº de traços diferente)
                    export function mutar(mao, seed, forca) -> Mao                         (nova mão: muda só IDENTIDADE)
src/personagem.js   Personagem = {nome, mao: Mao, variacoes: {[nome]: Partial<Mao> só com chaves de EXECUCAO}}
                    export function resolver(p, variacao) -> Mao     (lança erro se a variação tiver chave fora de EXECUCAO)
                    export function validar(p) -> string[]           (lista de erros, vazia = ok)
src/layout.js       Pagina = {largura, altura, margens:{topo,dir,base,esq}} em mm;  export const PAGINAS = {A4, A5, mesa:{210x210}}
                    export function compor(texto, fontes, mao, pagina, opcoes) -> {paginas: Array<Array<traço em mm>>, avisos}
                    opcoes = {tamanho(mm do em), entrelinha(fator), alinhamento:'esquerda'|'centro'|'justificado'}
                    traço em mm = Array<[x,y]> com y PARA BAIXO, origem no canto superior esquerdo da página
src/exportar.js     export const PERFIL_PADRAO (valores de arquivo/vpype.toml: Z escrita 3, levantada 6, F2400 desenho, F6000 viagem, F500 Z, header/footer iguais)
                    export function svg(tracos, pagina) -> string (width/height em mm, viewBox em mm, stroke só, fill none)
                    export function otimizar(tracos, tol=0.1) -> tracos   (junta pontas a <= tol, ordena por vizinho mais próximo, pode inverter traço)
                    export function gcode(tracos, pagina, perfil) -> {texto, avisos, nTracos, comprimento}   (Y invertido: yMaquina = pagina.altura - y; soma offsetX/offsetY; aviso se fora de 0..mesaX / 0..mesaY)
test/<modulo>.test.mjs   um arquivo de teste por módulo, node:test + node:assert
fontes/*.svg        11 fontes (cópia; não editar)
personagens/*.json  presets (Personagem)
```

## Convenções fixadas (ciclo 02)

- `fontes` passado às funções = `{[nome]: Fonte}`; `mao.base[i].fonte` = nome da fonte.
- `espacamento` já entra no `adv` devolvido por `glifo`.
- `tremor`, `queda` e `espacoPalavra` são aplicados em `layout.js` (não em `mao.js`).

## Marcos

### M1 Fontes — `src/rng.js`, `src/svgpath.js`, `src/fonte.js`
- [ ] `rng`: mesma seed ⇒ mesma sequência; seeds diferentes ⇒ sequências diferentes; valores em [0,1). `hash` estável (teste com valor fixo).
- [ ] `parsePath`: testes com M/L/H/V/Z absolutos e relativos, C/S/Q/T (pontos finais exatos; meio da curva dentro da tolerância), vários subcaminhos ⇒ várias polilinhas.
- [ ] `parseFonte`: as 11 fontes carregam (via `fs` no teste); `upm` > 0; ≥ 60 glifos cada; nas 10 EMS existem `á ã ç é ê õ` com ≥ 1 traço; espaço tem `adv` > 0 e 0 traços.

### M2 Mão — `src/mao.js`
- [ ] mesma mão + mesma ocorrência ⇒ saída idêntica; `seed` diferente ⇒ diferente (com `idio` > 0).
- [ ] `NEUTRA` com base de 1 fonte ⇒ traços iguais aos da fonte (divididos por upm) com tolerância 1e-6.
- [ ] `idio` (identidade) igual entre ocorrências; `variacao` (execução) muda entre ocorrências do mesmo caractere.
- [ ] `misturar(A,B,0)` = A, `(A,B,1)` = B, `0.5` = ponto médio após reamostragem; `null` se nº de traços diferente; base com 2 fontes e traços incompatíveis escolhe fonte por `hash(ch+seed)` (determinístico).
- [ ] `mutar` altera só chaves de IDENTIDADE; resultado é JSON serializável e recarregável (`JSON.parse(JSON.stringify(m))` dá a mesma saída).
- [ ] caractere ausente em todas as fontes ⇒ glifo vazio com `adv` padrão, sem exceção.

### M3 Personagens e variações — `src/personagem.js`, `personagens/*.json`
- [ ] `resolver` lança erro para chave de IDENTIDADE na variação; teste cobre.
- [ ] Mesmo personagem, variações diferentes ⇒ mesmos `base`, `seed`, `idio` (identidade intacta).
- [ ] ≥ 4 presets: `strahd`, `kolyan`, `van-richten`, `fiona`, cada um com ≥ 3 variações (`formal`, `apressado`, e uma emocional: `raiva`/`medo`/`cansaco`). Todos passam em `validar`. Base de cada um tirada de `arquivo/plotter/cartas/personagens.md` (Strahd recriado a partir de fontes EMS, sem portar `maos.py`).
- [ ] Teste: os 4 presets carregam do disco e compõem "Teste" sem erro.

### M4 Texto e layout — `src/layout.js`
- [ ] `PAGINAS` tem A4 (210x297), A5 (148x210), mesa (210x210); página personalizada aceita.
- [ ] quebra por palavra respeitando margem direita; palavra maior que a linha é quebrada por letra com aviso.
- [ ] linha em branco = novo parágrafo; quebra de página quando passa da margem de baixo.
- [ ] alinhamentos esquerda/centro/justificado (teste mede x inicial/final das linhas).
- [ ] teste de limites: nenhum ponto fora da área útil, salvo `tremor`/inclinação (tolerância = tamanho * 0.3 informada em `avisos`).
- [ ] `queda` aplicada por linha (linhas descem progressivamente).

### M5 Exportar — `src/exportar.js`
- [ ] `svg` gera width/height em mm e um `<path>` ou `<polyline>` por traço.
- [ ] `otimizar`: traços que se tocam viram um; comprimento de viagem total ≤ o da ordem original (teste com caso fixo).
- [ ] `gcode`: começa exatamente com o `document_start` de `arquivo/vpype.toml`; cada traço = viagem G0 F6000, `G1 Z3 F500`, G1 F2400..., `G0 Z6 F500`; termina com o `document_end`; Y invertido; offset somado; aviso quando sai da mesa 210x210.
- [ ] retorna `nTracos` e `comprimento` (mm) corretos para caso fixo.

### M6 Página integrada — `index.html`
- [ ] carrega as 11 fontes por `fetch` e os presets; servido por `python -m http.server` na raiz `writer/`.
- [ ] painéis: Personagem (escolher preset, variação, editar parâmetros com sliders, salvar/abrir JSON, localStorage), Fontes (mistura com pesos, botão mutar com seed), Texto (textarea, página, margens, tamanho, entrelinha, alinhamento), Exportar (perfil G-code editável, offset da caneta, baixar SVG e G-code, nº de traços e comprimento).
- [ ] prévia SVG atualiza ao mudar qualquer controle; navegação entre páginas.
- [ ] comparação lado a lado de duas variações do mesmo personagem.
- [ ] zero erros no console; fluxo completo verificado pelo orquestrador no navegador.

## Fase 2 (pedido do usuário, 2026-11-08)

Exceção ao contrato: `src/ui-*.js` podem usar DOM. Arquivos novos permitidos: `src/catalogo.js` (escrito pelo orquestrador — só leitura para workers), `src/ajuda.js`, `src/ui-catalogo.js`, `test/catalogo.test.mjs`, `test/ajuda.test.mjs`.

### M7 Sem presets — personagens criados pelo usuário
- [ ] `personagens/` e `PRESET_IDS` removidos; nenhum `fetch` de preset. Testes que liam presets passam a usar personagem inline (fixture no próprio teste).
- [ ] App abre com um personagem em branco ("Novo personagem", `NEUTRA` sobre base `EMSDelight`, variação `normal` vazia).
- [ ] UI: botão Novo personagem; nome editável; adicionar, renomear e remover variação (variação guarda só as chaves de EXECUCAO que diferem da mão); lista de personagens salvos no localStorage (salvar, abrir, excluir); Salvar/Abrir JSON continuam.
- [ ] `node --test` verde.

### M8 Tabela de fontes (catálogo)
- [ ] `test/catalogo.test.mjs`: todo nome de `FONTES` tem entrada em `CATALOGO` e vice-versa; eixos 1–5 e aptidões 0–3 inteiros; chaves iguais a `EIXOS` e `ARQUETIPOS`.
- [ ] No painel Fontes, botão "Tabela de fontes" abre um `<dialog>` (`src/ui-catalogo.js`) com uma linha por fonte: amostra renderizada (SVG de "Prezado Senhor, ação!" com a própria fonte), família, ligação, os 5 eixos (barra ou ●●●○○), aptidões por arquétipo (★), descrição.
- [ ] Filtro por arquétipo (ordena por aptidão desc. e destaca as aptas ≥ 2) e ordenação por qualquer eixo.
- [ ] Cada linha tem "Usar" (vira a base da mão) e "Misturar" (adiciona à mistura com peso 0.5); a prévia atualiza.
- [ ] Cabeçalhos dos eixos e arquétipos com o ícone de ajuda (M9) usando os textos `ajuda` de `catalogo.js`.

### M10 Trajeto, exportar tudo, importar .txt, 2-opt (pedido do usuário, 2026-11-08)
- [x] `otimizar` aplica 2-opt (janela de 50 traços, 5 passadas) depois do guloso; nunca piora a viagem (`viagem()` exportada); testes em `test/exportar.test.mjs`.
- [x] `svg(tracos, pagina, {trajeto})` desenha viagem tracejada, início verde, fim vermelho e número; sem a opção a saída não muda. Checkbox "mostrar trajeto" no painel Exportar.
- [x] Botões "Baixar todos os SVG" / "Baixar todos os G-code": um arquivo por página.
- [x] Importar `.txt` (até 200 KB) no painel Texto.
- [x] Verificado no navegador: console limpo, 8 páginas → 8+8 downloads, arquivo grande recusado.

### M9 Ajuda em cada configuração
- [ ] `src/ajuda.js` exporta `AJUDA = {[chave]: texto}` cobrindo: todas as chaves de IDENTIDADE e EXECUCAO, mistura/peso/mutar/seed, página, margens, tamanho, entrelinha, alinhamento, comparar, offset X/Y, Z escrita/levantada, velocidades, header/footer. Texto curto em pt-BR simples: o que faz, faixa de valores e efeito visível na letra.
- [ ] `test/ajuda.test.mjs`: toda chave de IDENTIDADE e EXECUCAO tem texto não vazio.
- [ ] Cada controle da UI tem ao lado um "?" circulado (`<span class="ajuda" tabindex="0" data-ajuda="...">?</span>`) que mostra o texto ao passar o mouse e ao focar pelo teclado (CSS, sem biblioteca). Rótulos legíveis no lugar das chaves cruas (ex.: "espaço entre palavras" em vez de `espacoPalavra`).
- [ ] Verificação no navegador pelo orquestrador: console limpo, tooltip visível, nenhum controle sem "?".
