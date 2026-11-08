import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseFonte, FONTES } from '../src/fonte.js';

const lerFonte = (n) => fs.readFileSync(new URL('../fontes/' + n + '.svg', import.meta.url), 'utf8');

// SVG sintético com um <font> e os glifos dados.
const sintetico = (glifos, tagFonte = '<font id="X" horiz-adv-x="500" >') =>
  `<svg>${tagFonte}<font-face units-per-em="1000" ascent="800" descent="-200" x-height="545" cap-height="680"/>${glifos}</font></svg>`;

test('FONTES tem 11 nomes e cada arquivo existe', () => {
  assert.equal(FONTES.length, 11);
  for (const n of FONTES) assert.ok(fs.existsSync(new URL('../fontes/' + n + '.svg', import.meta.url)), n);
});

test('cada fonte real é parseada com upm, nome e >= 60 glifos', () => {
  for (const n of FONTES) {
    const f = parseFonte(lerFonte(n), n);
    assert.ok(f.upm > 0, n);
    assert.equal(f.nome, n);
    assert.ok(Object.keys(f.glifos).length >= 60, n);
  }
});

test('EMS: acentos têm traços', () => {
  for (const n of FONTES.filter((n) => n.startsWith('EMS'))) {
    const f = parseFonte(lerFonte(n), n);
    for (const ch of ['á', 'ã', 'ç', 'é', 'ê', 'õ']) {
      assert.ok(f.glifos[ch], n + ' ' + ch);
      assert.ok(f.glifos[ch].tracos.length >= 1, n + ' ' + ch);
    }
  }
});

test('espaço existe com adv > 0 e sem traços em todas as fontes', () => {
  for (const n of FONTES) {
    const sp = parseFonte(lerFonte(n), n).glifos[' '];
    assert.ok(sp, n);
    assert.ok(sp.adv > 0, n);
    assert.equal(sp.tracos.length, 0, n);
  }
});

test('decodificação de entidades no unicode', () => {
  const f = parseFonte(sintetico(
    '<glyph unicode="&#x22;" horiz-adv-x="1"/>' +
    '<glyph unicode="&#65;" horiz-adv-x="1"/>' +
    '<glyph unicode="&amp;" horiz-adv-x="1"/>' +
    '<glyph unicode="&lt;" horiz-adv-x="1"/>' +
    '<glyph unicode="&apos;" horiz-adv-x="1"/>' +
    '<glyph unicode="&quot;" horiz-adv-x="1"/>'
  ), 'S');
  for (const ch of ['"', 'A', '&', '<', "'"]) assert.ok(Object.hasOwn(f.glifos, ch), ch);
});

test('glifo sem unicode é ignorado; d em linha separada é lido; advPadrao; duplicata vale o primeiro', () => {
  const f = parseFonte(sintetico(
    '<glyph glyph-name="x" d="M0 0L1 1"/>' +
    '<glyph glyph-name="b" unicode="b"\n d="M0 0L0 9"/>' +
    '<glyph glyph-name="c" unicode="c" horiz-adv-x="700"/>' +
    '<glyph unicode="c" horiz-adv-x="900"/>'
  ), 'S');
  assert.deepEqual(Object.keys(f.glifos).sort(), ['b', 'c']);
  assert.deepEqual(f.glifos.b.tracos, [[[0, 0], [0, 9]]]);
  assert.equal(f.glifos.c.adv, 700);
  assert.equal(f.advPadrao, 500);
  const semAdv = parseFonte(sintetico('<glyph unicode="z" d="M0 0L1 0"/>'), 'S');
  assert.equal(semAdv.glifos.z.adv, 500);
});

test('valores reais: EMSAllure "!" e Relief "A"', () => {
  const allure = parseFonte(lerFonte('EMSAllure'), 'EMSAllure');
  assert.equal(allure.glifos['!'].adv, 359);
  assert.equal(allure.glifos['!'].tracos.length, 2);
  assert.deepEqual(allure.glifos['!'].tracos[0][0], [444, 665]);
  const relief = parseFonte(lerFonte('ReliefSingleLineSVG-Regular'), 'ReliefSingleLineSVG-Regular');
  assert.equal(relief.glifos['A'].adv, 676);
  assert.equal(relief.glifos['A'].tracos.length, 2);
});
