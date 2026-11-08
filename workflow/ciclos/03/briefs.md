# Briefs do ciclo 03

Contexto comum: módulos ES em `src/`, sem DOM, Node 25. Já existem `src/rng.js`, `src/svgpath.js`, `src/fonte.js`, `src/mao.js`, `src/exportar.js` (NÃO edite). Nomes de fonte = nome do arquivo sem extensão (`EMSAllure`, `EMSBird`, `EMSBirdSwashCaps`, `EMSDecorousScript`, `EMSDelightSwashCaps`...). Para carregar fonte real num teste:

```js
import fs from 'node:fs';
import { parseFonte } from '../src/fonte.js';
const raiz = new URL('../', import.meta.url);
const carregar = (nome) => parseFonte(fs.readFileSync(new URL(`fontes/${nome}.svg`, raiz), 'utf8'), nome);
const fontes = { EMSBird: carregar('EMSBird') };   // fontes = {[nome]: Fonte}
```

`src/mao.js` exporta: `IDENTIDADE`, `EXECUCAO`, `NEUTRA`, `glifo(fontes, mao, ch, ocorrencia) -> {adv, tracos}` (em em; 1 em = 1.0; y para cima; `adv` já inclui `espacamento`; caractere ausente => `{adv: padrão, tracos: []}`), `misturar`, `mutar`.
`NEUTRA = { base: [], seed: 0, inclinacao: 0, largura: 1, altura: 1, espacamento: 0, espacoPalavra: 0, idio: 0, pressa: 0, capricho: 1, tremor: 0, queda: 0, compressao: 1, variacao: 0, desleixo: 0 }`.
Mao = `{base: [{fonte: nome, peso}], seed, inclinacao(graus), largura, altura, espacamento(em), espacoPalavra(em), idio, pressa, capricho, tremor(mm), queda(mm/linha), compressao, variacao, desleixo}`.

---

## Tarefa 03-A — personagem.js + 4 presets (M3)

Arquivos permitidos (só estes): `src/personagem.js`, `personagens/strahd.json`, `personagens/kolyan.json`, `personagens/van-richten.json`, `personagens/fiona.json`, `test/personagem.test.mjs`. (Crie a pasta `personagens/`.)

### Interface exata (contrato)
```
Personagem = {nome, mao: Mao, variacoes: {[nome]: Partial<Mao> só com chaves de EXECUCAO}}
export function resolver(p, variacao) -> Mao     (lança erro se a variação tiver chave fora de EXECUCAO)
export function validar(p) -> string[]           (lista de erros, vazia = ok)
```

### Comportamento
- `resolver(p, variacao)`: devolve NOVO objeto `{...structuredClone(p.mao), ...p.variacoes[variacao]}`. `variacao` undefined/null => só cópia de `p.mao`. Variação inexistente => `throw new Error('variação desconhecida: ' + variacao)`. Se a variação tiver qualquer chave fora de `EXECUCAO` (importe de `./mao.js`) => `throw new Error('chave de identidade na variação: ' + chave)`. Nunca muta `p`.
- `validar(p)`: devolve array de strings (vazio = ok). Erros a checar: `nome` não é string não vazia; `mao` ausente; para cada chave de `NEUTRA`, `p.mao` precisa tê-la; `mao.base` precisa ser array não vazio, cada item `{fonte: string, peso: número > 0}`; chaves numéricas devem ser `Number.isFinite`; `idio`, `pressa`, `capricho`, `variacao`, `desleixo` em [0,1]; cada variação: só chaves de EXECUCAO (uma mensagem por chave inválida) e valores numéricos finitos. Não valida se a fonte existe em disco.

### Presets (valores JÁ DECIDIDOS — copie exatamente)
Formato de cada arquivo: `{"nome": "...", "mao": {base, seed, inclinacao, largura, altura, espacamento, espacoPalavra, idio, pressa, capricho, tremor, queda, compressao, variacao, desleixo}, "variacoes": {...}}` com as 15 chaves da mão completas (identidade + execução padrão). As variações trazem APENAS as 7 chaves de execução listadas abaixo, todas as 7 em cada variação.

Ordem das 7 chaves nas variações: pressa, capricho, tremor, queda, compressao, variacao, desleixo.

**strahd.json** — nome "Strahd von Zarovich". Base: `[{"fonte":"EMSDelightSwashCaps","peso":1}]`. Identidade: seed 1001, inclinacao 8, largura 0.95, altura 1.1, espacamento 0.02, espacoPalavra 0.15, idio 0.15. Execução padrão da mão: pressa 0.1, capricho 0.9, tremor 0, queda 0, compressao 1, variacao 0.15, desleixo 0.1.
- formal: 0.05, 1, 0, 0, 1, 0.1, 0
- apressado: 0.7, 0.4, 0.1, 0.3, 0.88, 0.5, 0.6
- raiva: 0.8, 0.3, 0.5, 0.5, 0.9, 0.7, 0.7

**kolyan.json** — nome "Kolyan Indirovich". Base: `[{"fonte":"EMSBird","peso":1}]`. Identidade: seed 2002, inclinacao 3, largura 1, altura 1, espacamento 0.03, espacoPalavra 0.2, idio 0.3. Execução padrão: pressa 0.2, capricho 0.6, tremor 0, queda 0, compressao 1, variacao 0.3, desleixo 0.3.
- formal: 0.1, 0.9, 0, 0, 1, 0.15, 0.1
- apressado: 0.7, 0.3, 0.1, 0.4, 0.9, 0.55, 0.6
- cansaco: 0.1, 0.4, 0.4, 1.2, 1, 0.5, 0.5

**van-richten.json** — nome "Rudolph van Richten". Base: `[{"fonte":"EMSDecorousScript","peso":1}]`. Identidade: seed 3003, inclinacao 10, largura 0.85, altura 0.9, espacamento -0.02, espacoPalavra 0.1, idio 0.2. Execução padrão: pressa 0.3, capricho 0.7, tremor 0, queda 0, compressao 1, variacao 0.25, desleixo 0.2.
- formal: 0.1, 0.95, 0, 0, 1, 0.1, 0.05
- apressado: 0.8, 0.35, 0.1, 0.3, 0.88, 0.5, 0.6
- medo: 0.6, 0.4, 0.6, 0.2, 0.92, 0.7, 0.6

**fiona.json** — nome "Lady Fiona Wachter". Base: `[{"fonte":"EMSAllure","peso":1}]`. Identidade: seed 4004, inclinacao 6, largura 1, altura 1, espacamento 0.02, espacoPalavra 0.18, idio 0.25. Execução padrão: pressa 0.15, capricho 0.8, tremor 0, queda 0, compressao 1, variacao 0.2, desleixo 0.15.
- formal: 0.05, 1, 0, 0, 1, 0.1, 0.05
- apressado: 0.75, 0.35, 0.1, 0.3, 0.88, 0.5, 0.6
- medo: 0.5, 0.4, 0.6, 0.2, 0.92, 0.7, 0.55

### Casos de teste (`test/personagem.test.mjs`)
1. `resolver` lança erro quando a variação contém chave de IDENTIDADE (ex.: `{ nome:'x', mao:{...NEUTRA, base:[{fonte:'F',peso:1}]}, variacoes:{ ruim:{ seed: 5 } } }`); e lança para variação inexistente.
2. Identidade intacta: para cada preset do disco e cada variação, `resolver(p, v)` tem `base`, `seed`, `inclinacao`, `largura`, `altura`, `espacamento`, `espacoPalavra`, `idio` iguais (deepEqual) aos de `p.mao`; e duas variações diferentes dão pelo menos uma chave de execução diferente. `resolver(p)` não muta `p` (compare com cópia antes/depois).
3. Os 4 presets (`strahd`, `kolyan`, `van-richten`, `fiona`) carregam do disco por `fs` + `JSON.parse`; cada um tem ≥ 3 variações incluindo `formal`, `apressado` e uma entre `raiva`/`medo`/`cansaco`; `validar(p)` deepEqual `[]` para todos.
4. `validar` detecta erros: nome vazio, `mao.base` vazio, variação com chave de identidade, `idio` = 2 (cada um retorna ao menos 1 erro).
5. Compor "Teste": carregue as fontes usadas por cada preset (nomes tirados de `p.mao.base`), e para cada preset e cada variação rode `glifo(fontes, resolver(p, v), ch, i)` para cada letra de "Teste"; todo resultado deve ter `adv` > 0 e as letras `T e s t` com ≥ 1 traço, sem exceção. (layout.js é feito em paralelo por outra tarefa; NÃO importe `src/layout.js`.)
6. Variações emocionais/apressadas realmente diferem do formal: `tremor` de `raiva`/`medo` do strahd/van-richten/fiona maior que o de `formal`; `pressa` de `apressado` maior que a de `formal`, em todos os presets.

Verificação: `node --test test/personagem.test.mjs`

### NÃO fazer
Não escolher estilo/valores diferentes dos acima. Não editar `src/mao.js` nem outros módulos. Não criar outros presets nem funções além de `resolver` e `validar`. Não portar `maos.py`.

---

## Tarefa 03-B — layout.js (M4)

Arquivos permitidos (só estes): `src/layout.js`, `test/layout.test.mjs`.

### Interface exata (contrato)
```
Pagina = {largura, altura, margens:{topo,dir,base,esq}} em mm
export const PAGINAS = {A4, A5, mesa}
export function compor(texto, fontes, mao, pagina, opcoes) -> {paginas: Array<Array<traço em mm>>, avisos}
opcoes = {tamanho(mm do em), entrelinha(fator), alinhamento:'esquerda'|'centro'|'justificado'}
traço em mm = Array<[x,y]> com y PARA BAIXO, origem no canto superior esquerdo da página
```
`avisos` = array de strings. `paginas` = array de páginas; cada página = array de traços.

### PAGINAS (valores exatos)
- `A4`: largura 210, altura 297, margens {topo:20, dir:20, base:20, esq:20}
- `A5`: largura 148, altura 210, margens {topo:15, dir:15, base:15, esq:15}
- `mesa`: largura 210, altura 210, margens {topo:15, dir:15, base:15, esq:15}
Página personalizada = qualquer objeto `{largura, altura, margens}` passado a `compor` (nada a registrar).

### Algoritmo (siga exatamente)
Defaults: `opcoes = {}` => `tamanho` 6, `entrelinha` 1.6, `alinhamento` 'esquerda' (preencha o que faltar). `W = largura - margens.esq - margens.dir`. `tol = tamanho * 0.3`.
1. `texto.split('\n')`: cada elemento é uma "linha de entrada". Linha vazia (ou só espaços) = linha em branco: avança uma linha de saída vazia (novo parágrafo), sem texto. Linha não vazia = um parágrafo: palavras = `linha.split(' ').filter(Boolean)`.
2. Contador global de ocorrência por caractere: Map ch -> n. No desenho, para cada letra chame `glifo(fontes, mao, ch, n)` com `n` = número de vezes que `ch` já foi desenhado no texto inteiro (incrementa ao desenhar). Para a MEDIÇÃO use `glifo(fontes, mao, ch, 0)` (só o `adv`). Largura de palavra (mm) = soma de `adv * tamanho` (medido). Largura do espaço = `(glifo(fontes, mao, ' ', 0).adv + mao.espacoPalavra) * tamanho`.
3. Quebra gulosa: acrescente palavras à linha enquanto `larguraLinha + espaço + palavra <= W`. Palavra sozinha com largura > W: quebre por letra (preenche a linha com letras até caber, continua na próxima linha) e adicione ao `avisos` a string `palavra longa quebrada: <palavra>`.
4. Posição vertical: linha `k` da página (k = 0, 1, ... contando também linhas em branco) tem baseline `y = margens.topo + tamanho + k * tamanho * entrelinha + mao.queda * k`. Se o baseline da próxima linha for `> altura - margens.base`, começa nova página (k volta a 0; `queda` recomeça). Linhas em branco no TOPO de uma página nova são ignoradas (não consomem k).
5. Alinhamento (x inicial da linha, `esq = margens.esq`): 'esquerda' => `esq`; 'centro' => `esq + (W - w)/2` onde `w` = largura da linha sem espaço final; 'justificado' => `esq`, e os espaços entre palavras ganham `(W - w)/(nPalavras-1)` extra cada, EXCETO na última linha do parágrafo e em linhas de 1 palavra (essas ficam à esquerda). Linha criada por quebra de letra: trate como uma "palavra" (sem justificar).
6. Desenho: cursor `cx` em mm começa em x inicial; para cada letra: `g = glifo(fontes, mao, ch, n)`; para cada traço de `g.tracos`, cada ponto `[px, py]` (em em, y para cima) vira `[cx + px*tamanho + tx, y - py*tamanho + ty]`; depois `cx += g.adv * tamanho`. Entre palavras `cx += espaço (+extra do justificado)`. Traços de 0 pontos são descartados.
7. Tremor: `const r = rng(mao.seed + '|tremor')` (de `./rng.js`), criado uma vez por chamada de `compor`; `tx = (r()-0.5)*2*mao.tremor`, `ty = (r()-0.5)*2*mao.tremor`, sorteados por ponto na ordem de desenho.
8. `avisos[0]` é sempre a string `tolerancia de limites: <tol> mm` (informa a tolerância). Depois vêm os demais avisos.
9. Texto vazio => `paginas: [[]]` (uma página vazia).
Função pura e determinística: mesma entrada => mesma saída (deepEqual).

### Casos de teste (`test/layout.test.mjs`)
Use fontes reais (`parseFonte` via `fs`, ver trecho acima; use `EMSBird` e `EMSAllure`) e `mao = {...NEUTRA, base:[{fonte:'EMSBird',peso:1}]}`. Para medir, use os pontos em mm. Para agrupar traços por linha, agrupe pelo `y` mínimo do traço com tolerância `tamanho*0.9` (ou calcule a linha pelo baseline esperado).
1. `PAGINAS.A4`/`A5`/`mesa` têm as dimensões exatas; `compor` aceita página personalizada `{largura:100,altura:100,margens:{topo:10,dir:10,base:10,esq:10}}`.
2. Quebra por palavra: texto longo (≥ 40 palavras) em A5 com `tamanho` 6 gera ≥ 2 linhas; nenhum ponto com `x > largura - margens.dir + tol`.
3. Palavra gigante ("a" repetido 200 vezes, sem espaços) em A5: sem exceção, `avisos` contém uma string que começa com `palavra longa quebrada`, e há ≥ 2 linhas.
4. Parágrafo: `"um\n\ndois"` põe "dois" mais abaixo que em `"um\ndois"`; a diferença do y médio dos traços de "dois" entre os dois casos ≈ `tamanho * entrelinha` (tolerância 0.5 mm).
5. Quebra de página: `"linha\n".repeat(100)` em `mesa` gera `paginas.length >= 2`; nenhum ponto da página 1 tem `y > altura - margens.base + tol`.
6. Alinhamentos, com `"ab\nabcd\nabcdef"` em A5, tamanho 6: 'esquerda' => `min x` das 3 linhas iguais entre si (tolerância `tamanho*0.2`); 'centro' => centro `(min+max)/2` de cada linha ≈ centro da área útil (tolerância `tamanho*0.5`); 'justificado' com um parágrafo longo de várias linhas => linhas que não são a última têm `max x` ≈ `largura - margens.dir` (tolerância `tamanho*0.6`).
7. Limites: texto longo em A5 com `tremor: 0.5` e `inclinacao: 15` na mão: nenhum ponto fora de `[esq - tol, largura - dir + tol] x [topo - tol, altura - base + tol]`; `avisos[0]` começa com `tolerancia de limites`.
8. `queda`: com `queda: 2` e 5 linhas (`"l\n"` x 5), a diferença de y entre a 5ª e a 1ª linha é `2*4` mm maior do que com `queda: 0` (tolerância 0.5 mm).
9. Determinismo: duas chamadas iguais => `assert.deepEqual`; seed diferente com `tremor` > 0 => saída diferente.
10. Texto vazio => `paginas.length === 1` e `paginas[0].length === 0`.

Verificação: `node --test test/layout.test.mjs`

### NÃO fazer
Não editar `src/mao.js` nem outros módulos. Não adicionar hifenização, kerning, ligaduras ou outras opções além das 3 de `opcoes`. Não usar DOM. Não importar `personagem.js` (feito em paralelo). Não usar `Math.random`.
