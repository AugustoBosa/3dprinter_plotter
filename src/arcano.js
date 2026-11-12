// Escrita arcana: alfabeto cifrado gerado por seed, sigilo por magia e moldura. Tudo em traço único.
import { rng, hash } from './rng.js';

export const LETRAS = 'abcdefghijklmnopqrstuvwxyz0123456789';
export const CAIXA = { largura: 500, altura: 700 }; // caixa de uma letra, em unidades da fonte (y para cima)
const COLS = [0, 250, 500];
const LINS = [0, 233, 467, 700];

// Segmento reto ou curvo (bezier quadrática) entre dois pontos, sem repetir o primeiro ponto.
function segmento([ax, ay], [bx, by], curva) {
  if (curva === 0) return [[bx, by]];
  const mx = (ax + bx) / 2 - (by - ay) * curva, my = (ay + by) / 2 + (bx - ax) * curva;
  const pts = [];
  for (let i = 1; i <= 6; i++) {
    const t = i / 6, u = 1 - t;
    pts.push([u * u * ax + 2 * u * t * mx + t * t * bx, u * u * ay + 2 * u * t * my + t * t * by]);
  }
  return pts;
}

function circulo(cx, cy, r, n = 12) {
  return Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos((i * 2 * Math.PI) / n), cy + r * Math.sin((i * 2 * Math.PI) / n)]);
}

// Uma letra: caminhada por uma grade 3x4, com levantadas de caneta e um enfeite ocasional.
function letra(r, estilo) {
  const no = () => [Math.floor(r() * 3), Math.floor(r() * 4)];
  const ponto = ([c, l]) => [COLS[c], LINS[l]];
  const usados = new Set();
  const tracos = [];
  let atual = no();
  let traco = [ponto(atual)];
  const visitados = [atual];
  const nSeg = 3 + Math.floor(r() * (1 + estilo.complexidade * 3));
  for (let i = 0; i < nSeg; i++) {
    if (i > 0 && r() < 0.25) { // levanta a caneta e recomeça de um nó já visitado
      if (traco.length > 1) tracos.push(traco);
      atual = visitados[Math.floor(r() * visitados.length)];
      traco = [ponto(atual)];
    }
    let prox, chave, tentativas = 0;
    do {
      prox = no();
      chave = [atual, prox].map(String).sort().join('>');
    } while ((String(prox) === String(atual) || usados.has(chave)) && ++tentativas < 20);
    if (tentativas >= 20) break;
    usados.add(chave);
    const curva = estilo.curva * 0.35 * (r() < 0.5 ? -1 : 1) * (r() < estilo.curva ? 1 : 0);
    traco.push(...segmento(ponto(atual), ponto(prox), curva));
    atual = prox;
    visitados.push(atual);
  }
  if (traco.length > 1) tracos.push(traco);
  if (r() < 0.3) { // enfeite: anel pequeno ao lado de um nó
    const [x, y] = ponto(visitados[Math.floor(r() * visitados.length)]);
    tracos.push(circulo(Math.min(440, Math.max(60, x)), Math.min(640, Math.max(60, y)), 55));
  }
  return { tracos, assinatura: [...usados].sort().join(';') };
}

// Fonte no mesmo formato de parseFonte. `letras` = desenhos feitos à mão que substituem os gerados.
export function gerarAlfabeto(estilo = {}, letras = {}) {
  const e = { seed: 1, curva: 0.4, complexidade: 0.5, ...estilo };
  const glifos = { ' ': { adv: 450, tracos: [] }, '.': { adv: 350, tracos: [[[100, 0], [100, 120]]] } };
  const vistas = new Set();
  for (const ch of LETRAS) {
    let g, n = 0;
    do g = letra(rng(`${e.seed}|${ch}|${n}`), e); while (vistas.has(g.assinatura) && ++n < 20);
    vistas.add(g.assinatura);
    glifos[ch] = { adv: 680, tracos: letras[ch] ?? g.tracos };
  }
  return { nome: 'arcano', upm: 1000, ascent: 800, descent: -200, advPadrao: 680, glifos };
}

// Reduz o texto ao que o alfabeto arcano tem: a-z, 0-9, espaço e ponto (toda pontuação vira ponto).
export function cifrar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[,;:!?]/g, '.').replace(/[^a-z0-9. \n]/g, ' ').replace(/ +/g, ' ');
}

// Miolo do sigilo por escola, em raio 1.
const MIOLO = {
  A: () => [[[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]], [[0, -1], [0, 1]]],
  C: () => [Array.from({ length: 31 }, (_, i) => { const a = i * 0.35, q = i / 30; return [q * Math.cos(a), q * Math.sin(a)]; })],
  D: () => [
    Array.from({ length: 13 }, (_, i) => [-1 + i / 6, -0.6 * Math.sin((i * Math.PI) / 12)]),
    Array.from({ length: 13 }, (_, i) => [-1 + i / 6, 0.6 * Math.sin((i * Math.PI) / 12)]),
    circulo(0, 0, 0.3),
  ],
  E: () => [Array.from({ length: 33 }, (_, i) => { const a = (i * Math.PI) / 16; return [Math.sin(a), Math.sin(a) * Math.cos(a) * 1.4]; })],
  V: () => [0, 1, 2, 3].map((i) => { const a = (i * Math.PI) / 4; return [[Math.cos(a), Math.sin(a)], [-Math.cos(a), -Math.sin(a)]]; }),
  I: () => [circulo(-0.35, 0, 0.65, 20), circulo(0.35, 0, 0.65, 20)],
  N: () => [[[-0.9, -0.7], [0.9, -0.7], [0, 0.8], [-0.9, -0.7]], [[0, -0.7], [0, 1]]],
  T: () => [[[0, -1], [0.9, 0.7], [-0.9, 0.7], [0, -1]], circulo(0, 0.1, 0.4)],
};

const mdc = (a, b) => (b ? mdc(b, a % b) : a);

// Sigilo de uma magia em coordenadas [-1,1] (y para baixo). O desenho codifica:
// pontas = nível + 2, miolo = escola, anel duplo = concentração, dentes = ritual, marcas no anel = V/S/M.
export function sigilo(m, seed = 0) {
  const h = hash(`${seed}|${m.id}`);
  const r = rng(h);
  const tracos = [circulo(0, 0, 0.9, 48)];
  if (m.conc) tracos.push(circulo(0, 0, 0.82, 48));
  if (m.ritual) for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; tracos.push([[0.9 * Math.cos(a), 0.9 * Math.sin(a)], [Math.cos(a), Math.sin(a)]]); }
  const R = m.conc ? 0.82 : 0.9;
  const rot = r() * 2 * Math.PI;
  const n = m.nivel + 2;
  if (m.nivel > 0) {
    const passos = [];
    for (let k = 1; k < n / 2; k++) if (mdc(n, k) === 1) passos.push(k);
    const k = passos[passos.length > 1 ? 1 + (h % (passos.length - 1)) : 0];
    tracos.push(Array.from({ length: n + 1 }, (_, i) => { const a = rot + (i * k * 2 * Math.PI) / n; return [R * Math.cos(a), R * Math.sin(a)]; }));
  } else tracos.push(circulo(0, 0, 0.5, 32));
  tracos.push(...(MIOLO[m.escola] ?? MIOLO.V)().map((t) => t.map(([x, y]) => [x * 0.28, y * 0.28])));
  const raios = 2 + (h % 3); // riscos curtos que diferenciam magias de mesma escola e nível
  for (let i = 0; i < raios; i++) { const a = r() * 2 * Math.PI; tracos.push([[0.34 * Math.cos(a), 0.34 * Math.sin(a)], [0.46 * Math.cos(a), 0.46 * Math.sin(a)]]); }
  const marca = (a, t) => t.map(([x, y]) => [0.9 * Math.cos(a) + x * 0.07, 0.9 * Math.sin(a) + y * 0.07]);
  if (/V/.test(m.comp)) tracos.push(marca(-Math.PI / 2, [[0, -1.2], [0, 1.2]]));
  if (/S/.test(m.comp)) tracos.push(marca(Math.PI * 5 / 6, circulo(0, 0, 1, 8)));
  if (/M/.test(m.comp)) tracos.push(marca(Math.PI / 6, [[0, -1], [0.9, 0.7], [-0.9, 0.7], [0, -1]]));
  return tracos;
}

// Moldura dupla com losangos nos cantos, dentro das margens.
export function moldura(pagina) {
  const a = Math.min(...Object.values(pagina.margens)) * 0.4;
  const ret = (d) => [[d, d], [pagina.largura - d, d], [pagina.largura - d, pagina.altura - d], [d, pagina.altura - d], [d, d]];
  const q = a * 0.5;
  const cantos = [[a, a], [pagina.largura - a, a], [pagina.largura - a, pagina.altura - a], [a, pagina.altura - a]]
    .map(([x, y]) => [[x - q, y], [x, y - q], [x + q, y], [x, y + q], [x - q, y]]);
  return [ret(a), ret(a + q * 1.2), ...cantos];
}
