import { glifo } from './mao.js';
import { rng } from './rng.js';

export const PAGINAS = {
  A4: { largura: 210, altura: 297, margens: { topo: 20, dir: 20, base: 20, esq: 20 } },
  A5: { largura: 148, altura: 210, margens: { topo: 15, dir: 15, base: 15, esq: 15 } },
  mesa: { largura: 210, altura: 210, margens: { topo: 15, dir: 15, base: 15, esq: 15 } },
};

// Quebra o texto em linhas de saída (null = linha em branco) já com largura medida.
// `gastar(s)` avanca o contador de ocorrencias quando a palavra e colocada (igual ao desenho).
function quebrar(texto, medir, gastar, espaco, W, avisos) {
  const linhas = [];
  for (const entrada of texto.split('\n')) {
    if (entrada.trim() === '') { linhas.push(null); continue; }
    const saida = [];
    let atual = { pals: [], w: 0 };
    const fecha = (just) => {
      saida.push({ pals: atual.pals, w: atual.w, just });
      atual = { pals: [], w: 0 };
    };
    for (const p of entrada.split(' ').filter(Boolean)) {
      const w = medir(p);
      if (atual.pals.length && atual.w + espaco + w <= W) {
        atual.pals.push(p);
        atual.w += espaco + w;
        gastar(p);
        continue;
      }
      if (atual.pals.length) fecha(true);
      if (w <= W) {
        atual = { pals: [p], w };
        gastar(p);
        continue;
      }
      // palavra maior que a linha: quebra por letra
      avisos.push(`palavra longa quebrada: ${p}`);
      let pedaco = '', wp = 0;
      for (const ch of p) {
        const a = medir(ch);
        if (pedaco && wp + a > W) {
          saida.push({ pals: [pedaco], w: wp, just: false });
          pedaco = ''; wp = 0;
        }
        pedaco += ch; wp += a;
        gastar(ch);
      }
      atual = { pals: [pedaco], w: wp };
    }
    fecha(false);
    linhas.push(...saida);
  }
  return linhas;
}

export function compor(texto, fontes, mao, pagina, opcoes = {}) {
  const tamanho = opcoes.tamanho ?? 6;
  const entrelinha = opcoes.entrelinha ?? 1.6;
  const alinhamento = opcoes.alinhamento ?? 'esquerda';
  const { margens } = pagina;
  const W = pagina.largura - margens.esq - margens.dir;
  const limite = pagina.altura - margens.base;
  const tol = tamanho * 0.3;
  const avisos = [`tolerancia de limites: ${tol} mm`];

  // Glifo ausente: troca tipografica por ASCII se a fonte nao tem; se ainda faltar, avisa.
  const tem = (ch) => mao.base.some((it) => fontes[it.fonte]?.glifos?.[ch]);
  const ASCII = { '“': '"', '”': '"', '‘': "'", '’': "'", '…': '...', '—': '-', '–': '-' };
  texto = texto.replace(/[“”‘’…—–]/g, (c) => (tem(c) ? c : ASCII[c]));
  const faltam = new Set([...texto].filter((c) => c.trim() && !tem(c)));
  for (const c of faltam) avisos.push(`glifo ausente: ${c}`);

  // Mede com as mesmas ocorrencias que o desenho usara (variacao/pressa mudam a largura).
  const cont = new Map();
  const medir = (s) => {
    const loc = new Map();
    let w = 0;
    for (const ch of s) {
      const n = loc.get(ch) ?? 0;
      loc.set(ch, n + 1);
      w += glifo(fontes, mao, ch, (cont.get(ch) ?? 0) + n).adv * tamanho;
    }
    return w;
  };
  const gastar = (s) => { for (const ch of s) cont.set(ch, (cont.get(ch) ?? 0) + 1); };
  const espaco = (glifo(fontes, mao, ' ', 0).adv + mao.espacoPalavra) * tamanho;
  const linhas = quebrar(texto, medir, gastar, espaco, W, avisos);

  const r = rng(mao.seed + '|tremor');
  const ocor = new Map();
  const base = (k) => margens.topo + tamanho + k * tamanho * entrelinha + mao.queda * k;

  const paginas = [[]];
  let pag = paginas[0];
  let k = 0;

  const desenhar = (L, y) => {
    const n = L.pals.length;
    const extra = alinhamento === 'justificado' && L.just && n > 1 ? (W - L.w) / (n - 1) : 0;
    let x = margens.esq;
    if (alinhamento === 'centro') x += (W - L.w) / 2;
    for (let i = 0; i < n; i++) {
      if (i > 0) x += espaco + extra;
      for (const ch of L.pals[i]) {
        const oc = ocor.get(ch) ?? 0;
        ocor.set(ch, oc + 1);
        const g = glifo(fontes, mao, ch, oc);
        for (const t of g.tracos) {
          if (t.length === 0) continue;
          pag.push(t.map(([px, py]) => {
            const tx = (r() - 0.5) * 2 * mao.tremor;
            const ty = (r() - 0.5) * 2 * mao.tremor;
            return [x + px * tamanho + tx, y - py * tamanho + ty];
          }));
        }
        x += g.adv * tamanho;
      }
    }
  };

  for (const L of linhas) {
    if (L === null && k === 0) continue; // em branco no topo da página é ignorada
    if (k > 0 && base(k) > limite) {
      pag = [];
      paginas.push(pag);
      k = 0;
      if (L === null) continue;
    }
    if (L === null) { k++; continue; }
    desenhar(L, base(k));
    k++;
  }

  return { paginas, avisos };
}
