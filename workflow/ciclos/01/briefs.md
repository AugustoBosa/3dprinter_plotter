# Briefs do ciclo 01

Marco alvo: M1 (rng, svgpath). A terceira tarefa (exportar) adianta M5: não depende de nenhum outro módulo.
`src/fonte.js` fica para o ciclo 02 (depende de `parsePath`).
Raiz: `C:\Users\augus\Desktop\augusto\writer`. As pastas `src/` e `test/` já existem e estão vazias.

## Tarefa 01-A — `src/rng.js`

Arquivos permitidos: `src/rng.js`, `test/rng.test.mjs`. Mais nenhum.

Assinaturas (do contrato):
```js
export function rng(seed)   // seed: number | string  -> () => number em [0,1)   (mulberry32)
export function hash(str)   // -> uint32 (FNV-1a 32 bits)
```

Implementação exata:
- `hash(str)`: `x = 2166136261`; para cada `charCodeAt(i)` (i de 0 a length-1): `x ^= code; x = Math.imul(x, 16777619)`; retorna `x >>> 0`.
- `rng(seed)`: se `seed` é string, `a = hash(seed)`; se número, `a = seed >>> 0`. Devolve função que faz (mulberry32):
```js
a = (a + 0x6D2B79F5) | 0;
let t = a;
t = Math.imul(t ^ (t >>> 15), t | 1);
t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
```

Casos de teste (`test/rng.test.mjs`):
1. Mesma seed (número) => mesmos 1000 primeiros valores em duas instâncias.
2. Seed 1 e seed 2 => as 10 primeiras sequências diferem.
3. 10000 valores de `rng(42)`: todos `>= 0` e `< 1`.
4. Seed string: `rng('strahd')` repetível; `rng('strahd')` difere de `rng('kolyan')`.
5. Valores fixos: as três primeiras chamadas de `rng(1)` são `0.6270739405881613`, `0.002735721180215478`, `0.5274470399599522`.
6. `hash('')` = `2166136261`; `hash('a')` = `3826002220`; `hash('foobar')` = `3214735720`.
7. `hash` devolve inteiro em `[0, 2**32)` para uma string com acento (`'ação'`).

Verificação: `node --test test/rng.test.mjs`

NÃO fazer: dependência, classe, estado global, `Math.random`, outros exports.

## Tarefa 01-B — `src/svgpath.js`

Arquivos permitidos: `src/svgpath.js`, `test/svgpath.test.mjs`. Mais nenhum.

Assinatura (do contrato):
```js
export function parsePath(d, tol = 2)  // -> Array<Array<[x,y]>>
```
Converte o atributo `d` de um `<path>` em polilinhas (uma por subcaminho), coordenadas inalteradas (sem inverter Y). Comandos: M L H V C S Q T Z, maiúsculos (absolutos) e minúsculos (relativos). `A`/`a`: aproximar por reta até o ponto final (consumir os 7 números). Curvas achatadas com erro <= `tol` (unidades da própria fonte).

Fatos reais dos dados (vêm de `fontes/*.svg`, não mude nada neles):
- Fontes EMS: `d="M 444 665 L 403 592 L 295 362 L 232 214 M 204 63 L 182 40.9"` (só M e L, com espaços, decimais com ponto, negativos como `-18.9`).
- 21 glifos de cada EMS têm curvas compactas sem espaços, ex.: `M1022 1034.93C1022 1034.93 975.873 937.411 855.921 936.749C...`
- Fonte Relief usa comandos relativos colados: `d="M155 213h367M606 0l-264 675h-4l-268 -675"` e `M182 213h306M45 0l429 670h14M829 10h-341v660h341M488 356h324`.

Tokenizador: use uma regex global `/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g`. Isso lê `h367M606`, `-264 675h-4` e `1.5.5` (= 1.5 e .5) certo. Letras são comandos; o resto são números. Caracteres que não casam (vírgula, espaço) são ignorados.

Regras de semântica:
- Comando repetido implícito: depois de um comando com todos os argumentos, se vierem mais números, repete o comando. Exceção: `M` repetido vira `L` (e `m` vira `l`). Ex.: `M0 0 10 0 10 10` = `M0 0 L10 0 L10 10`.
- Ponto atual `(cx,cy)`; início do subcaminho `(sx,sy)`. Relativos somam ao ponto atual (`h`: só x; `v`: só y). Em `c/s/q/t` relativos, todos os pontos de controle somam ao ponto atual de ANTES do comando.
- `M`: fecha o subcaminho anterior (se tiver >= 2 pontos, entra no resultado) e começa novo com 1 ponto. Subcaminho com só 1 ponto é descartado.
- `Z`/`z`: acrescenta `[sx,sy]` ao subcaminho se o último ponto for diferente; fecha o subcaminho (guarda). O ponto atual volta a `(sx,sy)`. Se vier comando de desenho depois de `Z` sem `M`, começa novo subcaminho em `(sx,sy)`.
- `S`: primeiro controle = reflexo do segundo controle do `C`/`S` anterior em relação ao ponto atual; se o comando anterior não foi `C`/`S`, é o próprio ponto atual. `T`: idem com o controle do `Q`/`T` anterior.
- Achatamento: subdivisão recursiva (de Casteljau, t=0.5). Para um segmento de curva, se a maior distância dos pontos de controle internos à corda (reta entre início e fim) for <= `tol`, emita só o ponto final; senão divida em duas metades e recorra (limite de profundidade 16). Cúbica e quadrática com a mesma ideia. Pontos finais são os dados exatos do `d`, sem arredondar.
- `d` vazio ou só espaços => `[]`.

Casos de teste (`test/svgpath.test.mjs`):
1. `parsePath('M0 0 L10 0 L10 10')` => `[[[0,0],[10,0],[10,10]]]` (deepEqual).
2. `parsePath('M0 0 H10 V5 Z')` => `[[[0,0],[10,0],[10,5],[0,0]]]`.
3. Relativos: `parsePath('m1 1 l2 0 h3 v4')` => `[[[1,1],[3,1],[6,1],[6,5]]]`.
4. Vários subcaminhos: `parsePath('M0 0 L1 1 M5 5 L6 6 L7 5')` => 2 polilinhas, a segunda com 3 pontos.
5. `M` implícito: `parsePath('M0 0 10 0 10 10')` => 1 polilinha com 3 pontos.
6. Relief real: `parsePath('M155 213h367M606 0l-264 675h-4l-268 -675')` => `[[[155,213],[522,213]], [[606,0],[342,675],[338,675],[70,0]]]`.
7. Quadrática: `parsePath('M0 0 Q5 10 10 0', 0.1)`: primeiro ponto `[0,0]`, último `[10,0]` exatos; mais de 3 pontos; todo vértice satisfaz `|y - 2x(1 - x/10)| < 1e-6` (a curva é `y = 2x(1-x/10)` para x em 0..10).
8. Cúbica `M0 0 C0 10 10 10 10 0`: com `tol`=0.01 tem mais vértices que com `tol`=5; ponto final sempre `[10,0]`; com `tol`=0.01 todo vértice tem `y >= 0` e `y <= 7.5001` (altura máxima da curva é 7.5).
9. `S` reflete: `parsePath('M0 0 C0 5 5 5 10 0 S20 -5 20 0', 0.1)`: último ponto `[20,0]`; existe vértice `[10,0]`; algum vértice com `y < 0`.
10. `T` depois de `Q`: `parsePath('M0 0 Q5 10 10 0 T20 0', 0.1)`: último ponto `[20,0]`; algum vértice com `y < 0`.
11. Cúbica compacta: `parsePath('M1022 1034.93C1022 1034.93 975.873 937.411 855.921 936.749')` começa em `[1022,1034.93]` e termina em `[855.921,936.749]`.
12. `parsePath('')` => `[]`. `A` aproximado por reta: `parsePath('M0 0 A5 5 0 0 1 10 0')` => `[[[0,0],[10,0]]]`.
13. Curva relativa: `parsePath('m10 10 q5 10 10 0')`: primeiro `[10,10]`, último `[20,10]`.

Verificação: `node --test test/svgpath.test.mjs`

NÃO fazer: usar `DOMParser`/DOM, importar de outros módulos, arredondar coordenadas, inverter Y, outros exports.

## Tarefa 01-C — `src/exportar.js` (adianta M5)

Arquivos permitidos: `src/exportar.js`, `test/exportar.test.mjs`. Mais nenhum.

Convenções: traço = `Array<[x,y]>` em mm, y PARA BAIXO, origem no canto superior esquerdo. `pagina = {largura, altura, margens?}` em mm (aqui só `largura` e `altura` são usados). Traço com menos de 2 pontos é ignorado em todas as funções.

Assinaturas (do contrato):
```js
export const PERFIL_PADRAO
export function svg(tracos, pagina)                 // -> string
export function otimizar(tracos, tol = 0.1)         // -> tracos
export function gcode(tracos, pagina, perfil)       // -> {texto, avisos, nTracos, comprimento}
```

### PERFIL_PADRAO
```js
export const PERFIL_PADRAO = {
  zEscrita: 3, zLevantada: 6, fDesenho: 2400, fViagem: 6000, fZ: 500,
  offsetX: 0, offsetY: 0, mesaX: 210, mesaY: 210,
  header: "G21\nG91\nG0 Z10 F500\nG90\nM412 S0\nG28 X Y\nG28 Z\nG0 Z6 F500\n",
  footer: "G0 Z15 F500\nG0 X0 Y200 F6000\nM84\n",
};
```
(`header` e `footer` são `document_start` e `document_end` de `arquivo/vpype.toml`; os `\n` acima são quebras de linha reais.)

### gcode(tracos, pagina, perfil = PERFIL_PADRAO)
`perfil` pode ser parcial: use `{...PERFIL_PADRAO, ...perfil}`. Coordenadas de máquina de um ponto `[x,y]`: `X = x + offsetX`, `Y = (pagina.altura - y) + offsetY`. Formate sempre com `.toFixed(3)`.
Texto = `header` + (para cada traço válido) + `footer`. Para um traço com pontos P1..Pn (n >= 2):
```
G0 X{P1.X} Y{P1.Y} F{fViagem}
G1 Z{zEscrita} F{fZ}
G1 X{Pk.X} Y{Pk.Y} F{fDesenho}      <- uma linha para cada P2..Pn
G0 Z{zLevantada} F{fZ}              <- depois da linha de Pn
```
Com os valores padrão isso é `G0 X.. Y.. F6000`, `G1 Z3 F500`, `G1 X.. Y.. F2400`, `G0 Z6 F500`.
- `nTracos` = número de traços válidos. `comprimento` = soma, em mm, dos comprimentos euclidianos dos segmentos desenhados (coordenadas da página, sem offset; viagem não conta).
- `avisos`: array de strings. Para cada traço válido que tenha algum ponto com X fora de `[0, mesaX]` ou Y fora de `[0, mesaY]` (coordenadas de máquina, após offset), adicione UMA string `"traço N fora da mesa"` (N = índice 1-based entre os traços válidos).
- Sem traços: `texto` = `header + footer`.

### svg(tracos, pagina)
String no formato:
`<svg xmlns="http://www.w3.org/2000/svg" width="{largura}mm" height="{altura}mm" viewBox="0 0 {largura} {altura}">` + uma linha `<path d="M x y L x y ..." fill="none" stroke="black" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round"/>` por traço válido + `</svg>`. Números com no máximo 3 decimais, sem zeros finais (`String(+n.toFixed(3))`). Separe as linhas com `\n`.

### otimizar(tracos, tol = 0.1)
Devolve novo array (não altera a entrada; copie os pontos). Passos:
1. Descarte traços com < 2 pontos.
2. Ordene por vizinho mais próximo (guloso): posição inicial da caneta `[0,0]`; repetidamente escolha, entre os traços restantes, o que tem a ponta (início OU fim) mais próxima da posição atual; se a ponta mais próxima for o fim, inverta o traço; posição atual = fim do traço escolhido.
3. Junção: ao adicionar o traço escolhido à saída, se a distância entre o fim do último traço da saída e o início do escolhido (já invertido se preciso) for `<= tol`, funda: acrescente ao último traço os pontos do escolhido sem o primeiro ponto, em vez de abrir um traço novo.

### Casos de teste (`test/exportar.test.mjs`)
1. `PERFIL_PADRAO.header`/`.footer` iguais ao `document_start`/`document_end` de `arquivo/vpype.toml` lidos com `fs` (extraia o valor entre aspas da linha `document_start = "..."`, troque a sequência de duas letras `\n` por quebra de linha real, compare). Também: `fDesenho === 2400`, `fViagem === 6000`, `zEscrita === 3`, `zLevantada === 6`, `fZ === 500`.
2. `gcode([[[10,20],[30,20]]], {largura:210,altura:210}, PERFIL_PADRAO).texto` é exatamente `header + "G0 X10.000 Y190.000 F6000\nG1 Z3 F500\nG1 X30.000 Y190.000 F2400\nG0 Z6 F500\n" + footer` (Y invertido: 210-20=190). `nTracos` 1, `comprimento` 20, `avisos` vazio.
3. O texto começa com o `header` e termina com o `footer`.
4. Offset: perfil `{offsetX:5, offsetY:7}` no caso 2 gera `G0 X15.000 Y197.000 F6000` e `G1 X35.000 Y197.000 F2400`.
5. Traço de 3 pontos `[[0,0],[3,4],[3,10]]` (página 210x210): `nTracos` 1, `comprimento` 11 (5 + 6), exatamente 2 linhas `G1 X` com `F2400`.
6. Dois traços válidos + um traço de 1 ponto: `nTracos` 2, `comprimento` somado; o traço de 1 ponto não aparece no texto.
7. Fora da mesa: traço com ponto `[250,10]` => `avisos.length === 1`; com `offsetX:-50` o mesmo traço não gera aviso; ponto com `y` maior que a altura da página (Y de máquina negativo, offset 0) também avisa.
8. `svg` com página `{largura:210,altura:297}`: contém `width="210mm"`, `height="297mm"`, `viewBox="0 0 210 297"`; nº de `<path` igual ao nº de traços válidos (2 traços + 1 de um ponto => 2); para o traço `[[1,2],[3.5,4]]` o `d` contém `M 1 2 L 3.5 4`; começa com `<svg` e termina com `</svg>`.
9. `otimizar` funde traços que se tocam: `[[[0,0],[10,0]], [[10,0.05],[20,0]]]` (tol 0.1) => `length === 1`, primeiro ponto `[0,0]`, último `[20,0]`, 3 pontos.
10. `otimizar` inverte quando útil: `[[[100,0],[50,0]], [[0,0],[40,0]]]` => 2 traços; o primeiro começa em `[0,0]`; o segundo começa em `[50,0]` (invertido, termina em `[100,0]`).
11. Viagem não aumenta: com 4 traços embaralhados `[[[100,0],[110,0]], [[0,0],[10,0]], [[50,0],[60,0]], [[20,0],[30,0]]]`, defina no teste `viagem(tracos)` = soma das distâncias entre o fim de cada traço e o início do seguinte, começando em `[0,0]`; confira `viagem(otimizar(x)) <= viagem(x)` e que a viagem otimizada seja `< ` a original (no caso fixo a original é 100+110+... calcule no teste, não digite o número).
12. `otimizar` não muta a entrada (compare `JSON.stringify` antes/depois) e descarta traços de 1 ponto.

Verificação: `node --test test/exportar.test.mjs`

NÃO fazer: DOM, importar outros módulos, `fs` dentro de `src/exportar.js` (só o teste usa `fs`), ler `vpype.toml` em tempo de execução, 2-opt ou outra otimização além da descrita, outros exports.
