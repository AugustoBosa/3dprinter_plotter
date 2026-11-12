// Converte uma magia no formato 5etools para a ficha em pt-BR usada pelo grimório.

export const ESCOLAS = { A: 'Abjuração', C: 'Conjuração', D: 'Adivinhação', E: 'Encantamento', V: 'Evocação', I: 'Ilusão', N: 'Necromancia', T: 'Transmutação' };
const ATRIBUTOS = { strength: 'FOR', dexterity: 'DES', constitution: 'CON', intelligence: 'INT', wisdom: 'SAB', charisma: 'CAR' };
const DANOS = { acid: 'ácido', bludgeoning: 'concussão', cold: 'frio', fire: 'fogo', force: 'energia', lightning: 'elétrico', necrotic: 'necrótico', piercing: 'perfurante', poison: 'veneno', psychic: 'psíquico', radiant: 'radiante', slashing: 'cortante', thunder: 'trovão' };
const CONDICOES = { blinded: 'cego', charmed: 'enfeitiçado', deafened: 'surdo', exhaustion: 'exaustão', frightened: 'amedrontado', grappled: 'agarrado', incapacitated: 'incapacitado', invisible: 'invisível', paralyzed: 'paralisado', petrified: 'petrificado', poisoned: 'envenenado', prone: 'caído', restrained: 'impedido', stunned: 'atordoado', unconscious: 'inconsciente' };
const CLASSES = { Artificer: 'Artífice', Bard: 'Bardo', Cleric: 'Clérigo', Druid: 'Druida', Paladin: 'Paladino', Ranger: 'Patrulheiro', Sorcerer: 'Feiticeiro', Warlock: 'Bruxo', Wizard: 'Mago' };
const UNIDADES = { round: ['rodada', 'rodadas'], minute: ['minuto', 'minutos'], hour: ['hora', 'horas'], day: ['dia', 'dias'], action: ['ação', 'ações'], bonus: ['ação bônus', 'ações bônus'], reaction: ['reação', 'reações'] };
const FORMAS = { radius: 'raio', sphere: 'esfera', hemisphere: 'hemisfério', cone: 'cone', line: 'linha', cube: 'cubo' };

const num = (n) => String(+n.toFixed(1)).replace('.', ',');
const qtd = (n, unidade) => `${n} ${UNIDADES[unidade]?.[n === 1 ? 0 : 1] ?? unidade}`;
// 5 pés = 1,5 m e 1 milha = 1,5 km, como no Livro do Jogador em português.
const distancia = (d) => (d.type === 'miles' ? `${num(d.amount * 1.5)} km` : `${num(d.amount * 0.3)} m`);

// Tira as marcações {@tag a|b|c} do 5etools, deixando só o texto que se lê.
export function limpar(s) {
  let antes;
  do {
    antes = s;
    s = s.replace(/\{@(\w+) ([^{}]*)\}/g, (_, tag, corpo) => {
      const p = corpo.split('|');
      if (tag === 'scaledamage' || tag === 'scaledice') return p[2] ?? p[0];
      if (tag === 'hit' || tag === 'd20') return '+' + p[0];
      if (tag === 'dc') return 'CD ' + p[0];
      if (tag === 'chance') return p[0] + '%';
      return p[2] || p[0];
    });
  } while (s !== antes);
  return s;
}

function paragrafos(entradas) {
  const out = [];
  for (const e of entradas ?? []) {
    if (typeof e === 'string') out.push(limpar(e));
    else if (e.type === 'list') out.push(...paragrafos(e.items).map((i) => '- ' + i));
    else if (e.type === 'table') {
      for (const linha of e.rows ?? []) out.push(linha.map((c) => limpar(typeof c === 'string' ? c : String(c?.roll?.exact ?? c?.entry ?? ''))).join(' | '));
    } else {
      const filhos = paragrafos(e.entries ?? (e.entry ? [e.entry] : []));
      if (e.name && filhos.length) filhos[0] = `${limpar(e.name)}. ${filhos[0]}`;
      out.push(...filhos);
    }
  }
  return out;
}

function alcance(r) {
  const d = r.distance;
  if (!d) return 'Especial';
  if (r.type !== 'point') return `Pessoal (${FORMAS[r.type] ?? r.type} de ${distancia(d)})`;
  return { self: 'Pessoal', touch: 'Toque', sight: 'Visão', unlimited: 'Ilimitado' }[d.type] ?? distancia(d);
}

function duracao(d) {
  if (!d) return 'Especial';
  if (d.type === 'instant') return 'Instantânea';
  if (d.type === 'permanent') return 'Até ser dissipada';
  if (d.type !== 'timed') return 'Especial';
  const t = qtd(d.duration.amount, d.duration.type);
  return d.concentration ? `Concentração, até ${t}` : t;
}

// Resumo mecânico tirado dos dados (não depende de tradução): ataque, resistência, dano, condições, custo.
function mecanica(m) {
  const partes = [];
  const bruto = JSON.stringify([m.entries, m.entriesHigherLevel ?? []]);
  for (const a of m.spellAttack ?? []) partes.push(a === 'M' ? 'Ataque mágico corpo a corpo' : 'Ataque mágico à distância');
  if (m.savingThrow?.length) partes.push('Res. ' + m.savingThrow.map((s) => ATRIBUTOS[s] ?? s).join('/'));
  const dano = bruto.match(/\{@damage ([^}|]+)/)?.[1];
  const tipos = (m.damageInflict ?? []).map((t) => DANOS[t] ?? t).join('/');
  if (dano) partes.push(tipos ? `${dano} ${tipos}` : dano);
  const escala = bruto.match(/\{@scaled(?:amage|ice) [^}|]*\|[^}|]*\|([^}|]+)/)?.[1];
  if (escala) partes.push(`+${escala} por nível acima`);
  if (m.conditionInflict?.length) partes.push(m.conditionInflict.map((c) => CONDICOES[c] ?? c).join(', '));
  const mat = m.components?.m;
  if (mat?.cost) partes.push(`M: ${num(mat.cost / 100)} po${mat.consume ? ' (consumido)' : ''}`);
  return partes.join(' · ');
}

// `traducao` = { nome, resumo } opcional.
export function normalizar(m, id, traducao = {}) {
  const t0 = m.time?.[0] ?? { number: 1, unit: 'action' };
  const d0 = m.duration?.[0];
  const ritual = !!m.meta?.ritual;
  const escola = ESCOLAS[m.school] ?? m.school;
  const c = m.components ?? {};
  return {
    id,
    nome: traducao.nome ?? m.name,
    nomeEn: m.name,
    fonte: m.source,
    nivel: m.level,
    escola: m.school,
    linhaNivel: (m.level === 0 ? `Truque de ${escola}` : `${escola} de ${m.level}º nível`) + (ritual ? ' (ritual)' : ''),
    tempo: qtd(t0.number, t0.unit),
    alcance: alcance(m.range),
    comp: [c.v && 'V', c.s && 'S', c.m && 'M'].filter(Boolean).join(', '),
    duracao: duracao(d0),
    conc: !!d0?.concentration,
    ritual,
    classes: (m.classes?.class ?? []).map((k) => CLASSES[k.name] ?? k.name),
    mec: mecanica(m),
    resumo: traducao.resumo ?? '',
    texto: paragrafos(m.entries).join('\n'),
    superior: paragrafos(m.entriesHigherLevel).join('\n'),
  };
}

// Magia em branco para digitar à mão (página publicada, sem dados locais).
export function magiaVazia() {
  return { id: 'manual-' + Date.now(), nome: 'Nova magia', nomeEn: '', fonte: '', nivel: 1, escola: 'V', linhaNivel: 'Evocação de 1º nível', tempo: '1 ação', alcance: '18 m', comp: 'V, S', duracao: 'Instantânea', conc: false, ritual: false, classes: [], mec: '', resumo: '', texto: '', superior: '' };
}

// Textos dos três blocos do scroll. `completo` troca o resumo pela descrição inteira.
export function blocos(m, completo) {
  const ficha = [m.linhaNivel, `Tempo: ${m.tempo}`, `Alcance: ${m.alcance}`, `Comp.: ${m.comp}`, `Duração: ${m.duracao}`].join('\n');
  const curto = [m.mec, m.resumo].filter(Boolean).join('\n') || m.texto.split(/(?<=\.)\s/)[0];
  const longo = [m.texto, m.superior].filter(Boolean).join('\n');
  return { nome: m.nome, ficha, efeito: completo && longo ? longo : curto };
}
