import { NEUTRA, EXECUCAO } from './mao.js';

// Devolve uma cópia da mão do personagem com a variação aplicada (sem mutar p).
export function resolver(p, variacao) {
  const base = structuredClone(p.mao);
  if (variacao === undefined || variacao === null) return base;
  const extra = p.variacoes?.[variacao];
  if (!extra) throw new Error('variação desconhecida: ' + variacao);
  for (const chave of Object.keys(extra)) {
    if (!EXECUCAO.includes(chave)) throw new Error('chave de identidade na variação: ' + chave);
  }
  return { ...base, ...structuredClone(extra) };
}

// Lista de erros de um personagem; vazia = ok. Não verifica se a fonte existe em disco.
export function validar(p) {
  const erros = [];
  if (typeof p.nome !== 'string' || p.nome === '') erros.push('nome vazio ou inválido');
  if (!p.mao) return [...erros, 'mao ausente'];
  for (const chave of Object.keys(NEUTRA)) {
    if (!(chave in p.mao)) erros.push('mao sem chave: ' + chave);
  }
  const b = p.mao.base;
  if (!Array.isArray(b) || b.length === 0) erros.push('mao.base vazio ou inválido');
  else {
    for (const it of b) {
      if (typeof it?.fonte !== 'string' || !(typeof it?.peso === 'number' && it.peso > 0)) {
        erros.push('item de base inválido: ' + JSON.stringify(it));
      }
    }
  }
  for (const chave of Object.keys(NEUTRA)) {
    if (chave === 'base') continue;
    if (!Number.isFinite(p.mao[chave])) erros.push('valor não numérico: ' + chave);
  }
  for (const chave of ['idio', 'pressa', 'capricho', 'variacao', 'desleixo']) {
    const v = p.mao[chave];
    if (Number.isFinite(v) && (v < 0 || v > 1)) erros.push(chave + ' fora de [0,1]: ' + v);
  }
  for (const [nome, extra] of Object.entries(p.variacoes ?? {})) {
    for (const [chave, v] of Object.entries(extra)) {
      if (!EXECUCAO.includes(chave)) erros.push(`variação ${nome}: chave de identidade ${chave}`);
      else if (!Number.isFinite(v)) erros.push(`variação ${nome}: valor não numérico em ${chave}`);
    }
  }
  return erros;
}
