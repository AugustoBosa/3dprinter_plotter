# Briefs do ciclo 05 (Fase 2: M7, M8, M9)

Ordem: LOTE 1 (05-A, 05-B, 05-C em paralelo) -> LOTE 2 (05-D, 05-E, 05-F em paralelo). Nenhum arquivo aparece em dois workers do mesmo lote.
`src/catalogo.js` é só leitura (escrito pelo usuário). Não editar.
Exceção ao WORKER.md: arquivos `src/ui-*.js` e `src/ajuda.js` podem usar `document` (só dentro de funções, nunca no topo do módulo, para o `import` no Node não quebrar).

## Contrato compartilhado de ajuda (vale para todas as tarefas)

`src/ajuda.js` exporta:

```js
export const AJUDA   = { [chave]: 'texto de ajuda' };
export const ROTULOS = { [chave]: 'rótulo legível' };
export function rotulo(chave)            // ROTULOS[chave] ?? chave
export function ajuda(chave, texto)      // devolve o elemento <span class="ajuda" tabindex="0" data-ajuda="..." role="note">?</span>
                                         // texto padrão = AJUDA[chave]; se `texto` for passado, usa ele (o catálogo usa isso, com chave undefined)
                                         // lança Error se não houver texto nenhum
```

Chaves de AJUDA e ROTULOS (as mesmas listas nos dois objetos), nomes EXATOS:

- IDENTIDADE: `base seed inclinacao largura altura espacamento espacoPalavra idio`
- EXECUCAO: `pressa capricho tremor queda compressao variacao desleixo`
- Personagem/Fontes: `personagem variacaoSel peso mutarSeed mutarForca` (`personagem` = escolher/salvar/abrir personagens; `variacaoSel` = o seletor de variação; `base` = lista de fontes da mão e mistura; `seed` = seed da mão)
- Texto/Página: `texto pagina larguraPagina alturaPagina margemTopo margemDir margemBase margemEsq tamanho entrelinha alinhamento comparar`
- Exportar: `offsetX offsetY zEscrita zLevantada fDesenho fViagem fZ mesaX mesaY header footer otimizar`

Uso padrão em UI (para o grid dos sliders não quebrar, texto + "?" ficam num único `<span>`):

```js
import { rotulo, ajuda } from './ajuda.js';
const t = document.createElement('span');
t.append(rotulo(chave), ' ', ajuda(chave));
```
Para `<label>` comum: `l.append(rotulo(chave), ' ', ajuda(chave), ' ', controle)`.
Para títulos `<h3>`: `h.append('Texto ', ajuda(chave))` quando houver chave que cubra o bloco.

CSS da classe `.ajuda` (colado em `index.html` pela tarefa 05-D; os outros arquivos NÃO escrevem CSS dela):
círculo de 16px; tooltip por `::after` com `content: attr(data-ajuda)`, largura fixa 220px, abre ABAIXO do círculo, visível em `:hover` e `:focus`; variável `--dx` (definida em JS por `ajuda()` no mouseenter/focus) desloca o tooltip para não vazar do painel.

Teclado: o `?` tem `tabindex="0"`, então o foco mostra o tooltip.

---

## Tarefa 05-A — `src/ajuda.js` + `test/ajuda.test.mjs`

Arquivos permitidos: criar `src/ajuda.js`, `test/ajuda.test.mjs`. Só esses.

Implemente o contrato acima.

`ajuda(chave, texto)`:
```js
export function ajuda(chave, texto = AJUDA[chave]) {
  if (!texto) throw new Error('sem texto de ajuda: ' + chave);
  const el = document.createElement('span');
  el.className = 'ajuda';
  el.tabIndex = 0;
  el.setAttribute('role', 'note');
  el.dataset.ajuda = texto;
  el.textContent = '?';
  const posicionar = () => {
    // tooltip: 220px de largura, centrado no "?"; empurra para dentro do contêiner (.esquerda ou dialog) ou da janela
    const r = el.getBoundingClientRect();
    const c = el.closest('.esquerda, dialog')?.getBoundingClientRect() ?? { left: 0, right: innerWidth };
    const centro = r.left + r.width / 2;
    const esq = Math.max(c.left + 4, Math.min(centro - 110, c.right - 4 - 220));
    el.style.setProperty('--dx', esq - (centro - 110) + 'px');
  };
  el.addEventListener('mouseenter', posicionar);
  el.addEventListener('focus', posicionar);
  return el;
}
```
(`document`/`innerWidth` só são usados dentro da função: o `import` no Node não pode falhar.)

TEXTOS — o mais importante. São para usuário final, que não sabe o que é "tremor" ou "idio". Regras:
- pt-BR simples, frases curtas (máx. ~25 palavras por frase), sem jargão, sem inglês, sem chaves cruas no texto.
- Cada texto de AJUDA tem 1 a 3 frases e diz: (1) o que a opção faz, (2) a faixa de valores (use os números reais abaixo), (3) o efeito visível na letra (ex.: "0 = reta; valores positivos deitam a letra para a direita").
- Máximo 220 caracteres por texto.
- Rótulos (ROTULOS): curtos, minúsculos, em português, ex. `espacoPalavra: 'espaço entre palavras'`, `inclinacao: 'inclinação (graus)'`, `idio: 'idiossincrasia'` (explique na ajuda: "o quanto cada letra tem um defeito próprio, sempre o mesmo, que dá personalidade à mão").

Fatos das opções (faixas dos sliders da UI e significado real no código):
- `base`: fonte(s) que formam a letra. Com mais de uma, as letras são misturadas conforme os pesos (só funciona bem entre fontes da mesma família).
- `seed`: número inteiro; mesma seed = mesma mão. Trocar a seed muda os defeitos próprios de cada letra.
- `inclinacao`: -30 a 30 graus; positivo deita a letra para a direita.
- `largura`: 0.5 a 1.5; fator horizontal da letra (1 = original).
- `altura`: 0.5 a 1.5; fator vertical da letra (1 = original).
- `espacamento`: -0.2 a 0.3 em "em" (1 em = tamanho da letra); soma espaço depois de cada letra; negativo aperta.
- `espacoPalavra`: 0 a 0.6 em; espaço extra entre palavras.
- `idio`: 0 a 1; defeito próprio fixo de cada letra (identidade da mão).
- `pressa`: 0 a 1; letra mais corrida, traços menos cuidadosos, mais inclinada para a frente.
- `capricho`: 0 a 1; 1 = letra no melhor da mão; menor = mais relaxada e menos precisa.
- `tremor`: 0 a 2 mm; tremida na linha. 0 = sem tremor.
- `queda`: -2 a 2 mm por linha; cada linha desce (positivo) ou sobe (negativo) um pouco mais que a anterior.
- `compressao`: 0.6 a 1.4; fator no espaço entre letras (menor = letras mais coladas).
- `variacao`: 0 a 1; o quanto a mesma letra muda cada vez que aparece (0 = sempre igual).
- `desleixo`: 0 a 1; letras tortas, linha que balança, tamanhos irregulares.
- `personagem`: cada personagem guarda uma mão (identidade) e variações de humor. Você pode criar, salvar na página (navegador), abrir e excluir; também Salvar/Abrir arquivo JSON.
- `variacaoSel`: o "humor" ou situação (formal, apressado, raiva...). Muda só o jeito de escrever, não a mão.
- `peso`: 0 a 1; importância da fonte na mistura.
- `mutarSeed`: número que sorteia a mutação; o mesmo número dá sempre o mesmo resultado.
- `mutarForca`: 0 a 1; quanto a mutação altera a mão (identidade).
- `texto`: o que será escrito. Linha em branco separa parágrafos.
- `pagina`: formato do papel (A4, A5, mesa da plotter 210x210, ou personalizada).
- `larguraPagina`, `alturaPagina`: tamanho da folha em mm.
- `margemTopo`, `margemDir`, `margemBase`, `margemEsq`: espaço em branco em mm entre a borda e o texto.
- `tamanho`: 3 a 15 mm; altura de uma letra "em"; define o tamanho de toda a letra.
- `entrelinha`: 1 a 3; distância entre linhas (1 = colado, 1.6 = confortável).
- `alinhamento`: esquerda, centro ou justificado (estica o espaço para as linhas terminarem na margem).
- `comparar`: mostra duas variações do mesmo personagem lado a lado.
- `offsetX`, `offsetY`: distância em mm da ponta da caneta até a posição que a impressora acha que está; corrige onde o desenho cai na mesa.
- `zEscrita`: altura Z (mm) com a caneta tocando o papel. `zLevantada`: altura Z com a caneta no ar, ao se deslocar.
- `fDesenho`: velocidade (mm/min) enquanto escreve; `fViagem`: velocidade com a caneta levantada; `fZ`: velocidade de subir/descer a caneta.
- `mesaX`, `mesaY`: tamanho útil da mesa em mm; o programa avisa se o desenho sai dela.
- `header`, `footer`: comandos G-code colocados no começo e no fim do arquivo (aquecer/zerar eixos, estacionar).
- `otimizar`: reordena os traços para a caneta andar menos no ar. Não muda o desenho.

Teste `test/ajuda.test.mjs` (node:test; import de `IDENTIDADE`, `EXECUCAO` de `../src/mao.js` e de `AJUDA`, `ROTULOS`, `rotulo` de `../src/ajuda.js`):
1. toda chave de IDENTIDADE e de EXECUCAO tem texto não vazio (trim) em AJUDA e rótulo não vazio em ROTULOS;
2. todas as chaves da lista do contrato acima existem em AJUDA e em ROTULOS (copie a lista no teste);
3. AJUDA e ROTULOS têm exatamente as mesmas chaves;
4. nenhum texto de AJUDA passa de 220 caracteres e nenhum rótulo é igual à sua chave crua, exceto se a chave já for uma palavra comum (`texto`, `pagina`, `tamanho`, `entrelinha`, `alinhamento`, `comparar`, `header`, `footer`, `personagem`, `peso`, `seed`, `base`, `largura`, `altura`, `capricho`, `tremor`, `queda`, `compressao`, `variacao`, `desleixo`, `pressa`) — ou seja: ROTULOS não pode conter nenhuma chave camelCase crua como `espacoPalavra`;
5. `rotulo('espacoPalavra')` devolve o rótulo e `rotulo('xyz')` devolve `'xyz'`;
6. `ajuda('xyz')` sem texto lança erro (antes de tocar `document`) — chamando `() => ajuda('xyz')` o `assert.throws` deve passar.

Verificação: `node --test test/ajuda.test.mjs`.
NÃO FAZER: CSS, DOM no topo do módulo, mexer em outros arquivos, texto com mais de 220 caracteres, jargão.

---

## Tarefa 05-B — `src/ui-catalogo.js` + `test/catalogo.test.mjs`

Arquivos permitidos: criar `src/ui-catalogo.js` e `test/catalogo.test.mjs`. NÃO editar `src/catalogo.js` (só importar). `src/ajuda.js` está sendo escrito em paralelo por outro worker: importe `{ ajuda } from './ajuda.js'` conforme o contrato acima (se não existir ainda quando você testar, só rode o teste do catálogo; o `node --check` de ui-catalogo basta).

Dados (leia `src/catalogo.js`): `EIXOS` (5 chaves: registro, capricho, ornamento, legibilidade, velocidade; cada `{nome, min, max, ajuda}`), `ARQUETIPOS` (6 chaves: nobre, erudito, escriba, pratico, popular, teatral; cada `{nome, ajuda}`), `CATALOGO` = array de `{fonte, familia, ligacao, metricas, eixos:{...1..5}, aptidao:{...0..3}, descricao}`. `FONTES` vem de `./fonte.js`. Exemplo real de linha:
`{ fonte: 'EMSAllure', familia: 'Allure', ligacao: 'cursiva', eixos: { registro: 4, capricho: 3, ornamento: 3, legibilidade: 4, velocidade: 4 }, aptidao: { nobre: 2, erudito: 2, escriba: 2, pratico: 1, popular: 0, teatral: 2 }, descricao: '...' }`.

### test/catalogo.test.mjs (node:test + assert/strict; imports de `../src/catalogo.js` e `../src/fonte.js`)
1. todo nome de `FONTES` tem exatamente uma entrada em `CATALOGO` e toda entrada de `CATALOGO` está em `FONTES` (sem duplicatas);
2. cada `eixos` tem exatamente as chaves de `EIXOS`, valores inteiros de 1 a 5;
3. cada `aptidao` tem exatamente as chaves de `ARQUETIPOS`, valores inteiros de 0 a 3;
4. `ligacao` ∈ {cursiva, semi, forma, titulo}; `familia` e `descricao` strings não vazias; todo `EIXOS[k]` tem nome/min/max/ajuda não vazios e todo `ARQUETIPOS[k]` tem nome/ajuda não vazios;
5. fontes da mesma `familia` têm a mesma `ligacao`.
Verificação: `node --test test/catalogo.test.mjs`.

### src/ui-catalogo.js (DOM só dentro de funções)

```js
export function abrirCatalogo(estado, aoMudar)   // abre o <dialog> modal com a tabela
```
Comportamento:
- Cria (uma vez) `<dialog id="catalogo-fontes">` em `document.body`, mais um `<style>` próprio injetado uma vez no `document.head` (id `estilo-catalogo`) com o CSS do diálogo e da tabela (esta tarefa é dona desse CSS; index.html não tem). A cada abertura reconstrói o conteúdo (para refletir `estado.fontes`) e chama `showModal()`. Botão "Fechar" e fechar ao clicar no fundo (`click` com `e.target === dialog`).
- Largura do diálogo ~ min(1100px, 96vw), altura máx. 90vh com rolagem.
- Topo: `<select>` "Filtrar por tipo de escritor" com opção "(sem filtro)" + os 6 arquétipos (texto `ARQUETIPOS[k].nome`), ao lado `ajuda(undefined, ARQUETIPOS[k].ajuda)` do arquétipo selecionado não é necessário; e `<select>` "Ordenar por" com "(ordem original)", os 5 eixos (nome do eixo, decrescente) e "ligação"? NÃO — só original + 5 eixos.
- Tabela, uma linha por fonte, colunas: Amostra | Família | Ligação | 5 colunas de eixos (cabeçalho = `EIXOS[k].nome` + `ajuda(undefined, EIXOS[k].ajuda)`; célula = `●` repetido nota vezes e `○` até 5, com `title` = `${min} … ${max}`) | 6 colunas de aptidão (cabeçalho = `ARQUETIPOS[k].nome` + `ajuda(undefined, ARQUETIPOS[k].ajuda)`; célula = `★` repetido aptidão vezes, vazio se 0) | Descrição | Ações.
- Amostra: um `<svg>` com a frase `Prezado Senhor, ação!` na própria fonte, montado assim: `import { glifo, NEUTRA } from './mao.js'`; `const mao = { ...NEUTRA, base: [{ fonte, peso: 1 }] }`; para cada caractere `ch` na frase (índice de ocorrência = contagem prévia de `ch` na frase) `g = glifo(estado.fontes, mao, ch, ocorrencia)`; os traços de `g.tracos` estão em em com y PARA CIMA, então cada ponto vira `[x0 + x, -y]`, `x0` acumula `g.adv`; cada traço vira um `<polyline fill="none" stroke="currentColor" stroke-width="0.04" stroke-linecap="round" stroke-linejoin="round">`. `viewBox` = `"0 -1 ${xTotal} 1.6"` (ajuste: y de -0.9 a 0.5 cobre a maioria), `height` 40px, largura proporcional. Se `estado.fontes[fonte]` não existir, mostre o nome em texto. Criar SVG com `document.createElementNS('http://www.w3.org/2000/svg', ...)`.
- Filtro por arquétipo `a`: ordena por `aptidao[a]` decrescente (estável) e destaca (classe `apta`, fundo verde claro) as linhas com `aptidao[a] >= 2`. Sem filtro e sem ordenação = ordem de `CATALOGO`. Ordenação por eixo `k`: `eixos[k]` decrescente (estável). Se há filtro E ordenação por eixo: ordena pelo eixo, mantendo o destaque do filtro. Mudar qualquer um dos dois selects reconstrói só o `<tbody>`.
- Ações por linha: botão "Usar": `estado.personagem.mao.base = [{ fonte, peso: 1 }]`; botão "Misturar": se a fonte já está em `mao.base`, define seu `peso = 0.5`, senão `mao.base.push({ fonte, peso: 0.5 })`. Os dois chamam `aoMudar()` e fecham o diálogo (`dialog.close()`).
- Nada de dependências. Sem `innerHTML` com texto vindo do catálogo (use `textContent`).
Verificação: `node --check src/ui-catalogo.js` e `node --test test/catalogo.test.mjs`.
NÃO FAZER: editar `src/catalogo.js`, `index.html` ou outros `ui-*.js`; criar CSS fora do `<style>` injetado; trazer biblioteca.

---

## Tarefa 05-C — `src/personagem.js` + testes sem presets

Arquivos permitidos: editar `src/personagem.js`, `test/personagem.test.mjs`, `test/espacamento.test.mjs`. Só esses. NÃO apagar a pasta `personagens/` (o gerente apaga depois).

Em `src/personagem.js` acrescente (sem mudar `resolver` nem `validar`):

```js
import { NEUTRA, EXECUCAO } from './mao.js';   // já importa

// Personagem em branco: NEUTRA sobre EMSDelight, variação 'normal' vazia.
export function novoPersonagem(nome = 'Novo personagem') {
  return { nome, mao: { ...structuredClone(NEUTRA), base: [{ fonte: 'EMSDelight', peso: 1 }] }, variacoes: { normal: {} } };
}

// Grava `valor` da chave de EXECUCAO. Sem variação (falsy): altera p.mao. Com variação: grava em p.variacoes[variacao],
// mas se `valor` for igual a p.mao[chave], APAGA a chave da variação (variação guarda só o que difere da mão).
// Lança erro se a chave não for de EXECUCAO ou a variação não existir.
export function ajustarVariacao(p, variacao, chave, valor) { ... }
```

### test/personagem.test.mjs — reescrever SEM nenhum acesso a `personagens/` nem a `fs` para presets
Use fixture inline: `const strahdLike = { nome: 'Fixture', mao: { ...NEUTRA, base: [{fonte:'EMSAllure', peso:1}], seed: 4004, inclinacao: 6, idio: 0.25, capricho: 0.8 }, variacoes: { formal: {pressa: 0.05, capricho: 1, tremor: 0}, apressado: {pressa: 0.75, capricho: 0.35, tremor: 0.1}, medo: {pressa: 0.5, tremor: 0.6} } }` (pode ajustar valores).
Mantenha/adapte estes testes: `resolver` recusa chave de identidade e variação inexistente; identidade intacta nas variações e `resolver` não muta `p`; `validar` detecta erros (nome vazio, base vazia, chave de identidade na variação, idio fora de [0,1]); compor "Teste" com glifos da fixture (carregando a fonte `EMSAllure` de `fontes/` via fs; é fonte, não preset); variações emocionais têm tremor maior que o formal e apressado tem pressa maior.
REMOVA: o teste "os 4 presets carregam do disco".
ADICIONE:
1. `novoPersonagem()`: `validar` devolve `[]`; nome `'Novo personagem'`; `mao.base` = `[{fonte:'EMSDelight', peso:1}]`; `variacoes` = `{normal: {}}`; `resolver(p,'normal')` é igual a `p.mao`; duas chamadas devolvem objetos independentes (mutar um não muda o outro); `novoPersonagem('X').nome === 'X'`.
2. `ajustarVariacao`: gravar valor diferente da mão grava na variação; gravar valor igual ao da mão remove a chave; sem variação (`''`/null) altera `p.mao`; chave de identidade (`seed`) lança; variação inexistente lança.

### test/espacamento.test.mjs
Remova o terceiro teste ('presets: espaçamento é razoável') e os imports que ficarem sem uso (`readdirSync`, `resolver`). Mantenha os dois primeiros testes intactos.

Verificação: `node --test test/personagem.test.mjs test/espacamento.test.mjs`, depois `node --test` na raiz.
NÃO FAZER: ler `personagens/` em qualquer teste; mudar `mao.js`; tocar UI.

---
---

# LOTE 2 (só depois do lote 1 aceito)

Todos usam o contrato de ajuda acima e os módulos já prontos: `src/ajuda.js` (`rotulo`, `ajuda`), `src/personagem.js` (`novoPersonagem`, `ajustarVariacao`, `resolver`, `validar`), `src/ui-catalogo.js` (`abrirCatalogo(estado, aoMudar)`). Estado novo: SEM `estado.presets` nem `estado.presetId`; `estado.variacao` e `estado.variacaoB` inicial = `'normal'`. Verificação de cada um: `node --check <arquivos>` e (para ui-*) um import no Node sem erro: `node -e "import('./src/ui-xxx.js').then(()=>console.log('ok'))"`. Não rodar navegador (o gerente/orquestrador verifica).

## Tarefa 05-D — `index.html` + `src/ui-personagem.js`

Arquivos permitidos: editar `index.html` e `src/ui-personagem.js`.

### index.html
1. Remover `PRESET_IDS`, `estado.presets`, `estado.presetId` e o `fetch` de `personagens/*.json` (continua o fetch das 11 fontes). Importar `novoPersonagem` de `./src/personagem.js` e `rotulo`, `ajuda` de `./src/ajuda.js`.
2. Estado inicial: `personagem: null` e depois do carregamento das fontes: `estado.personagem = novoPersonagem(); estado.variacao = 'normal'; estado.variacaoB = 'normal';` e `try { pPersonagem.restaurar(estado); } catch {}`. Em `renderizar`, a escolha automática de `variacaoB` fica como está.
3. CSS da classe `.ajuda`, no `<style>` (exatamente esta, em uma só regra por seletor):
```css
.ajuda { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; margin-left: 2px; border: 1px solid #777; border-radius: 50%; background: #fff; color: #555; font-size: 11px; font-weight: 700; line-height: 1; cursor: help; vertical-align: middle; user-select: none; }
.ajuda::after { content: attr(data-ajuda); display: none; position: absolute; top: calc(100% + 6px); left: 50%; transform: translateX(calc(-50% + var(--dx, 0px))); width: 220px; padding: 6px 8px; border-radius: 4px; background: var(--tinta); color: #fff; font-size: 12px; font-weight: 400; line-height: 1.35; text-align: left; white-space: normal; pointer-events: none; z-index: 30; }
.ajuda:hover::after, .ajuda:focus::after { display: block; }
.ajuda:focus { outline: 2px solid #1b5fc4; outline-offset: 1px; }
```
4. Barra superior: o rótulo `<label><input type="checkbox" id="comparar"> Comparar duas variações</label>` ganha um `ajuda('comparar')` ao lado: após o carregamento (ou no início do módulo) faça `$('comparar').parentElement.append(' ', ajuda('comparar'))`. O `<select id="variacao-b">` mantém `aria-label`. Rótulos de figura: `Variação: ...` continuam.
5. Estilos pequenos que a UI de personagens usa: `.linha-botoes { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }` e `input[type=text] { max-width: 100%; }`.
6. Não mexer em mais nada (layout, comparação, avisos).

### src/ui-personagem.js (reescrever mantendo `export function montar(elemento, estado, aoMudar)` -> função `atualizar`, e `export function restaurar(estado)`)
Remover tudo de presets (select de preset, "Restaurar preset"). O painel fica, de cima para baixo:
1. **Personagem** (h3 com `ajuda('personagem')`): `<input type="text">` com o nome (editável; `input` -> `estado.personagem.nome = valor`, `aoMudar()`); botões: "Novo personagem" (`estado.personagem = novoPersonagem(); estado.variacao = 'normal'; aoMudar()`), "Salvar JSON", "Abrir JSON" (como já existe, com validação e mensagem de erro).
2. **Meus personagens (neste navegador)**: `<select>` com os salvos (`localStorage['writer.personagens']` = JSON `{ [nome]: Personagem }`; ler/gravar dentro de try/catch; lista vazia = select desabilitado com opção "(nenhum salvo)"); botões "Salvar aqui" (grava `estado.personagem` sob `estado.personagem.nome`, sobrescreve se o nome existe, depois seleciona esse nome), "Abrir" (valida com `validar`, erro -> mensagem; ok -> `estado.personagem = structuredClone(p)`, `estado.variacao` = primeira variação ou `''`), "Excluir" (`confirm('Excluir "<nome>" dos salvos?')` antes de apagar).
3. **Variação** (`<label>` com `rotulo('variacaoSel')` + `ajuda('variacaoSel')` + select só com as variações do personagem; se não houver nenhuma, uma opção `''` rotulada "(mão base)"); botões "Adicionar" (`prompt('Nome da variação')`: ignora vazio/cancelar/nome repetido; cria `estado.personagem.variacoes[nome] = {}` e seleciona), "Renomear" (`prompt` com o nome atual; recria o objeto de variações preservando a ordem; `estado.variacao` acompanha), "Remover" (`confirm`; remove; `estado.variacao` = primeira restante ou `''`). Desabilitar Renomear/Remover quando não há variação.
4. **Identidade** (h3) e **Execução** (h3): sliders como já são, mas com rótulo legível+ajuda: texto = `rotulo(chave)` + `ajuda(chave)` dentro de UM `<span>` (o grid do `.slider` tem 3 colunas: span, input, output). Execução: o `set` usa `ajustarVariacao(estado.personagem, estado.variacao || null, chave, valor)` (variação só guarda o que difere da mão); o `get` continua `resolver(estado.personagem, estado.variacao || null)[chave]`.
5. Em `atualizar`: sincroniza nome (não sobrescrever se `document.activeElement` é o input), select de variações (reconstruir só se a lista mudou), select de salvos, sliders; grava `localStorage['writer.personagem']` com `{ personagem, variacao }` (sem `presetId`).
6. `restaurar(estado)`: lê `writer.personagem`; se `validar(p)` ok, `estado.personagem = p` e `estado.variacao` = salva se existir (ou `''` se vazia aceita) senão a primeira variação ou `''`. Qualquer erro: ignora.
NÃO FAZER: tocar outros `ui-*.js`; apagar `personagens/`; mudar `mao.js`; CSS de `.ajuda` fora de index.html.

## Tarefa 05-E — `src/ui-fontes.js`

Arquivos permitidos: editar só `src/ui-fontes.js`.
1. Importar `{ rotulo, ajuda } from './ajuda.js'` e `{ abrirCatalogo } from './ui-catalogo.js'`.
2. Substituir os rótulos crus: `fonte` (select da linha) -> `rotulo('base')`+`ajuda('base')`; `peso` -> `rotulo('peso')`+`ajuda('peso')` dentro de UM `<span>` (o `.slider` tem grid de 3 colunas: span, input, output); "Seed da mão" -> `rotulo('seed')`+`ajuda('seed')`; "Seed da mutação" -> `rotulo('mutarSeed')`+`ajuda('mutarSeed')`; "força" -> `rotulo('mutarForca')`+`ajuda('mutarForca')`. `deslizante(texto, ...)` deve aceitar a chave e montar o span texto+"?" (mude a assinatura para `deslizante(chave, min, max, passo, valor)`).
3. h3 "Fontes da mão" ganha `ajuda('base')` ao lado do texto; h3 "Mutar" ganha `ajuda('mutarForca')`.
4. Novo botão "Tabela de fontes" (type=button) acima da lista de fontes: `abrirCatalogo(estado, aoMudar)`.
5. Botões "adicionar fonte", "remover", "Mutar" continuam; sem outras mudanças de comportamento.
NÃO FAZER: tocar `ui-catalogo.js`, `ajuda.js`, outros `ui-*.js` ou `index.html`.

## Tarefa 05-F — `src/ui-texto.js` + `src/ui-exportar.js`

Arquivos permitidos: editar só `src/ui-texto.js` e `src/ui-exportar.js`.
1. Importar `{ rotulo, ajuda } from './ajuda.js'`.
2. `ui-texto.js`: rótulos via chave: textarea -> h3 "Texto" com `ajuda('texto')`; `Formato` -> chave `pagina`; Largura/Altura -> `larguraPagina`/`alturaPagina`; margens -> `margemTopo`/`margemDir`/`margemBase`/`margemEsq`; deslizantes `tamanho`/`entrelinha` (os `ROTULOS` já têm unidade quando couber); Alinhamento -> `alinhamento`. Texto de cada rótulo = `rotulo(chave)`. Trocar o array `medidas`/`deslizantes` para carregar a chave de ajuda como 1º elemento no lugar do texto. Slider: texto+"?" dentro de UM `<span>` (grid de 3 colunas). Labels comuns: `rotulo(chave)`, espaço, `ajuda(chave)`, espaço, controle. Os `<option>` de `selAlinhamento` mantêm os valores `esquerda|centro|justificado`.
3. `ui-exportar.js`: `CAMPOS` troca o texto pelo uso de `rotulo(chave)` com as chaves `zEscrita zLevantada fDesenho fViagem fZ offsetX offsetY mesaX mesaY` (os mesmos nomes de `estado.perfil`, então a chave do campo já é a chave de ajuda; remova a coluna de texto); header/footer -> chaves `header`/`footer`; checkbox -> `otimizar`. A função local `rotulo(texto, controle)` de ui-exportar deve ser renomeada (ex.: `linha`) para não colidir com o import `rotulo`, e passa a aceitar `(chave, controle)` e montar `label` com `rotulo(chave)` + `ajuda(chave)`.
4. Comportamento, sincronização e botões de baixar não mudam.
NÃO FAZER: tocar outros arquivos; mudar `exportar.js`.
