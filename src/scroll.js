// Monta scrolls e grimórios: empilha nome, sigilo, ficha e efeito de cada magia nas páginas.
import { compor } from './layout.js';
import { glifo } from './mao.js';
import { blocos } from './magia.js';
import { cifrar, sigilo, moldura, LETRAS } from './arcano.js';

// [largura, altura, margem] em mm.
export const FOLHAS = { A5: [148, 210, 12], A6: [105, 148, 9], A7: [74, 105, 6], A8: [52, 74, 4] };

export function folha(nome, paisagem = false, margem) {
  const [l, a, m0] = FOLHAS[nome];
  const m = margem ?? m0;
  return { largura: paisagem ? a : l, altura: paisagem ? l : a, margens: { topo: m, dir: m, base: m, esq: m } };
}

export const CFG_PADRAO = {
  tamanho: 4, minimo: 2.5, entrelinha: 1.5,
  sigilo: 0.35,           // diâmetro do sigilo como fração do menor lado útil; 0 = sem sigilo
  moldura: true,
  cifrar: { nome: false, ficha: false, efeito: false },
  completo: 'auto',       // 'auto' = texto completo se couber, senão resumo | 'sim' | 'nao'
  porPagina: true,        // true = um scroll por página; false = grimório, as magias fluem
  chave: false,           // acrescenta a página com a chave do alfabeto
};

// ctx = { fontes (inclui 'arcano'), mao, maoArcana, sigilos: { id: traços desenhados à mão }, seed }
// Devolve { pags: [traços por página], fim } começando em `topo` na primeira página.
function comporMagia(m, ctx, cfg, pagina, topo, { tamanho, completo, sigilo: comSigilo }) {
  const b = blocos(m, completo);
  const { margens } = pagina;
  const W = pagina.largura - margens.esq - margens.dir;
  const limite = pagina.altura - margens.base;
  const pags = [[]];
  const avisos = [];
  let y = topo;

  const bloco = (chave, tam, alinhamento) => {
    if (!b[chave]) return;
    const cif = cfg.cifrar[chave];
    const r = compor(cif ? cifrar(b[chave]) : b[chave], ctx.fontes, cif ? ctx.maoArcana : ctx.mao, pagina,
      { tamanho: tam, entrelinha: cfg.entrelinha, alinhamento, topo: y });
    pags[pags.length - 1].push(...r.paginas[0]);
    for (const p of r.paginas.slice(1)) pags.push(p);
    for (const a of r.avisos) if (a.startsWith('glifo ausente')) avisos.push(`${m.nome}: ${a}`);
    y = r.fim + tam * 0.9;
  };

  bloco('nome', tamanho * 1.4, 'centro');
  const d = !comSigilo ? 0 : cfg.sigilo * Math.min(W, limite - margens.topo);
  if (d > 0) {
    if (y + d > limite && y > margens.topo) { pags.push([]); y = margens.topo; }
    const cx = margens.esq + W / 2, cy = y + d / 2;
    const tr = ctx.sigilos?.[m.id] ?? sigilo(m, ctx.seed);
    pags[pags.length - 1].push(...tr.map((t) => t.map(([x, yy]) => [cx + (x * d) / 2, cy + (yy * d) / 2])));
    y += d + tamanho * 0.5;
  }
  bloco('ficha', tamanho, 'esquerda');
  bloco('efeito', tamanho, 'esquerda');
  return { pags, fim: y, avisos };
}

// Escolhe o modo para a magia caber numa página vazia: completo (diminuindo a letra até o mínimo), depois resumo, depois sem sigilo.
function ajustar(m, ctx, cfg, pagina) {
  const tenta = (modo) => comporMagia(m, ctx, cfg, pagina, pagina.margens.topo, modo).pags.length === 1 && { ...modo, cabe: true };
  const cheio = { tamanho: cfg.tamanho, completo: true, sigilo: true };
  if (cfg.completo === 'sim') return { ...cheio, cabe: true };
  const modos = [[false, true], [false, false]];
  if (cfg.completo === 'auto') modos.unshift([true, true]);
  for (const [completo, sigilo] of modos) {
    for (let tamanho = cfg.tamanho; tamanho >= cfg.minimo - 1e-9; tamanho -= 0.25) {
      const ok = tenta({ tamanho, completo, sigilo });
      if (ok) return ok;
    }
  }
  return { tamanho: cfg.minimo, completo: false, sigilo: false, cabe: false };
}

// Página(s) com cada letra legível ao lado do símbolo arcano.
function chave(ctx, cfg, pagina) {
  const { margens } = pagina;
  const tam = cfg.tamanho;
  const lw = tam * 3.2, lh = tam * 2;
  const cols = Math.max(1, Math.floor((pagina.largura - margens.esq - margens.dir) / lw));
  const lins = Math.max(1, Math.floor((pagina.altura - margens.topo - margens.base) / lh));
  const pags = [];
  [...LETRAS].forEach((ch, i) => {
    const k = i % (cols * lins);
    if (k === 0) pags.push([]);
    const x = margens.esq + (k % cols) * lw, y = margens.topo + Math.floor(k / cols) * lh + tam * 1.2;
    const por = (g, x0) => g.tracos.filter((t) => t.length).map((t) => t.map(([px, py]) => [x0 + px * tam, y - py * tam]));
    const leg = glifo(ctx.fontes, ctx.mao, ch, 0);
    pags[pags.length - 1].push(...por(leg, x), ...por(glifo(ctx.fontes, ctx.maoArcana, ch, 0), x + leg.adv * tam + tam * 0.6));
  });
  return pags;
}

// Devolve { paginas: [traços], avisos, modos: { id: { tamanho, completo, sigilo, cabe } } }.
export function comporGrimorio(magias, ctx, cfgParcial, pagina) {
  const cfg = { ...CFG_PADRAO, ...cfgParcial, cifrar: { ...CFG_PADRAO.cifrar, ...cfgParcial?.cifrar } };
  const { margens } = pagina;
  const paginas = [];
  const avisos = [];
  const modos = {};
  let y = margens.topo;
  for (const m of magias) {
    const modo = ajustar(m, ctx, cfg, pagina);
    modos[m.id] = modo;
    if (!modo.cabe) avisos.push(`${m.nome}: não coube em uma página nem no tamanho mínimo`);
    else if (!modo.sigilo && cfg.sigilo > 0) avisos.push(`${m.nome}: sem sigilo para caber na página`);
    const nova = cfg.porPagina || paginas.length === 0;
    let r = nova ? null : comporMagia(m, ctx, cfg, pagina, y + cfg.tamanho * 1.5, modo);
    if (!r || r.pags.length > 1) { // não cabe no resto da página: começa em página nova
      r = comporMagia(m, ctx, cfg, pagina, margens.topo, modo);
      paginas.push(...r.pags);
    } else {
      paginas[paginas.length - 1].push(...r.pags[0]);
    }
    avisos.push(...r.avisos);
    y = r.fim;
  }
  if (cfg.chave) paginas.push(...chave(ctx, cfg, pagina));
  if (cfg.moldura) for (const p of paginas) p.push(...moldura(pagina));
  return { paginas, avisos: [...new Set(avisos)], modos };
}
