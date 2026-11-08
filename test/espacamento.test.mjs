import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseFonte, FONTES } from '../src/fonte.js';
import { glifo, NEUTRA } from '../src/mao.js';
import { compor, PAGINAS } from '../src/layout.js';

const raiz = new URL('../', import.meta.url);
const fontes = Object.fromEntries(FONTES.map(nome => [
  nome,
  parseFonte(readFileSync(new URL(`fontes/${nome}.svg`, raiz), 'utf8'), nome),
]));
const mao = { ...NEUTRA, base: [{ fonte: 'EMSBird', peso: 1 }] };
const pontos = (tracos) => tracos.flat();

test('espacamento soma uma vez', () => {
  const a = glifo(fontes, { ...mao, espacamento: 0.1 }, 'a', 0).adv;
  const b = glifo(fontes, { ...mao, espacamento: 0 }, 'a', 0).adv;
  assert.ok(Math.abs((a - b) - 0.1) < 1e-9);
});

test('compor avança adv uma vez por letra', () => {
  const maxX = (espacamento) => {
    const { paginas } = compor('aa', fontes, { ...mao, espacamento }, PAGINAS.A4, { tamanho: 10 });
    return Math.max(...pontos(paginas[0]).map(([x]) => x));
  };
  assert.ok(Math.abs((maxX(0.1) - maxX(0)) - 1) < 1e-6);
});
