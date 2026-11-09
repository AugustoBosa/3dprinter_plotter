import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PERFIL_PADRAO, svg, otimizar, gcode, viagem } from '../src/exportar.js';

const raiz = new URL('../', import.meta.url);
const toml = readFileSync(new URL('arquivo/vpype.toml', raiz), 'utf8');
const lerToml = (chave) => toml.match(new RegExp(`${chave} = "(.*)"`))[1].replace(/\\n/g, '\n');
const pagina = { largura: 210, altura: 210 };

test('PERFIL_PADRAO bate com vpype.toml e valores fixos', () => {
  assert.equal(PERFIL_PADRAO.header, lerToml('document_start'));
  assert.equal(PERFIL_PADRAO.footer, lerToml('document_end'));
  assert.equal(PERFIL_PADRAO.fDesenho, 2400);
  assert.equal(PERFIL_PADRAO.fViagem, 6000);
  assert.equal(PERFIL_PADRAO.zEscrita, 3);
  assert.equal(PERFIL_PADRAO.zLevantada, 6);
  assert.equal(PERFIL_PADRAO.fZ, 500);
});

test('gcode de um traço reto', () => {
  const r = gcode([[[10, 20], [30, 20]]], pagina, PERFIL_PADRAO);
  const esperado = PERFIL_PADRAO.header +
    'G0 X10.000 Y190.000 F6000\nG1 Z3 F500\nG1 X30.000 Y190.000 F2400\nG0 Z6 F500\n' +
    PERFIL_PADRAO.footer;
  assert.equal(r.texto, esperado);
  assert.equal(r.nTracos, 1);
  assert.equal(r.comprimento, 20);
  assert.deepEqual(r.avisos, []);
});

test('texto começa com header e termina com footer', () => {
  const r = gcode([[[0, 0], [5, 5]]], pagina);
  assert.ok(r.texto.startsWith(PERFIL_PADRAO.header));
  assert.ok(r.texto.endsWith(PERFIL_PADRAO.footer));
});

test('offset de perfil desloca as coordenadas de máquina', () => {
  const r = gcode([[[10, 20], [30, 20]]], pagina, { offsetX: 5, offsetY: 7 });
  assert.ok(r.texto.includes('G0 X15.000 Y197.000 F6000'));
  assert.ok(r.texto.includes('G1 X35.000 Y197.000 F2400'));
});

test('traço de 3 pontos', () => {
  const r = gcode([[[0, 0], [3, 4], [3, 10]]], pagina);
  assert.equal(r.nTracos, 1);
  assert.equal(r.comprimento, 11);
  assert.equal(r.texto.split('\n').filter((l) => l.startsWith('G1 X') && l.endsWith('F2400')).length, 2);
});

test('traço de 1 ponto é ignorado', () => {
  const r = gcode([[[0, 0], [10, 0]], [[50, 50]], [[20, 0], [20, 10]]], pagina);
  assert.equal(r.nTracos, 2);
  assert.equal(r.comprimento, 20);
  assert.ok(!r.texto.includes('X50.000'));
});

test('avisos de fora da mesa', () => {
  const traco = [[[250, 10], [100, 10]]];
  assert.equal(gcode(traco, pagina).avisos.length, 1);
  assert.equal(gcode(traco, pagina, { offsetX: -50 }).avisos.length, 0);
  assert.equal(gcode([[[10, 250], [100, 10]]], pagina).avisos.length, 1);
});

test('svg com página retangular', () => {
  const s = svg([[[1, 2], [3.5, 4]], [[0, 0], [1, 1]], [[9, 9]]], { largura: 210, altura: 297 });
  assert.ok(s.includes('width="210mm"'));
  assert.ok(s.includes('height="297mm"'));
  assert.ok(s.includes('viewBox="0 0 210 297"'));
  assert.equal(s.split('<path').length - 1, 2);
  assert.ok(s.includes('M 1 2 L 3.5 4'));
  assert.ok(s.startsWith('<svg'));
  assert.ok(s.endsWith('</svg>'));
});

test('otimizar funde traços que se tocam', () => {
  const r = otimizar([[[0, 0], [10, 0]], [[10, 0.05], [20, 0]]], 0.1);
  assert.equal(r.length, 1);
  assert.deepEqual(r[0][0], [0, 0]);
  assert.deepEqual(r[0][r[0].length - 1], [20, 0]);
  assert.equal(r[0].length, 3);
});

test('otimizar inverte traço quando útil', () => {
  const r = otimizar([[[100, 0], [50, 0]], [[0, 0], [40, 0]]]);
  assert.equal(r.length, 2);
  assert.deepEqual(r[0][0], [0, 0]);
  assert.deepEqual(r[1][0], [50, 0]);
  assert.deepEqual(r[1][r[1].length - 1], [100, 0]);
});

test('otimizar não aumenta a viagem', () => {
  const x = [[[100, 0], [110, 0]], [[0, 0], [10, 0]], [[50, 0], [60, 0]], [[20, 0], [30, 0]]];
  const otimizado = otimizar(x);
  assert.ok(viagem(otimizado) <= viagem(x));
  assert.ok(viagem(otimizado) < viagem(x));
});

test('otimizar 2-opt: nunca pior que o original, preserva pontos e é determinístico', () => {
  let s = 7;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const x = Array.from({ length: 60 }, () => {
    const a = [r() * 200, r() * 200];
    return [a, [a[0] + r() * 8, a[1] + r() * 8]];
  });
  const o = otimizar(x, 0);
  assert.ok(viagem(o) <= viagem(x));
  assert.equal(o.length, 60);
  assert.equal(o.flat().length, 120);
  assert.deepEqual(otimizar(x, 0), o);
});

test('svg com trajeto desenha viagem e marcadores; sem trajeto fica igual', () => {
  const t = [[[1, 2], [3, 4]], [[5, 6], [7, 8]]];
  const pg = { largura: 50, altura: 50 };
  assert.equal(svg(t, pg), svg(t, pg, { trajeto: false }));
  const s = svg(t, pg, { trajeto: true });
  assert.equal(s.split('stroke-dasharray').length - 1, 2);
  assert.equal(s.split('<circle').length - 1, 4);
  assert.equal(s.split('<text').length - 1, 2);
});

test('otimizar não muta a entrada e descarta traços de 1 ponto', () => {
  const x = [[[0, 0]], [[5, 5], [10, 10]], [[1, 1], [2, 2]]];
  const antes = JSON.stringify(x);
  const r = otimizar(x);
  assert.equal(JSON.stringify(x), antes);
  assert.equal(r.length, 2);
});
