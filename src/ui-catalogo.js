import { CATALOGO, EIXOS, ARQUETIPOS } from './catalogo.js';
import { glifo, NEUTRA } from './mao.js';
import { ajuda } from './ajuda.js';

const SVG = 'http://www.w3.org/2000/svg';
const FRASE = 'Prezado Senhor, ação!';

let dialog = null;
let contexto = null; // { estado, aoMudar }
let selArquetipo = null;
let selEixo = null;

export function abrirCatalogo(estado, aoMudar) {
  contexto = { estado, aoMudar };
  if (!dialog) criar();
  reconstruirCorpo();
  dialog.showModal();
}

function criar() {
  if (!document.getElementById('estilo-catalogo')) {
    const style = document.createElement('style');
    style.id = 'estilo-catalogo';
    style.textContent = `
      #catalogo-fontes { width: min(1600px, 98vw); max-height: 90vh; overflow: auto; padding: 12px 16px; border: 1px solid #999; border-radius: 6px; }
      #catalogo-fontes .topo { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 8px; }
      #catalogo-fontes .fechar { margin-left: auto; }
      #catalogo-fontes table { border-collapse: collapse; width: 100%; font-size: 13px; }
      #catalogo-fontes th, #catalogo-fontes td { border-bottom: 1px solid #ddd; padding: 4px 6px; text-align: left; vertical-align: middle; }
      #catalogo-fontes th { position: sticky; top: 0; background: #fff; }
      #catalogo-fontes td.num { text-align: center; white-space: nowrap; }
      #catalogo-fontes tr.apta { background: #e6f4ea; }
      #catalogo-fontes .amostra svg { display: block; color: #111; }
      #catalogo-fontes .nome { font-weight: 600; font-size: 12px; }
      #catalogo-fontes .nome small { font-weight: 400; color: #666; }
      #catalogo-fontes td.desc { font-size: 12px; min-width: 220px; max-width: 320px; }
      #catalogo-fontes td.acoes { white-space: nowrap; }
    `;
    document.head.append(style);
  }

  dialog = document.createElement('dialog');
  dialog.id = 'catalogo-fontes';
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

  selArquetipo = selecionar([['', '(sem filtro)'], ...Object.entries(ARQUETIPOS).map(([k, a]) => [k, a.nome])]);
  selEixo = selecionar([['', '(ordem original)'], ...Object.entries(EIXOS).map(([k, e]) => [k, e.nome])]);

  const topo = document.createElement('div');
  topo.className = 'topo';
  topo.append(
    rotuloSelect('Filtrar por tipo de escritor', selArquetipo),
    rotuloSelect('Ordenar por', selEixo),
  );
  const fechar = botao('Fechar', () => dialog.close());
  fechar.className = 'fechar';
  topo.append(fechar);

  const tabela = document.createElement('table');
  const cabeca = document.createElement('tr');
  const titulo = (texto, ajudaEl) => {
    const th = document.createElement('th');
    th.append(texto);
    if (ajudaEl) th.append(' ', ajudaEl);
    cabeca.append(th);
  };
  titulo('Fonte e amostra');
  titulo('Ligação');
  for (const e of Object.values(EIXOS)) titulo(e.nome, ajuda(undefined, e.ajuda));
  for (const a of Object.values(ARQUETIPOS)) titulo(a.nome, ajuda(undefined, a.ajuda));
  titulo('Descrição');
  titulo('Ações');
  const thead = document.createElement('thead');
  thead.append(cabeca);
  tabela.append(thead, document.createElement('tbody'));

  dialog.append(topo, tabela);
  document.body.append(dialog);
}

function selecionar(opcoes) {
  const s = document.createElement('select');
  for (const [valor, texto] of opcoes) {
    const o = document.createElement('option');
    o.value = valor;
    o.textContent = texto;
    s.append(o);
  }
  s.addEventListener('change', reconstruirCorpo);
  return s;
}

function rotuloSelect(texto, select) {
  const l = document.createElement('label');
  l.append(texto, ' ', select);
  return l;
}

function botao(texto, aoClicar) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = texto;
  b.addEventListener('click', aoClicar);
  return b;
}

function reconstruirCorpo() {
  const arq = selArquetipo.value;
  const eixo = selEixo.value;
  const linhas = [...CATALOGO];
  if (eixo) linhas.sort((a, b) => b.eixos[eixo] - a.eixos[eixo]);
  else if (arq) linhas.sort((a, b) => b.aptidao[arq] - a.aptidao[arq]);
  dialog.querySelector('tbody').replaceChildren(...linhas.map(f => linha(f, arq)));
}

function linha(f, arq) {
  const tr = document.createElement('tr');
  if (arq && f.aptidao[arq] >= 2) tr.classList.add('apta');

  const celula = (conteudo, classe = '') => {
    const td = document.createElement('td');
    if (classe) td.className = classe;
    td.append(conteudo);
    tr.append(td);
    return td;
  };

  const nome = document.createElement('div');
  nome.className = 'nome';
  nome.append(f.fonte, ' ');
  const familia = document.createElement('small');
  familia.textContent = '· família ' + f.familia;
  nome.append(familia);
  celula(nome, 'amostra').append(amostra(contexto.estado, f.fonte));
  celula(f.ligacao);
  for (const [k, e] of Object.entries(EIXOS)) {
    const n = f.eixos[k];
    celula('●'.repeat(n) + '○'.repeat(5 - n), 'num').title = `${e.min} … ${e.max}`;
  }
  for (const k of Object.keys(ARQUETIPOS)) {
    celula('★'.repeat(f.aptidao[k]), 'num');
  }
  celula(f.descricao, 'desc');

  const acoes = document.createElement('span');
  acoes.append(
    botao('Usar', () => aplicar(() => {
      contexto.estado.personagem.mao.base = [{ fonte: f.fonte, peso: 1 }];
    })),
    ' ',
    botao('Misturar', () => aplicar(() => {
      const base = contexto.estado.personagem.mao.base;
      const item = base.find(i => i.fonte === f.fonte);
      if (item) item.peso = 0.5;
      else base.push({ fonte: f.fonte, peso: 0.5 });
    })),
  );
  celula(acoes, 'acoes');
  return tr;
}

function aplicar(alterar) {
  alterar();
  contexto.aoMudar();
  dialog.close();
}

// Desenha a frase na própria fonte. Sem a fonte carregada, mostra só o nome.
function amostra(estado, fonte) {
  if (!estado.fontes?.[fonte]) {
    const span = document.createElement('span');
    span.textContent = fonte;
    return span;
  }
  const svg = document.createElementNS(SVG, 'svg');
  const mao = { ...NEUTRA, base: [{ fonte, peso: 1 }] };
  const ocorrencias = {};
  let x0 = 0;
  for (const ch of FRASE) {
    const ocorrencia = ocorrencias[ch] ?? 0;
    ocorrencias[ch] = ocorrencia + 1;
    const g = glifo(estado.fontes, mao, ch, ocorrencia);
    for (const traco of g.tracos) {
      const pl = document.createElementNS(SVG, 'polyline');
      pl.setAttribute('fill', 'none');
      pl.setAttribute('stroke', 'currentColor');
      pl.setAttribute('stroke-width', '0.04');
      pl.setAttribute('stroke-linecap', 'round');
      pl.setAttribute('stroke-linejoin', 'round');
      pl.setAttribute('points', traco.map(([x, y]) => `${x0 + x},${-y}`).join(' '));
      svg.append(pl);
    }
    x0 += g.adv;
  }
  svg.setAttribute('viewBox', `0 -1 ${x0} 1.6`);
  svg.setAttribute('height', '30');
  svg.setAttribute('width', String(Math.round(x0 * 30 / 1.6)));
  return svg;
}
