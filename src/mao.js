import { rng, hash } from './rng.js';

export const IDENTIDADE = ['base', 'seed', 'inclinacao', 'largura', 'altura', 'espacamento', 'espacoPalavra', 'idio'];
export const EXECUCAO = ['pressa', 'capricho', 'tremor', 'queda', 'compressao', 'variacao', 'desleixo'];
export const NEUTRA = { base: [], seed: 0, inclinacao: 0, largura: 1, altura: 1, espacamento: 0, espacoPalavra: 0, idio: 0, pressa: 0, capricho: 1, tremor: 0, queda: 0, compressao: 1, variacao: 0, desleixo: 0 };

const N = 32;

function dist([ax, ay], [bx, by]) {
  return Math.hypot(bx - ax, by - ay);
}

// Reamostra um traço em N pontos igualmente espaçados por comprimento de arco.
function reamostrar(pts) {
  if (pts.length === 0) return [];
  const d = [0];
  for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + dist(pts[i - 1], pts[i]));
  const L = d[d.length - 1];
  if (L === 0) return Array.from({ length: N }, () => [...pts[0]]);
  const out = [];
  let j = 0;
  for (let k = 0; k < N; k++) {
    const s = (L * k) / (N - 1);
    while (j < pts.length - 2 && d[j + 1] < s) j++;
    const seg = d[j + 1] - d[j];
    const u = seg > 0 ? Math.min(1, Math.max(0, (s - d[j]) / seg)) : 0;
    const [ax, ay] = pts[j], [bx, by] = pts[j + 1];
    out.push([ax + (bx - ax) * u, ay + (by - ay) * u]);
  }
  return out;
}

export function misturar(glifoA, glifoB, t) {
  if (glifoA.tracos.length !== glifoB.tracos.length) return null;
  if (t === 0) return structuredClone(glifoA);
  if (t === 1) return structuredClone(glifoB);
  const tracos = glifoA.tracos.map((ta, i) => {
    const pa = reamostrar(ta);
    const pb = reamostrar(glifoB.tracos[i]);
    return pa.map(([ax, ay], k) => [(1 - t) * ax + t * pb[k][0], (1 - t) * ay + t * pb[k][1]]);
  });
  return { adv: (1 - t) * glifoA.adv + t * glifoB.adv, tracos };
}

// Escolhe/mistura os candidatos (já em em) segundo os pesos.
function escolher(cands, ch, seed) {
  const total = cands.reduce((s, c) => s + c.peso, 0);
  if (cands.length === 1 || total === 0) return cands[0].g;
  let g = cands[0].g, acc = cands[0].peso, ok = true;
  for (let i = 1; i < cands.length && ok; i++) {
    const p = cands[i].peso;
    const m = misturar(g, cands[i].g, acc + p > 0 ? p / (acc + p) : 0);
    if (m === null) ok = false;
    else { g = m; acc += p; }
  }
  if (ok) return g;
  const u = (hash(ch + seed) % 10000) / 10000;
  let cum = 0;
  for (const c of cands) {
    cum += c.peso / total;
    if (cum > u) return c.g;
  }
  return cands[cands.length - 1].g;
}

export function glifo(fontes, mao, ch, ocorrencia) {
  const cands = [];
  for (const it of mao.base) {
    const f = fontes[it.fonte];
    const g = f?.glifos?.[ch];
    if (!g) continue;
    cands.push({
      peso: it.peso,
      g: { adv: g.adv / f.upm, tracos: g.tracos.map(t => t.map(([x, y]) => [x / f.upm, y / f.upm])) },
    });
  }
  if (cands.length === 0) {
    const f = mao.base.map(it => fontes[it.fonte]).find(Boolean);
    return { adv: f ? f.advPadrao / f.upm : 0.4, tracos: [] };
  }
  const g = escolher(cands, ch, mao.seed);

  // Identidade: fixa por caractere, não depende da ocorrência.
  const ri = rng(mao.seed + '|' + ch + '|idio');
  const sx = 1 + (ri() - 0.5) * mao.idio * 0.2;
  const sy = 1 + (ri() - 0.5) * mao.idio * 0.2;
  const dx = (ri() - 0.5) * mao.idio * 0.1;
  const dy = (ri() - 0.5) * mao.idio * 0.1;
  const tan = Math.tan(mao.inclinacao * Math.PI / 180);
  let adv = g.adv * sx * mao.largura;
  let tracos = g.tracos.map(t => t.map(([x, y]) => {
    const x1 = (x * sx + dx) * mao.largura;
    const y1 = (y * sy + dy) * mao.altura;
    return [x1 + y1 * tan, y1];
  }));

  // Execução: varia por ocorrência.
  const re = rng(mao.seed + '|' + ch + '|' + ocorrencia);
  const ex = 1 + (re() - 0.5) * mao.variacao * 0.2;
  const ey = 1 + (re() - 0.5) * mao.variacao * 0.2;
  const ox = (re() - 0.5) * mao.variacao * 0.08;
  const oy = (re() - 0.5) * mao.variacao * 0.08;
  const amp = mao.desleixo * 0.03 * (1 - mao.capricho);
  tracos = tracos.map(t => t.map(([x0, y0]) => {
    let x = x0 * ex + ox;
    let y = y0 * ey + oy;
    x += y * 0.3 * mao.pressa;
    x += (re() - 0.5) * 2 * amp;
    y += (re() - 0.5) * 2 * amp;
    return [x, y];
  }));
  adv = adv * ex * mao.compressao * (1 - 0.2 * mao.pressa) + mao.espacamento;
  adv = Math.max(0, adv);

  return { adv, tracos };
}

export function mutar(mao, seed, forca) {
  const m = structuredClone(mao);
  const r = rng(seed);
  const j = () => (r() - 0.5) * 2;
  m.seed = Math.floor(r() * 2147483647);
  m.inclinacao += j() * forca * 10;
  m.largura *= 1 + j() * forca * 0.2;
  m.altura *= 1 + j() * forca * 0.2;
  m.espacamento += j() * forca * 0.05;
  m.espacoPalavra += j() * forca * 0.05;
  m.idio = Math.min(1, Math.max(0, m.idio + j() * forca * 0.3));
  for (const item of m.base) {
    item.peso = Math.max(0.01, item.peso * (1 + j() * forca * 0.5));
  }
  return m;
}
