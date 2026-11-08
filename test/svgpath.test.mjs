import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePath } from '../src/svgpath.js';

test('M e L absolutos', () => {
  assert.deepEqual(parsePath('M0 0 L10 0 L10 10'), [[[0, 0], [10, 0], [10, 10]]]);
});

test('H, V e Z fecham o subcaminho', () => {
  assert.deepEqual(parsePath('M0 0 H10 V5 Z'), [[[0, 0], [10, 0], [10, 5], [0, 0]]]);
});

test('relativos minúsculos', () => {
  assert.deepEqual(parsePath('m1 1 l2 0 h3 v4'), [[[1, 1], [3, 1], [6, 1], [6, 5]]]);
});

test('vários subcaminhos', () => {
  const r = parsePath('M0 0 L1 1 M5 5 L6 6 L7 5');
  assert.equal(r.length, 2);
  assert.equal(r[1].length, 3);
});

test('M implícito repete como L', () => {
  const r = parsePath('M0 0 10 0 10 10');
  assert.equal(r.length, 1);
  assert.deepEqual(r[0], [[0, 0], [10, 0], [10, 10]]);
});

test('Relief real com h/l colados', () => {
  assert.deepEqual(
    parsePath('M155 213h367M606 0l-264 675h-4l-268 -675'),
    [[[155, 213], [522, 213]], [[606, 0], [342, 675], [338, 675], [70, 0]]],
  );
});

test('quadrática: extremos exatos e vértices sobre a curva', () => {
  const pts = parsePath('M0 0 Q5 10 10 0', 0.1)[0];
  assert.deepEqual(pts[0], [0, 0]);
  assert.deepEqual(pts.at(-1), [10, 0]);
  assert.ok(pts.length > 3);
  for (const [x, y] of pts) assert.ok(Math.abs(y - 2 * x * (1 - x / 10)) < 1e-6);
});

test('cúbica: tol menor gera mais vértices e respeita a altura máxima', () => {
  const d = 'M0 0 C0 10 10 10 10 0';
  const fino = parsePath(d, 0.01)[0];
  const grosso = parsePath(d, 5)[0];
  assert.ok(fino.length > grosso.length);
  assert.deepEqual(fino.at(-1), [10, 0]);
  assert.deepEqual(grosso.at(-1), [10, 0]);
  for (const [, y] of fino) assert.ok(y >= 0 && y <= 7.5001);
});

test('S reflete o controle anterior', () => {
  const pts = parsePath('M0 0 C0 5 5 5 10 0 S20 -5 20 0', 0.1)[0];
  assert.deepEqual(pts.at(-1), [20, 0]);
  assert.ok(pts.some(([x, y]) => x === 10 && y === 0));
  assert.ok(pts.some(([, y]) => y < 0));
});

test('T reflete o controle do Q anterior', () => {
  const pts = parsePath('M0 0 Q5 10 10 0 T20 0', 0.1)[0];
  assert.deepEqual(pts.at(-1), [20, 0]);
  assert.ok(pts.some(([, y]) => y < 0));
});

test('cúbica compacta sem espaços (dado real)', () => {
  const pts = parsePath('M1022 1034.93C1022 1034.93 975.873 937.411 855.921 936.749')[0];
  assert.deepEqual(pts[0], [1022, 1034.93]);
  assert.deepEqual(pts.at(-1), [855.921, 936.749]);
});

test('vazio e arco aproximado por reta', () => {
  assert.deepEqual(parsePath(''), []);
  assert.deepEqual(parsePath('   '), []);
  assert.deepEqual(parsePath('M0 0 A5 5 0 0 1 10 0'), [[[0, 0], [10, 0]]]);
});

test('quadrática relativa', () => {
  const pts = parsePath('m10 10 q5 10 10 0')[0];
  assert.deepEqual(pts[0], [10, 10]);
  assert.deepEqual(pts.at(-1), [20, 10]);
});
