import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDENTIDADE, EXECUCAO } from '../src/mao.js';
import { AJUDA, ROTULOS, rotulo, ajuda } from '../src/ajuda.js';

const CHAVES = [
  'base', 'seed', 'inclinacao', 'largura', 'altura', 'espacamento', 'espacoPalavra', 'idio',
  'pressa', 'capricho', 'tremor', 'queda', 'compressao', 'variacao', 'desleixo',
  'personagem', 'variacaoSel', 'peso', 'mutarSeed', 'mutarForca',
  'texto', 'pagina', 'larguraPagina', 'alturaPagina', 'margemTopo', 'margemDir', 'margemBase', 'margemEsq', 'tamanho', 'entrelinha', 'alinhamento', 'comparar',
  'offsetX', 'offsetY', 'zEscrita', 'zLevantada', 'fDesenho', 'fViagem', 'fZ', 'mesaX', 'mesaY', 'header', 'footer', 'otimizar',
];

test('toda chave de IDENTIDADE e EXECUCAO tem ajuda e rótulo não vazios', () => {
  for (const k of [...IDENTIDADE, ...EXECUCAO]) {
    assert.ok(AJUDA[k]?.trim(), `ajuda vazia: ${k}`);
    assert.ok(ROTULOS[k]?.trim(), `rótulo vazio: ${k}`);
  }
});

test('todas as chaves do contrato existem em AJUDA e ROTULOS', () => {
  for (const k of CHAVES) {
    assert.ok(k in AJUDA, `falta em AJUDA: ${k}`);
    assert.ok(k in ROTULOS, `falta em ROTULOS: ${k}`);
  }
});

test('AJUDA e ROTULOS têm as mesmas chaves', () => {
  assert.deepEqual(Object.keys(AJUDA).sort(), Object.keys(ROTULOS).sort());
});

test('textos de ajuda têm até 220 caracteres e rótulos não são chaves camelCase cruas', () => {
  for (const [k, t] of Object.entries(AJUDA)) {
    assert.ok(t.length <= 220, `ajuda longa demais (${t.length}): ${k}`);
  }
  for (const k of Object.keys(ROTULOS)) {
    if (/[A-Z]/.test(k)) assert.notEqual(ROTULOS[k], k, `rótulo cru: ${k}`);
  }
});

test('rotulo devolve o rótulo da chave ou a própria chave se não existir', () => {
  assert.equal(rotulo('espacoPalavra'), ROTULOS.espacoPalavra);
  assert.equal(rotulo('xyz'), 'xyz');
});

test('ajuda sem texto lança erro antes de tocar document', () => {
  assert.throws(() => ajuda('xyz'));
});
