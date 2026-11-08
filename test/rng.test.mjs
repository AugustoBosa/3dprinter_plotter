import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng, hash } from '../src/rng.js';

const primeiros = (gen, n) => Array.from({ length: n }, gen);

test('mesma seed numérica gera a mesma sequência', () => {
  assert.deepEqual(primeiros(rng(7), 1000), primeiros(rng(7), 1000));
});

test('seeds diferentes geram sequências diferentes', () => {
  assert.notDeepEqual(primeiros(rng(1), 10), primeiros(rng(2), 10));
});

test('valores ficam em [0, 1)', () => {
  const g = rng(42);
  for (let i = 0; i < 10000; i++) {
    const v = g();
    assert.ok(v >= 0 && v < 1, `valor fora do intervalo: ${v}`);
  }
});

test('seed string é repetível e distingue strings', () => {
  assert.deepEqual(primeiros(rng('strahd'), 20), primeiros(rng('strahd'), 20));
  assert.notDeepEqual(primeiros(rng('strahd'), 20), primeiros(rng('kolyan'), 20));
});

test('valores fixos de rng(1)', () => {
  const g = rng(1);
  assert.equal(g(), 0.6270739405881613);
  assert.equal(g(), 0.002735721180215478);
  assert.equal(g(), 0.5274470399599522);
});

test('hash FNV-1a de valores conhecidos', () => {
  assert.equal(hash(''), 2166136261);
  assert.equal(hash('a'), 3826002220);
  assert.equal(hash('foobar'), 3214735720);
});

test('hash fica em uint32 com acento', () => {
  const h = hash('ação');
  assert.ok(Number.isInteger(h) && h >= 0 && h < 2 ** 32);
});
