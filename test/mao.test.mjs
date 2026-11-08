import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hash } from '../src/rng.js';
import { NEUTRA, EXECUCAO, glifo, misturar, mutar } from '../src/mao.js';

const F = { nome: 'F', upm: 1000, ascent: 800, descent: -200, advPadrao: 500, glifos: {
  a: { adv: 600, tracos: [[[0, 0], [100, 200], [200, 0]]] },
  b: { adv: 700, tracos: [[[0, 0], [0, 500]], [[0, 500], [300, 500], [300, 250]]] },
  ' ': { adv: 300, tracos: [] } } };
const G = { nome: 'G', upm: 2000, ascent: 1600, descent: -400, advPadrao: 1000, glifos: {
  a: { adv: 1200, tracos: [[[0, 100], [200, 300], [400, 100]]] },
  b: { adv: 1400, tracos: [[[0, 0], [0, 1000]]] } } };
const fontes = { F, G };

const flat = (g) => g.tracos.flat(2);
function assertPts(actual, expected) {
  const a = flat(actual), e = flat(expected);
  assert.equal(a.length, e.length);
  a.forEach((v, i) => assert.ok(Math.abs(v - e[i]) < 1e-6, `ponto ${i}: ${v} != ${e[i]}`));
}

test('determinismo e dependência da seed', () => {
  const m = { ...NEUTRA, base: [{ fonte: 'F', peso: 1 }], seed: 42, idio: 0.5, variacao: 0.5 };
  assert.deepEqual(glifo(fontes, m, 'a', 3), glifo(fontes, m, 'a', 3));
  const outra = { ...m, seed: 43 };
  assert.notDeepEqual(glifo(fontes, m, 'a', 3), glifo(fontes, outra, 'a', 3));
});

test('NEUTRA com uma fonte reproduz os pontos divididos por upm', () => {
  const m = { ...NEUTRA, base: [{ fonte: 'F', peso: 1 }] };
  const a = glifo(fontes, m, 'a', 0), b = glifo(fontes, m, 'b', 0);
  assertPts(a, { adv: 0.6, tracos: F.glifos.a.tracos.map(t => t.map(([x, y]) => [x / 1000, y / 1000])) });
  assert.ok(Math.abs(a.adv - 0.6) < 1e-6);
  assert.ok(Math.abs(b.adv - 0.7) < 1e-6);
  assertPts(b, { adv: 0.7, tracos: F.glifos.b.tracos.map(t => t.map(([x, y]) => [x / 1000, y / 1000])) });
  const mg = { ...NEUTRA, base: [{ fonte: 'G', peso: 1 }] };
  assertPts(glifo(fontes, mg, 'a', 0), { adv: 0.6, tracos: G.glifos.a.tracos.map(t => t.map(([x, y]) => [x / 2000, y / 2000])) });
});

test('idio fixo entre ocorrências; variacao muda por ocorrência', () => {
  const base = { ...NEUTRA, base: [{ fonte: 'F', peso: 1 }], seed: 7 };
  const id = { ...base, idio: 0.8, variacao: 0 };
  const o0 = glifo(fontes, id, 'a', 0), o1 = glifo(fontes, id, 'a', 1), o7 = glifo(fontes, id, 'a', 7);
  assert.deepEqual(o0, o1);
  assert.deepEqual(o0, o7);
  assert.notDeepEqual(o0, glifo(fontes, { ...id, idio: 0 }, 'a', 0));
  const va = { ...base, idio: 0, variacao: 0.8 };
  assert.notDeepEqual(glifo(fontes, va, 'a', 0), glifo(fontes, va, 'a', 1));
});

test('misturar: extremos, meio e incompatibilidade', () => {
  const A = { adv: 1, tracos: [[[0, 0], [1, 0]]] };
  const B = { adv: 3, tracos: [[[0, 1], [1, 1]]] };
  assert.deepEqual(misturar(A, B, 0), A);
  assert.deepEqual(misturar(A, B, 1), B);
  const m = misturar(A, B, 0.5);
  assert.equal(m.adv, 2);
  assert.equal(m.tracos[0].length, 32);
  m.tracos[0].forEach(([x, y]) => assert.ok(Math.abs(y - 0.5) < 1e-9));
  assert.ok(Math.abs(m.tracos[0][0][0]) < 1e-9);
  assert.ok(Math.abs(m.tracos[0][31][0] - 1) < 1e-9);
  assert.equal(misturar(A, { adv: 1, tracos: [] }, 0.5), null);
});

test('mistura de fontes compatíveis e escolha por hash para incompatíveis', () => {
  const mix = { ...NEUTRA, base: [{ fonte: 'F', peso: 1 }, { fonte: 'G', peso: 1 }] };
  const a = glifo(fontes, { ...mix, seed: 1 }, 'a', 0);
  assert.equal(a.tracos.length, 1);
  assert.equal(a.tracos[0].length, 32);

  const soF = (seed) => glifo(fontes, { ...NEUTRA, base: [{ fonte: 'F', peso: 1 }], seed }, 'b', 0);
  const soG = (seed) => glifo(fontes, { ...NEUTRA, base: [{ fonte: 'G', peso: 1 }], seed }, 'b', 0);
  let viuF = false, viuG = false;
  for (let seed = 0; seed <= 200; seed++) {
    const m = { ...mix, seed };
    const b1 = glifo(fontes, m, 'b', 0);
    assert.deepEqual(b1, glifo(fontes, m, 'b', 0));
    const escolheF = (hash('b' + seed) % 10000) / 10000 < 0.5;
    if (escolheF) { assert.deepEqual(b1, soF(seed)); viuF = true; }
    else { assert.deepEqual(b1, soG(seed)); viuG = true; }
  }
  assert.ok(viuF && viuG);
});

test('mutar: não muda EXECUCAO, é determinista e não altera a entrada', () => {
  const m = { ...NEUTRA, base: [{ fonte: 'F', peso: 1 }, { fonte: 'G', peso: 1 }], seed: 1, idio: 0.5, variacao: 0.5, pressa: 0.3, capricho: 0.5, desleixo: 0.5 };
  const copia = structuredClone(m);
  const m2 = mutar(m, 5, 0.5);
  for (const k of EXECUCAO) assert.equal(m2[k], m[k], k);
  assert.notEqual(m2.seed, m.seed);
  assert.notEqual(m2.inclinacao, m.inclinacao);
  assert.deepEqual(mutar(m, 5, 0.5), m2);
  assert.deepEqual(m, copia);
  const reloaded = JSON.parse(JSON.stringify(m2));
  assert.deepEqual(reloaded, m2);
  assert.deepEqual(glifo(fontes, reloaded, 'a', 0), glifo(fontes, m2, 'a', 0));
});

test('caractere ausente: sem exceção, sem traços, adv padrão da primeira fonte', () => {
  const m = { ...NEUTRA, base: [{ fonte: 'F', peso: 1 }, { fonte: 'G', peso: 1 }] };
  const g = glifo(fontes, m, 'ç', 0);
  assert.deepEqual(g.tracos, []);
  assert.equal(g.adv, 0.5);
});
