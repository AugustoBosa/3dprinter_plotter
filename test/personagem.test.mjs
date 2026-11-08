import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolver, validar } from '../src/personagem.js';
import { NEUTRA, EXECUCAO, IDENTIDADE, glifo } from '../src/mao.js';
import { parseFonte } from '../src/fonte.js';

const raiz = new URL('../', import.meta.url);
const NOMES = ['strahd', 'kolyan', 'van-richten', 'fiona'];
const carregarPreset = (n) => JSON.parse(fs.readFileSync(new URL(`personagens/${n}.json`, raiz), 'utf8'));
const presets = Object.fromEntries(NOMES.map((n) => [n, carregarPreset(n)]));
const carregarFonte = (nome) => parseFonte(fs.readFileSync(new URL(`fontes/${nome}.svg`, raiz), 'utf8'), nome);

test('resolver recusa chave de identidade e variação inexistente', () => {
  const p = { nome: 'x', mao: { ...NEUTRA, base: [{ fonte: 'F', peso: 1 }] }, variacoes: { ruim: { seed: 5 } } };
  assert.throws(() => resolver(p, 'ruim'), /chave de identidade/);
  assert.throws(() => resolver(p, 'nao-existe'), /variação desconhecida/);
});

test('identidade intacta, variações distintas e resolver não muta p', () => {
  for (const n of NOMES) {
    const p = presets[n];
    const antes = structuredClone(p);
    const vs = Object.keys(p.variacoes);
    for (const v of vs) {
      const m = resolver(p, v);
      for (const k of IDENTIDADE) assert.deepEqual(m[k], p.mao[k], `${n}/${v}/${k}`);
    }
    const [a, b] = vs;
    const difere = EXECUCAO.some((k) => resolver(p, a)[k] !== resolver(p, b)[k]);
    assert.ok(difere, `${n}: ${a} e ${b} iguais`);
    resolver(p);
    assert.deepEqual(p, antes);
  }
});

test('os 4 presets carregam do disco, têm variações-chave e são válidos', () => {
  for (const n of NOMES) {
    const p = presets[n];
    const vs = Object.keys(p.variacoes);
    assert.ok(vs.length >= 3, n);
    assert.ok(vs.includes('formal') && vs.includes('apressado'), n);
    assert.ok(vs.some((v) => ['raiva', 'medo', 'cansaco'].includes(v)), n);
    assert.deepEqual(validar(p), [], n);
  }
});

test('validar detecta erros', () => {
  const ok = structuredClone(presets.strahd);
  assert.ok(validar({ ...ok, nome: '' }).length >= 1);
  assert.ok(validar({ ...ok, mao: { ...ok.mao, base: [] } }).length >= 1);
  assert.ok(validar({ ...ok, variacoes: { v: { seed: 3 } } }).length >= 1);
  assert.ok(validar({ ...ok, mao: { ...ok.mao, idio: 2 } }).length >= 1);
});

test('compor "Teste" com as fontes dos presets não falha', () => {
  for (const n of NOMES) {
    const p = presets[n];
    const fontes = Object.fromEntries(p.mao.base.map((it) => [it.fonte, carregarFonte(it.fonte)]));
    for (const v of Object.keys(p.variacoes)) {
      const mao = resolver(p, v);
      for (const ch of 'Teste') {
        const g = glifo(fontes, mao, ch, 0);
        assert.ok(g.adv > 0, `${n}/${v}/${ch} adv`);
        if ('Test'.includes(ch)) assert.ok(g.tracos.length >= 1, `${n}/${v}/${ch} sem traço`);
      }
    }
  }
});

test('variações emocionais/apressadas diferem do formal', () => {
  for (const n of ['strahd', 'van-richten', 'fiona']) {
    const p = presets[n];
    const formal = resolver(p, 'formal').tremor;
    const emo = Object.keys(p.variacoes).find((v) => ['raiva', 'medo'].includes(v));
    assert.ok(resolver(p, emo).tremor > formal, `${n} tremor`);
  }
  for (const n of NOMES) {
    const p = presets[n];
    assert.ok(resolver(p, 'apressado').pressa > resolver(p, 'formal').pressa, `${n} pressa`);
  }
});
