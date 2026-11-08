import fs from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFonte } from '../src/fonte.js';
import { compor, PAGINAS } from '../src/layout.js';
import { NEUTRA } from '../src/mao.js';

const raiz = new URL('../', import.meta.url);
const carregar = (nome) => parseFonte(fs.readFileSync(new URL(`fontes/${nome}.svg`, raiz), 'utf8'), nome);
const fontes = { EMSBird: carregar('EMSBird'), EMSAllure: carregar('EMSAllure') };
const mao = { ...NEUTRA, base: [{ fonte: 'EMSBird', peso: 1 }] };
const longo = Array(45).fill('palavra').join(' ');

// Agrupa traços em linhas pelo y mínimo (tolerância tamanho*0.9), de cima para baixo.
function linhasDe(pagina, tamanho) {
  const trs = pagina.map((t) => ({ t, minY: Math.min(...t.map((p) => p[1])) })).sort((a, b) => a.minY - b.minY);
  const grupos = [];
  for (const { t, minY } of trs) {
    const g = grupos.at(-1);
    if (g && minY - g.ref < tamanho * 0.9) g.trs.push(t);
    else grupos.push({ ref: minY, trs: [t] });
  }
  return grupos.map((g) => g.trs);
}
const pontos = (trs) => trs.flat();
const yMedio = (trs) => { const ys = pontos(trs).map((p) => p[1]); return ys.reduce((a, b) => a + b, 0) / ys.length; };

test('PAGINAS tem dimensões exatas e compor aceita página personalizada', () => {
  assert.deepEqual([PAGINAS.A4.largura, PAGINAS.A4.altura], [210, 297]);
  assert.deepEqual([PAGINAS.A5.largura, PAGINAS.A5.altura], [148, 210]);
  assert.deepEqual([PAGINAS.mesa.largura, PAGINAS.mesa.altura], [210, 210]);
  const custom = { largura: 100, altura: 100, margens: { topo: 10, dir: 10, base: 10, esq: 10 } };
  assert.ok(compor('abc', fontes, mao, custom).paginas[0].length > 0);
});

test('quebra por palavra fica dentro da margem direita', () => {
  const A5 = PAGINAS.A5;
  const { paginas } = compor(longo, fontes, mao, A5, { tamanho: 6 });
  assert.ok(linhasDe(paginas[0], 6).length >= 2);
  const tol = 6 * 0.3;
  for (const t of paginas[0]) for (const [x] of t) assert.ok(x <= A5.largura - A5.margens.dir + tol);
});

test('palavra gigante é quebrada por letra e gera aviso', () => {
  const { paginas, avisos } = compor('a'.repeat(200), fontes, mao, PAGINAS.A5, { tamanho: 6 });
  assert.ok(avisos.some((a) => a.startsWith('palavra longa quebrada')));
  assert.ok(linhasDe(paginas[0], 6).length >= 2);
});

test('parágrafo com linha em branco desce um entrelinha', () => {
  const opc = { tamanho: 6, entrelinha: 1.6 };
  const comBranco = compor('um\n\ndois', fontes, mao, PAGINAS.A5, opc).paginas[0];
  const semBranco = compor('um\ndois', fontes, mao, PAGINAS.A5, opc).paginas[0];
  const dif = yMedio(linhasDe(comBranco, 6).at(-1)) - yMedio(linhasDe(semBranco, 6).at(-1));
  assert.ok(Math.abs(dif - 6 * 1.6) <= 0.5, `diferença ${dif}`);
});

test('quebra de página na mesa respeita a margem inferior', () => {
  const mesa = PAGINAS.mesa;
  const { paginas } = compor('linha\n'.repeat(100), fontes, mao, mesa, { tamanho: 6 });
  assert.ok(paginas.length >= 2);
  const tol = 6 * 0.3;
  for (const t of paginas[0]) for (const [, y] of t) assert.ok(y <= mesa.altura - mesa.margens.base + tol);
});

test('alinhamentos esquerda, centro e justificado', () => {
  const A5 = PAGINAS.A5;
  const tam = 6;
  const m = A5.margens;
  const tres = 'ab\nabcd\nabcdef';

  const esq = linhasDe(compor(tres, fontes, mao, A5, { tamanho: tam, alinhamento: 'esquerda' }).paginas[0], tam);
  const mins = esq.map((trs) => Math.min(...pontos(trs).map((p) => p[0])));
  assert.ok(Math.max(...mins) - Math.min(...mins) <= tam * 0.2);

  const cen = linhasDe(compor(tres, fontes, mao, A5, { tamanho: tam, alinhamento: 'centro' }).paginas[0], tam);
  const meio = (A5.largura - m.esq - m.dir) / 2 + m.esq;
  for (const trs of cen) {
    const xs = pontos(trs).map((p) => p[0]);
    assert.ok(Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - meio) <= tam * 0.5);
  }

  const just = linhasDe(compor(longo, fontes, mao, A5, { tamanho: tam, alinhamento: 'justificado' }).paginas[0], tam);
  assert.ok(just.length >= 3);
  for (const trs of just.slice(0, -1)) {
    const maxX = Math.max(...pontos(trs).map((p) => p[0]));
    assert.ok(Math.abs(maxX - (A5.largura - m.dir)) <= tam * 0.6, `maxX ${maxX}`);
  }
});

test('limites: tremor e inclinação não tiram pontos da área útil', () => {
  const A5 = PAGINAS.A5;
  const ruim = { ...mao, tremor: 0.5, inclinacao: 15 };
  const { paginas, avisos } = compor(longo.repeat(3), fontes, ruim, A5, { tamanho: 6 });
  const tol = 6 * 0.3;
  const m = A5.margens;
  for (const pag of paginas) for (const t of pag) for (const [x, y] of t) {
    assert.ok(x >= m.esq - tol && x <= A5.largura - m.dir + tol, `x ${x}`);
    assert.ok(y >= m.topo - tol && y <= A5.altura - m.base + tol, `y ${y}`);
  }
  assert.ok(avisos[0].startsWith('tolerancia de limites'));
});

test('queda aumenta o espaçamento vertical por linha', () => {
  const texto = 'l\n'.repeat(5);
  const yUltimaMenosPrimeira = (q) => {
    const linhas = linhasDe(compor(texto, fontes, { ...mao, queda: q }, PAGINAS.A5, { tamanho: 6 }).paginas[0], 6);
    return yMedio(linhas.at(-1)) - yMedio(linhas[0]);
  };
  assert.ok(Math.abs((yUltimaMenosPrimeira(2) - yUltimaMenosPrimeira(0)) - 2 * 4) <= 0.5);
});

test('determinismo: mesma entrada, mesma saída; seed diferente muda com tremor', () => {
  const com = { ...mao, tremor: 0.5 };
  const a = compor(longo, fontes, com, PAGINAS.A5);
  assert.deepEqual(a, compor(longo, fontes, com, PAGINAS.A5));
  const b = compor(longo, fontes, { ...com, seed: 99 }, PAGINAS.A5);
  assert.notDeepEqual(a.paginas, b.paginas);
});

test('texto vazio gera uma página vazia', () => {
  const { paginas } = compor('', fontes, mao, PAGINAS.A5);
  assert.equal(paginas.length, 1);
  assert.equal(paginas[0].length, 0);
});
