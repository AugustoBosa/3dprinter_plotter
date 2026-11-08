# Briefs do ciclo 02

Marco alvo: M1 (falta `parseFonte`) e, em paralelo, M2 (`mao.js`), que só depende do FORMATO `Fonte`, não de `fonte.js`.
Raiz: `C:\Users\augus\Desktop\augusto\writer`. Já existem `src/rng.js` (`rng`, `hash`), `src/svgpath.js` (`parsePath`) e `src/exportar.js`. NÃO os edite.
As duas tarefas não tocam o mesmo arquivo. `mao.js` NÃO importa `fonte.js`; os testes de `mao.js` usam fontes sintéticas escritas à mão no próprio teste.

## Tarefa 02-A — `src/fonte.js`

Arquivos permitidos: `src/fonte.js`, `test/fonte.test.mjs`. Mais nenhum.

Assinaturas (do contrato):
```js
import { parsePath } from './svgpath.js';
export function parseFonte(svgText, nome)   // -> Fonte
export const FONTES = [...]                 // 11 nomes (sem extensão)
// Fonte = {nome, upm, ascent, descent, advPadrao, glifos: {[ch]: {adv, tracos: Array<Array<[x,y]>>}}}   (y para cima, unidades da fonte)
```
`FONTES` exato, nesta ordem:
`['EMSAllure','EMSBird','EMSBirdSwashCaps','EMSDecorousScript','EMSDelight','EMSDelightSwashCaps','EMSInvite','EMSLittlePrincess','EMSMistyNight','EMSSociety','ReliefSingleLineSVG-Regular']`
(arquivos em `fontes/<nome>.svg`).

Fatos reais dos arquivos (SVG Font; NÃO usar DOMParser; só regex; y já é para cima, NÃO inverter y):
EMS (10 fontes), cabeçalho e glifos:
```
<font id="EMSAllure" horiz-adv-x="378" >
<font-face
font-family="EMS Allure"
units-per-em="1000"
ascent="800"
descent="-200"
...
/>
<missing-glyph horiz-adv-x="378" />
<glyph unicode=" " glyph-name="space" horiz-adv-x="378" />
<glyph unicode="!" glyph-name="exclam" horiz-adv-x="359" d="M 444 665 L 403 592 L 295 362 L 232 214 M 204 63 L 182 40.9" />
<glyph unicode="&#x22;" glyph-name="quotedbl" horiz-adv-x="302" d="M 94.5 548 L 78.8 403 M 233 548 L 211 400" />
<glyph unicode="&#xe1;" glyph-name="aacute" horiz-adv-x="526" d="M 495 183 L 457 132 ..." />
```
Relief (1 fonte; atributos em outra ordem, o `d` fica numa linha própria, comandos compactos; 143 glifos NÃO têm `unicode` (como `.notdef`) e devem ser ignorados; `<font-face` tem `ascent="800"` e `descent="-200"`; `<font ... horiz-adv-x="280">`):
```
<font id="ReliefSingleLineSVG-Regular" horiz-adv-x="280" >
  <font-face 
    font-family="Relief SingleLine SVG"
    units-per-em="1000"
    ascent="800"
    descent="-200"
    x-height="545"
    cap-height="680"
  />
    <glyph glyph-name="A" unicode="A" horiz-adv-x="676" 
d="M155 213h367M606 0l-264 675h-4l-268 -675" />
    <glyph glyph-name="space" unicode=" " horiz-adv-x="320" 
 />
```
Implementação:
- `upm` = número de `units-per-em="..."`; `ascent` = `\sascent="(-?[\d.]+)"` e `descent` = `\sdescent="(-?[\d.]+)"` (exija espaço/quebra antes, para não pegar `cap-height`/`x-height`); se faltar, `800` e `-200`. `advPadrao` = `horiz-adv-x` da tag `<font ...>` (regex `/<font\s[^>]*?horiz-adv-x="([\d.]+)"/`), senão `upm/2`.
- Glifos: `svgText.matchAll(/<glyph\b([^>]*?)\/?>/gs)` (o `s` porque a tag pode ter quebra de linha). Dentro dos atributos: `unicode` = `/\sunicode="([^"]*)"/`; `adv` = `/\shoriz-adv-x="([\d.]+)"/` (senão `advPadrao`); `d` = `/\sd="([^"]*)"/` (exija espaço/quebra antes de `d`); `tracos = d ? parsePath(d) : []`.
- Ignore glifo sem atributo `unicode` ou com unicode vazio. Se o mesmo `ch` aparecer duas vezes, vale o primeiro.
- Decodifique o valor de `unicode` com UMA passada `replace(/&(#x[0-9a-f]+|#\d+|amp|quot|lt|gt|apos);/gi, ...)`: `#xNN` hexadecimal e `#NN` decimal via `String.fromCodePoint`; `&amp;`→`&`, `&quot;`→`"`, `&lt;`→`<`, `&gt;`→`>`, `&apos;`→`'`. (Os arquivos usam `&apos;` e `&amp;` de verdade.) A chave em `glifos` é a string decodificada.
- Retorne `{nome, upm, ascent, descent, advPadrao, glifos}`; números com `Number(...)`. Não filtre os traços que `parsePath` devolve.

Casos de teste (`test/fonte.test.mjs`), lendo os arquivos reais com `fs.readFileSync(new URL('../fontes/'+n+'.svg', import.meta.url), 'utf8')`:
1. `FONTES.length === 11` e cada `fontes/<nome>.svg` existe.
2. Para cada uma das 11: `parseFonte` ok, `upm > 0`, `Object.keys(glifos).length >= 60`, `nome` igual ao passado.
3. Para cada uma das 10 EMS (nome começa com `EMS`): `á ã ç é ê õ` existem em `glifos` com `tracos.length >= 1`.
4. Para cada uma das 11: `glifos[' ']` existe com `adv > 0` e `tracos.length === 0`.
5. Decodificação (SVG sintético em string): `unicode="&#x22;"`→`'"'`, `unicode="&#65;"`→`'A'`, `unicode="&amp;"`→`'&'`, `unicode="&lt;"`→`'<'`, `unicode="&apos;"`→`"'"`, `unicode="&quot;"`→`'"'`.
6. SVG sintético: glifo sem `unicode` é ignorado; glifo com `d` em linha separada (quebra de linha antes de `d=`) é lido; glifo sem `horiz-adv-x` usa `advPadrao` da tag `<font>`; duplicata: vale o primeiro.
7. Valor real: em `EMSAllure`, `glifos['!']` tem `adv === 359`, `tracos.length === 2` e `tracos[0][0]` igual a `[444, 665]`. Em `ReliefSingleLineSVG-Regular`, `glifos['A'].adv === 676` e `tracos.length === 2`.

Verificação: `node --test test/fonte.test.mjs`

NÃO fazer: DOMParser, dependência, inverter y, normalizar por `upm` (isso é do `mao.js`), editar `fontes/`, outros exports além de `parseFonte` e `FONTES`.

## Tarefa 02-B — `src/mao.js`

Arquivos permitidos: `src/mao.js`, `test/mao.test.mjs`. Mais nenhum. Importa só `./rng.js` (`import { rng, hash } from './rng.js'`). NÃO importa `fonte.js`.

Assinaturas (do contrato):
```js
export const IDENTIDADE = ['base','seed','inclinacao','largura','altura','espacamento','espacoPalavra','idio'];
export const EXECUCAO   = ['pressa','capricho','tremor','queda','compressao','variacao','desleixo'];
export const NEUTRA = {...};
export function glifo(fontes, mao, ch, ocorrencia)   // -> {adv, tracos}   em em (1 em = 1.0), y para cima
export function misturar(glifoA, glifoB, t)          // -> glifo | null
export function mutar(mao, seed, forca)              // -> Mao nova (muda só IDENTIDADE)
```
Tipos:
- `Fonte = {nome, upm, ascent, descent, advPadrao, glifos: {[ch]: {adv, tracos: Array<Array<[x,y]>>}}}` em unidades da fonte (y para cima).
- `fontes` (1º argumento de `glifo`) é um OBJETO `{[nome]: Fonte}`. Cada item de `mao.base` é `{fonte: nome, peso}`; `fontes[item.fonte]` pode não existir (ignore).
- `Mao = {base:[{fonte,peso}], seed, inclinacao(graus), largura, altura, espacamento(em), espacoPalavra(em), idio(0-1), pressa(0-1), capricho(0-1), tremor(mm), queda(mm/linha), compressao(fator), variacao(0-1), desleixo(0-1)}`.
- `NEUTRA = {base: [], seed: 0, inclinacao: 0, largura: 1, altura: 1, espacamento: 0, espacoPalavra: 0, idio: 0, pressa: 0, capricho: 1, tremor: 0, queda: 0, compressao: 1, variacao: 0, desleixo: 0}`. Os testes usam `{...NEUTRA, base:[{fonte:'F', peso:1}]}`.
- `tremor`, `queda` e `espacoPalavra` NÃO são usados em `glifo` (são do `layout.js`, ciclo futuro). `espacamento` entra no `adv` (veja abaixo).

### misturar(glifoA, glifoB, t)  (glifo = {adv, tracos}, já em em)
- Se `glifoA.tracos.length !== glifoB.tracos.length` devolve `null`.
- `t === 0`: devolve cópia profunda de A. `t === 1`: cópia profunda de B (sem reamostrar).
- Senão: cada traço de A e de B é reamostrado em N = 32 pontos igualmente espaçados por comprimento de arco, incluindo extremos (traço de comprimento total 0 ou com 1 ponto: 32 cópias do ponto). Resultado: traço i = ponto a ponto `(1-t)*a + t*b`; `adv = (1-t)*A.adv + t*B.adv`. Dois glifos sem traços (ex. espaço) dão `{adv interpolado, tracos: []}`.

### glifo(fontes, mao, ch, ocorrencia)
1. Candidatas: itens de `mao.base` com `fontes[fonte]?.glifos[ch]` existindo (o espaço conta: existe com 0 traços). Converta cada candidata para em: cada x, y e `adv` divididos por `fontes[fonte].upm` (cópia nova; não mute a fonte).
2. Nenhuma candidata: devolva `{adv, tracos: []}` com `adv` = `advPadrao/upm` da PRIMEIRA fonte de `mao.base` que exista em `fontes`, ou `0.4` se nenhuma existir. Esse `adv` é puro (sem passos 4 e 5), sem exceção.
3. Uma candidata: use-a. Várias: pesos `peso` (peso total 0: use a primeira). Tente misturar acumulando: `g = c0; acc = p0; para i>=1: g = misturar(g, ci, pi/(acc+pi)); acc += pi`. Se algum `misturar` der `null` (nº de traços diferente): ABANDONE a mistura e escolha UMA candidata por `u = (hash(ch + mao.seed) % 10000) / 10000` contra os pesos acumulados normalizados (a primeira candidata cujo peso acumulado normalizado `> u`; se nenhuma, a última).
4. Identidade (não depende de `ocorrencia`): `r = rng(mao.seed + '|' + ch + '|idio')`; sorteie NESTA ordem `sx = 1 + (r()-0.5)*mao.idio*0.2`, `sy = 1 + (r()-0.5)*mao.idio*0.2`, `dx = (r()-0.5)*mao.idio*0.1`, `dy = (r()-0.5)*mao.idio*0.1`. Para cada ponto: `x = x*sx + dx`, `y = y*sy + dy`; `adv *= sx`. Depois `x *= mao.largura`, `y *= mao.altura`, `adv *= mao.largura`. Depois inclinação: `x += y * Math.tan(mao.inclinacao * Math.PI/180)`.
5. Execução (depende de `ocorrencia`, inteiro): `r = rng(mao.seed + '|' + ch + '|' + ocorrencia)`; sorteie NESTA ordem `ex = 1 + (r()-0.5)*mao.variacao*0.2`, `ey = 1 + (r()-0.5)*mao.variacao*0.2`, `ox = (r()-0.5)*mao.variacao*0.08`, `oy = (r()-0.5)*mao.variacao*0.08`. Para cada ponto: `x = x*ex + ox`, `y = y*ey + oy`. Depois `pressa`: `x += y*0.3*mao.pressa`. Depois `desleixo`: `amp = mao.desleixo*0.03*(1-mao.capricho)`; para cada ponto, na ordem dos traços e pontos, `x += (r()-0.5)*2*amp`, `y += (r()-0.5)*2*amp` (dois `r()` por ponto; sempre consuma, mesmo com `amp = 0`). Por fim `adv = adv * ex * mao.compressao * (1 - 0.2*mao.pressa) + mao.espacamento`, e `adv = Math.max(0, adv)`.
6. Com `NEUTRA` + 1 fonte, a saída é exatamente os pontos da fonte divididos por `upm` (tolerância 1e-6) e `adv/upm`.
Nunca mute `fontes` nem `mao`.

### mutar(mao, seed, forca)
`m = structuredClone(mao)` (JSON puro). `r = rng(seed)`; `j = () => (r()-0.5)*2` (em [-1,1)). Nesta ordem:
`m.seed = Math.floor(r()*2147483647)`; `m.inclinacao += j()*forca*10`; `m.largura *= 1 + j()*forca*0.2`; `m.altura *= 1 + j()*forca*0.2`; `m.espacamento += j()*forca*0.05`; `m.espacoPalavra += j()*forca*0.05`; `m.idio = clamp(m.idio + j()*forca*0.3, 0, 1)`; para cada item de `m.base` na ordem: `peso = Math.max(0.01, peso*(1 + j()*forca*0.5))`. NENHUMA chave de `EXECUCAO` muda. Mesmo `(mao, seed, forca)` dá mesma saída. Não muta a entrada.

Casos de teste (`test/mao.test.mjs`) com fontes SINTÉTICAS definidas no teste:
```js
const F = { nome:'F', upm:1000, ascent:800, descent:-200, advPadrao:500, glifos:{
  a:{adv:600, tracos:[[[0,0],[100,200],[200,0]]]},
  b:{adv:700, tracos:[[[0,0],[0,500]],[[0,500],[300,500],[300,250]]]},
  ' ':{adv:300, tracos:[]} } };
const G = { nome:'G', upm:2000, ascent:1600, descent:-400, advPadrao:1000, glifos:{
  a:{adv:1200, tracos:[[[0,100],[200,300],[400,100]]]},   // 1 traço, compatível com F.a
  b:{adv:1400, tracos:[[[0,0],[0,1000]]]} } };             // 1 traço, INCOMPATÍVEL com F.b (2 traços)
const fontes = {F, G};
```
1. Determinismo: mesma mão (`idio` 0.5, `variacao` 0.5) + mesma ocorrência dá `deepEqual`; `seed` diferente (com `idio` 0.5) dá saída diferente.
2. `NEUTRA` com base `[{fonte:'F',peso:1}]`: traços de `'a'` e `'b'` iguais aos de F divididos por 1000 (|diferença| < 1e-6), `adv` 0.6 e 0.7; para `'a'` com G sozinha, divididos por 2000.
3. `idio` 0.8, `variacao` 0: ocorrências 0, 1 e 7 dão saída idêntica entre si (`deepEqual`) e diferente da saída com `idio` 0. Com `variacao` 0.8, `idio` 0: ocorrências 0 e 1 de `'a'` diferem.
4. `misturar`: `(A,B,0)` deepEqual A; `(A,B,1)` deepEqual B; `(A,B,0.5)` com A=`{adv:1,tracos:[[[0,0],[1,0]]]}` e B=`{adv:3,tracos:[[[0,1],[1,1]]]}`: `adv` 2, 32 pontos, todos com `y` ≈ 0.5, primeiro `x` ≈ 0 e último `x` ≈ 1; nº de traços diferente dá `null`.
5. Base com `F` e `G` (pesos 1 e 1) para `'a'`: resultado tem 1 traço de 32 pontos (mistura). Para `'b'` (incompatível): resultado é exatamente o `glifo` de F sozinha OU de G sozinha, é o MESMO em duas chamadas, e a escolha acompanha `hash('b'+seed)` (teste: ache duas seeds numéricas entre 0 e 200 que escolhem fontes diferentes e confira que as saídas diferem).
6. `mutar(m, 5, 0.5)`: chaves de EXECUCAO iguais às de `m`; pelo menos `seed` e `inclinacao` mudam; mesma entrada dá mesma saída; a entrada `m` não foi alterada (deepEqual com cópia feita antes); `JSON.parse(JSON.stringify(m2))` deepEqual `m2` e `glifo(fontes, reloaded, 'a', 0)` deepEqual `glifo(fontes, m2, 'a', 0)`.
7. Caractere ausente (`'ç'` em F e G): sem exceção, `tracos` `[]`, `adv` 0.5 (advPadrao 500/upm 1000 da primeira fonte da base).

Verificação: `node --test test/mao.test.mjs`

NÃO fazer: importar `fonte.js`, DOMParser, `Math.random`, aplicar `tremor`/`queda`/`espacoPalavra` aqui, outros exports, alterar as fórmulas acima (são o contrato de comportamento; se algo for impossível, pare e explique).
