import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOGO, EIXOS, ARQUETIPOS } from '../src/catalogo.js';
import { FONTES } from '../src/fonte.js';

test('FONTES e CATALOGO têm os mesmos nomes, sem duplicatas', () => {
  const nomes = CATALOGO.map(f => f.fonte);
  assert.equal(new Set(nomes).size, nomes.length);
  for (const n of FONTES) assert.equal(nomes.filter(x => x === n).length, 1, n);
  for (const n of nomes) assert.ok(FONTES.includes(n), n);
});

test('eixos têm as chaves de EIXOS com inteiros de 1 a 5', () => {
  for (const f of CATALOGO) {
    assert.deepEqual(Object.keys(f.eixos).sort(), Object.keys(EIXOS).sort(), f.fonte);
    for (const v of Object.values(f.eixos)) assert.ok(Number.isInteger(v) && v >= 1 && v <= 5, f.fonte);
  }
});

test('aptidao tem as chaves de ARQUETIPOS com inteiros de 0 a 3', () => {
  for (const f of CATALOGO) {
    assert.deepEqual(Object.keys(f.aptidao).sort(), Object.keys(ARQUETIPOS).sort(), f.fonte);
    for (const v of Object.values(f.aptidao)) assert.ok(Number.isInteger(v) && v >= 0 && v <= 3, f.fonte);
  }
});

test('ligacao válida, textos preenchidos e EIXOS/ARQUETIPOS completos', () => {
  for (const f of CATALOGO) {
    assert.ok(['cursiva', 'semi', 'forma', 'gotica', 'impressa', 'titulo'].includes(f.ligacao), f.fonte);
    assert.ok(f.familia.trim(), f.fonte);
    assert.ok(f.descricao.trim(), f.fonte);
  }
  for (const e of Object.values(EIXOS)) {
    for (const c of ['nome', 'min', 'max', 'ajuda']) assert.ok(e[c]?.trim(), c);
  }
  for (const a of Object.values(ARQUETIPOS)) {
    for (const c of ['nome', 'ajuda']) assert.ok(a[c]?.trim(), c);
  }
});

test('fontes da mesma família têm a mesma ligação', () => {
  const porFamilia = new Map();
  for (const f of CATALOGO) {
    if (!porFamilia.has(f.familia)) porFamilia.set(f.familia, f.ligacao);
    assert.equal(porFamilia.get(f.familia), f.ligacao, f.fonte);
  }
});
