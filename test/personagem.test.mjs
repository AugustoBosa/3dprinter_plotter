import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolver, validar, novoPersonagem, ajustarVariacao } from '../src/personagem.js';
import { NEUTRA, IDENTIDADE, glifo } from '../src/mao.js';
import { parseFonte } from '../src/fonte.js';

const raiz = new URL('../', import.meta.url);
const carregarFonte = (nome) => parseFonte(fs.readFileSync(new URL(`fontes/${nome}.svg`, raiz), 'utf8'), nome);

// Fixture inline (não é preset): só para os testes.
const strahdLike = () => ({
  nome: 'Fixture',
  mao: { ...NEUTRA, base: [{ fonte: 'EMSAllure', peso: 1 }], seed: 4004, inclinacao: 6, idio: 0.25, capricho: 0.8 },
  variacoes: {
    formal: { pressa: 0.05, capricho: 1, tremor: 0 },
    apressado: { pressa: 0.75, capricho: 0.35, tremor: 0.1 },
    medo: { pressa: 0.5, tremor: 0.6 },
  },
});

test('resolver recusa chave de identidade e variação inexistente', () => {
  const p = { nome: 'x', mao: { ...NEUTRA, base: [{ fonte: 'F', peso: 1 }] }, variacoes: { ruim: { seed: 5 } } };
  assert.throws(() => resolver(p, 'ruim'), /chave de identidade/);
  assert.throws(() => resolver(p, 'nao-existe'), /variação desconhecida/);
});

test('identidade intacta nas variações e resolver não muta p', () => {
  const p = strahdLike();
  const antes = structuredClone(p);
  for (const v of Object.keys(p.variacoes)) {
    const m = resolver(p, v);
    for (const k of IDENTIDADE) assert.deepEqual(m[k], p.mao[k], `${v}/${k}`);
  }
  resolver(p, 'formal');
  assert.deepEqual(p, antes);
});

test('validar detecta erros', () => {
  const ok = strahdLike();
  assert.deepEqual(validar(ok), []);
  assert.ok(validar({ ...ok, nome: '' }).length >= 1);
  assert.ok(validar({ ...ok, mao: { ...ok.mao, base: [] } }).length >= 1);
  assert.ok(validar({ ...ok, variacoes: { v: { seed: 3 } } }).length >= 1);
  assert.ok(validar({ ...ok, mao: { ...ok.mao, idio: 2 } }).length >= 1);
});

test('compor "Teste" com a fonte da fixture não falha', () => {
  const p = strahdLike();
  const fontes = { EMSAllure: carregarFonte('EMSAllure') };
  for (const v of Object.keys(p.variacoes)) {
    const mao = resolver(p, v);
    for (const ch of 'Teste') {
      const g = glifo(fontes, mao, ch, 0);
      assert.ok(g.adv > 0, `${v}/${ch} adv`);
      if ('Test'.includes(ch)) assert.ok(g.tracos.length >= 1, `${v}/${ch} sem traço`);
    }
  }
});

test('variações emocionais têm tremor maior que o formal e apressado tem pressa maior', () => {
  const p = strahdLike();
  assert.ok(resolver(p, 'medo').tremor > resolver(p, 'formal').tremor, 'tremor');
  assert.ok(resolver(p, 'apressado').pressa > resolver(p, 'formal').pressa, 'pressa');
});

test('novoPersonagem: válido, padrão e independente', () => {
  const p = novoPersonagem();
  assert.deepEqual(validar(p), []);
  assert.equal(p.nome, 'Novo personagem');
  assert.deepEqual(p.mao.base, [{ fonte: 'EMSDelight', peso: 1 }]);
  assert.deepEqual(p.variacoes, { normal: {} });
  assert.deepEqual(resolver(p, 'normal'), p.mao);
  const q = novoPersonagem();
  p.mao.capricho = 0.1;
  p.variacoes.normal.tremor = 1;
  assert.equal(q.mao.capricho, NEUTRA.capricho);
  assert.deepEqual(q.variacoes, { normal: {} });
  assert.equal(novoPersonagem('X').nome, 'X');
});

test('ajustarVariacao: grava, remove se igual à mão, altera mão sem variação, recusa erros', () => {
  const p = strahdLike();
  ajustarVariacao(p, 'formal', 'tremor', 0.3);
  assert.equal(p.variacoes.formal.tremor, 0.3);
  assert.equal(p.mao.tremor, NEUTRA.tremor);

  ajustarVariacao(p, 'formal', 'tremor', p.mao.tremor);
  assert.ok(!('tremor' in p.variacoes.formal));

  ajustarVariacao(p, '', 'pressa', 0.9);
  assert.equal(p.mao.pressa, 0.9);
  ajustarVariacao(p, null, 'queda', 1);
  assert.equal(p.mao.queda, 1);

  assert.throws(() => ajustarVariacao(p, 'formal', 'seed', 3), /chave de identidade/);
  assert.throws(() => ajustarVariacao(p, 'nao-existe', 'tremor', 0.2), /variação desconhecida/);
});
