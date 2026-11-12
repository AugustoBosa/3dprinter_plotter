import fs from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFonte } from '../src/fonte.js';
import { NEUTRA } from '../src/mao.js';
import { limpar, normalizar, blocos } from '../src/magia.js';
import { gerarAlfabeto, cifrar, sigilo, LETRAS } from '../src/arcano.js';
import { comporGrimorio, folha, FOLHAS } from '../src/scroll.js';

const bruta = {
  name: 'Fireball', source: 'PHB', level: 3, school: 'V',
  time: [{ number: 1, unit: 'action' }],
  range: { type: 'point', distance: { type: 'feet', amount: 150 } },
  components: { v: true, s: true, m: { text: 'gold dust', cost: 2500, consume: true } },
  duration: [{ type: 'timed', duration: { type: 'minute', amount: 1 }, concentration: true }],
  entries: ['Each creature takes {@damage 8d6} fire damage. '.repeat(12), { type: 'list', items: ['um {@condition prone|PHB|caído}'] }],
  entriesHigherLevel: [{ type: 'entries', name: 'At Higher Levels', entries: ['Increases by {@scaledamage 8d6|3-9|1d6}.'] }],
  savingThrow: ['dexterity'], damageInflict: ['fire'], meta: { ritual: true },
  classes: { class: [{ name: 'Wizard', source: 'PHB' }] },
};
const bola = normalizar(bruta, 'fireball-phb', { nome: 'Bola de Fogo', resumo: 'Explosão de chamas.' });

test('limpar tira as marcações do 5etools', () => {
  assert.equal(limpar('{@damage 8d6} e {@dc 15} e {@hit 5} e {@creature goblin|MM|goblins} e {@scaledamage 8d6|3-9|1d6}'), '8d6 e CD 15 e +5 e goblins e 1d6');
});

test('normalizar gera a ficha em português', () => {
  assert.equal(bola.nome, 'Bola de Fogo');
  assert.equal(bola.linhaNivel, 'Evocação de 3º nível (ritual)');
  assert.equal(bola.alcance, '45 m');
  assert.equal(bola.comp, 'V, S, M');
  assert.equal(bola.duracao, 'Concentração, até 1 minuto');
  assert.equal(bola.mec, 'Res. DES · 8d6 fogo · +1d6 por nível acima · M: 25 po (consumido)');
  assert.deepEqual(bola.classes, ['Mago']);
  assert.ok(!/[{}]/.test(bola.texto + bola.superior));
  assert.ok(bola.texto.includes('- um caído'));
});

test('blocos: resumo curto ou texto completo', () => {
  assert.ok(blocos(bola, false).efeito.endsWith('Explosão de chamas.'));
  assert.ok(blocos(bola, true).efeito.includes('At Higher Levels'));
});

test('alfabeto é determinístico, completo e sem letras repetidas', () => {
  const a = gerarAlfabeto({ seed: 7 }), b = gerarAlfabeto({ seed: 7 }), c = gerarAlfabeto({ seed: 8 });
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.glifos.a, c.glifos.a);
  const desenhos = [...LETRAS].map((ch) => JSON.stringify(a.glifos[ch].tracos));
  assert.equal(new Set(desenhos).size, LETRAS.length);
  for (const ch of LETRAS) assert.ok(a.glifos[ch].tracos.length > 0, ch);
  const meu = [[[0, 0], [500, 700]]];
  assert.deepEqual(gerarAlfabeto({ seed: 7 }, { a: meu }).glifos.a.tracos, meu);
});

test('cifrar reduz ao alfabeto arcano', () => {
  assert.equal(cifrar('Duração: 1 minuto, até!'), 'duracao. 1 minuto. ate.');
});

test('sigilo cabe no círculo unitário e muda com a magia', () => {
  const s = sigilo(bola, 1);
  for (const [x, y] of s.flat()) assert.ok(Math.hypot(x, y) <= 1.0001);
  assert.notDeepEqual(s, sigilo({ ...bola, id: 'outra' }, 1));
  assert.deepEqual(s, sigilo(bola, 1));
});

const raiz = new URL('../', import.meta.url);
const fontes = { EMSBird: parseFonte(fs.readFileSync(new URL('fontes/EMSBird.svg', raiz), 'utf8'), 'EMSBird'), arcano: gerarAlfabeto({ seed: 3 }) };
const ctx = { fontes, mao: { ...NEUTRA, base: [{ fonte: 'EMSBird', peso: 1 }] }, maoArcana: { ...NEUTRA, base: [{ fonte: 'arcano', peso: 1 }] }, seed: 1 };
const dentro = (pags, pg) => pags.flat(2).every(([x, y]) => x >= -0.01 && x <= pg.largura + 0.01 && y >= -0.01 && y <= pg.altura + 0.01);

test('toda folha de A5 a A8 recebe a magia em uma página, dentro do papel', () => {
  for (const nome of Object.keys(FOLHAS)) {
    for (const paisagem of [false, true]) {
      const pg = folha(nome, paisagem);
      const r = comporGrimorio([bola], ctx, { tamanho: 3 }, pg);
      assert.equal(r.paginas.length, 1, nome);
      assert.ok(r.modos[bola.id].cabe, nome);
      assert.ok(dentro(r.paginas, pg), nome);
    }
  }
});

test('auto: completo no A5, resumo no A8', () => {
  assert.equal(comporGrimorio([bola], ctx, { tamanho: 3 }, folha('A5')).modos[bola.id].completo, true);
  assert.equal(comporGrimorio([bola], ctx, { tamanho: 3 }, folha('A8')).modos[bola.id].completo, false);
});

test('grimório flui várias magias na mesma página; scroll usa uma página por magia', () => {
  const tres = [1, 2, 3].map((i) => ({ ...bola, id: 'm' + i }));
  const cfg = { tamanho: 3, completo: 'nao', sigilo: 0.2 };
  assert.equal(comporGrimorio(tres, ctx, { ...cfg, porPagina: true }, folha('A5')).paginas.length, 3);
  assert.ok(comporGrimorio(tres, ctx, { ...cfg, porPagina: false }, folha('A5')).paginas.length < 3);
});

test('cifrado não deixa glifo ausente; chave acrescenta página', () => {
  const pg = folha('A6');
  const r = comporGrimorio([bola], ctx, { cifrar: { nome: true, ficha: true, efeito: true }, chave: true, completo: 'nao' }, pg);
  assert.deepEqual(r.avisos, []);
  assert.ok(r.paginas.length >= 2);
  assert.ok(dentro(r.paginas, pg));
});

test('sigilo desenhado à mão substitui o gerado', () => {
  const meu = [[[-1, -1], [1, 1]]];
  const a = comporGrimorio([bola], ctx, { moldura: false, completo: 'nao' }, folha('A6'));
  const b = comporGrimorio([bola], { ...ctx, sigilos: { [bola.id]: meu } }, { moldura: false, completo: 'nao' }, folha('A6'));
  assert.ok(b.paginas[0].length < a.paginas[0].length);
});
