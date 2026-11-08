import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { parseFonte, FONTES } from '../src/fonte.js';
import { glifo, NEUTRA } from '../src/mao.js';
import { compor, PAGINAS } from '../src/layout.js';
import { resolver } from '../src/personagem.js';

const raiz = new URL('../', import.meta.url);
const fontes = Object.fromEntries(FONTES.map(nome => [
  nome,
  parseFonte(readFileSync(new URL(`fontes/${nome}.svg`, raiz), 'utf8'), nome),
]));
const mao = { ...NEUTRA, base: [{ fonte: 'EMSBird', peso: 1 }] };
const pontos = (tracos) => tracos.flat();
const largura = (g) => {
  const xs = pontos(g.tracos).map(([x]) => x);
  return Math.max(...xs) - Math.min(...xs);
};

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

test('presets: espaçamento é razoável', () => {
  const dir = new URL('personagens/', raiz);
  const arquivos = readdirSync(dir).filter(f => f.endsWith('.json'));
  assert.equal(arquivos.length, 4);
  for (const arq of arquivos) {
    const p = JSON.parse(readFileSync(new URL(arq, dir), 'utf8'));
    assert.ok(p.mao.espacamento >= -0.15 && p.mao.espacamento <= 0.1, `${arq}: ${p.mao.espacamento}`);

    const m = resolver(p, 'formal');
    let somaAdv = 0, somaTinta = 0;
    for (const ch of 'eaonmt') {
      const g = glifo(fontes, m, ch, 0);
      somaAdv += g.adv;
      somaTinta += largura(g);
    }
    const razao = somaAdv / somaTinta;
    // cursiva conectada (van-richten) tem adv < tinta por design; o alvo é pegar espaçamento largo (> 1.25)
    assert.ok(razao >= 0.7 && razao <= 1.25, `${arq}: razão adv/tinta = ${razao.toFixed(3)}`);
  }
});
