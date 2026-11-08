import { resolver, validar } from './personagem.js';

const SLIDERS_IDENTIDADE = [
  ['inclinacao', -30, 30, 0.5], ['largura', 0.5, 1.5, 0.01], ['altura', 0.5, 1.5, 0.01],
  ['espacamento', -0.2, 0.3, 0.005], ['espacoPalavra', 0, 0.6, 0.01], ['idio', 0, 1, 0.01],
];
const SLIDERS_EXECUCAO = [
  ['pressa', 0, 1, 0.01], ['capricho', 0, 1, 0.01], ['tremor', 0, 2, 0.05], ['queda', -2, 2, 0.05],
  ['compressao', 0.6, 1.4, 0.01], ['variacao', 0, 1, 0.01], ['desleixo', 0, 1, 0.01],
];

function slug(nome) {
  return (nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'personagem';
}

// Restaura personagem salvo no localStorage. Qualquer erro: ignora.
export function restaurar(estado) {
  try {
    const salvo = JSON.parse(localStorage.getItem('writer.personagem'));
    const p = salvo?.personagem;
    if (!p || validar(p).length !== 0) return;
    if (typeof salvo.presetId === 'string' && salvo.presetId in estado.presets) estado.presetId = salvo.presetId;
    const chaves = Object.keys(p.variacoes ?? {});
    const v = salvo.variacao;
    estado.personagem = p;
    estado.variacao = v === '' || chaves.includes(v) ? v : (chaves.includes('formal') ? 'formal' : (chaves[0] ?? ''));
  } catch {}
}

export function montar(elemento, estado, aoMudar) {
  const sincs = [];
  let chavesVar = null;

  function preencher(sel, pares) {
    sel.replaceChildren(...pares.map(([valor, texto]) => new Option(texto, valor)));
    return sel;
  }
  function campo(texto, controle) {
    const l = document.createElement('label');
    l.append(texto + ' ', controle);
    return l;
  }
  function botao(texto, fn) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = texto;
    b.addEventListener('click', fn);
    return b;
  }
  function titulo(texto) {
    const h = document.createElement('h3');
    h.textContent = texto;
    return h;
  }

  const erro = document.createElement('p');
  erro.className = 'erro';

  // Preset
  const presetSel = preencher(document.createElement('select'),
    Object.keys(estado.presets).map(id => [id, estado.presets[id].nome]));
  presetSel.addEventListener('change', () => {
    const id = presetSel.value;
    estado.presetId = id;
    estado.personagem = structuredClone(estado.presets[id]);
    const chaves = Object.keys(estado.personagem.variacoes ?? {});
    estado.variacao = chaves.includes('formal') ? 'formal' : (chaves[0] ?? '');
    aoMudar();
  });

  // Variação
  const variacaoSel = document.createElement('select');
  variacaoSel.addEventListener('change', () => {
    estado.variacao = variacaoSel.value;
    aoMudar();
  });
  function reconstruirVariacoes() {
    const chaves = Object.keys(estado.personagem.variacoes ?? {});
    if (String(chaves) === String(chavesVar)) return;
    chavesVar = chaves;
    preencher(variacaoSel, [['', '(nenhuma)'], ...chaves.map(k => [k, k])]);
  }

  // Sliders: get/set recebem a chave via closure
  function slider([chave, min, max, passo], get, set) {
    const input = document.createElement('input');
    input.type = 'range';
    input.min = min; input.max = max; input.step = passo;
    const out = document.createElement('output');
    const l = document.createElement('label');
    l.className = 'slider';
    l.append(chave + ' ', input, ' ', out);
    input.addEventListener('input', () => {
      set(Number(input.value));
      aoMudar();
    });
    sincs.push(() => {
      const v = get();
      if (String(input.value) !== String(v)) input.value = v;
      out.textContent = String(v);
    });
    return l;
  }

  const blocosIdentidade = SLIDERS_IDENTIDADE.map(spec => {
    const chave = spec[0];
    return slider(spec, () => estado.personagem.mao[chave], v => { estado.personagem.mao[chave] = v; });
  });
  const blocosExecucao = SLIDERS_EXECUCAO.map(spec => {
    const chave = spec[0];
    return slider(spec,
      () => resolver(estado.personagem, estado.variacao || null)[chave],
      v => {
        if (estado.variacao) estado.personagem.variacoes[estado.variacao][chave] = v;
        else estado.personagem.mao[chave] = v;
      });
  });

  // Salvar / Abrir / Restaurar
  const inputArquivo = document.createElement('input');
  inputArquivo.type = 'file';
  inputArquivo.accept = '.json,application/json';
  inputArquivo.hidden = true;
  inputArquivo.addEventListener('change', async () => {
    const arq = inputArquivo.files[0];
    inputArquivo.value = '';
    if (!arq) return;
    let p, errs;
    try {
      p = JSON.parse(await arq.text());
      errs = validar(p);
    } catch (e) {
      errs = ['arquivo inválido: ' + e.message];
    }
    if (errs.length) {
      erro.textContent = errs.join('; ');
      return;
    }
    erro.textContent = '';
    estado.personagem = p;
    estado.variacao = Object.keys(p.variacoes ?? {})[0] ?? '';
    aoMudar();
  });

  const botoes = document.createElement('div');
  botoes.append(
    botao('Salvar JSON', () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(estado.personagem, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = slug(estado.personagem.nome) + '.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }),
    botao('Abrir JSON', () => inputArquivo.click()),
    botao('Restaurar preset', () => {
      estado.personagem = structuredClone(estado.presets[estado.presetId]);
      const chaves = Object.keys(estado.personagem.variacoes ?? {});
      if (estado.variacao && !chaves.includes(estado.variacao)) estado.variacao = chaves[0] ?? '';
      aoMudar();
    }),
  );

  elemento.append(
    campo('Preset', presetSel),
    campo('Variação', variacaoSel),
    titulo('Identidade'), ...blocosIdentidade,
    titulo('Execução'), ...blocosExecucao,
    botoes, inputArquivo, erro,
  );

  function atualizar() {
    if (presetSel.value !== estado.presetId) presetSel.value = estado.presetId;
    reconstruirVariacoes();
    if (variacaoSel.value !== estado.variacao) variacaoSel.value = estado.variacao;
    for (const s of sincs) s();
    try {
      localStorage.setItem('writer.personagem', JSON.stringify({
        presetId: estado.presetId, personagem: estado.personagem, variacao: estado.variacao,
      }));
    } catch {}
  }

  atualizar();
  return atualizar;
}
