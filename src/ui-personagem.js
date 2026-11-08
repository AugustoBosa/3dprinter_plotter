import { resolver, validar, novoPersonagem, ajustarVariacao } from './personagem.js';
import { rotulo, ajuda } from './ajuda.js';

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

// Personagens salvos no navegador. Leitura tolerante; gravação lança erro para o chamador avisar.
function lerSalvos() {
  try { return JSON.parse(localStorage.getItem('writer.personagens')) ?? {}; } catch { return {}; }
}
function gravarSalvos(salvos) {
  localStorage.setItem('writer.personagens', JSON.stringify(salvos));
}

// Restaura personagem salvo no localStorage. Qualquer erro: ignora.
export function restaurar(estado) {
  try {
    const salvo = JSON.parse(localStorage.getItem('writer.personagem'));
    const p = salvo?.personagem;
    if (!p || validar(p).length !== 0) return;
    const chaves = Object.keys(p.variacoes ?? {});
    const v = salvo.variacao;
    estado.personagem = p;
    estado.variacao = v === '' || chaves.includes(v) ? v : (chaves[0] ?? '');
  } catch {}
}

export function montar(elemento, estado, aoMudar) {
  const sincs = [];
  const erro = document.createElement('p');
  erro.className = 'erro';

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
  function linhaBotoes(...itens) {
    const d = document.createElement('div');
    d.className = 'linha-botoes';
    d.append(...itens);
    return d;
  }
  function titulo(...conteudo) {
    const h = document.createElement('h3');
    h.append(...conteudo);
    return h;
  }

  // Personagem: nome, novo, salvar/abrir arquivo
  const inputNome = document.createElement('input');
  inputNome.type = 'text';
  inputNome.addEventListener('input', () => {
    estado.personagem.nome = inputNome.value;
    aoMudar();
  });

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

  // Meus personagens (navegador)
  const selSalvos = document.createElement('select');
  const btnAbrirSalvo = botao('Abrir', () => {
    const p = lerSalvos()[selSalvos.value];
    const errs = p ? validar(p) : ['personagem não encontrado'];
    if (errs.length) {
      erro.textContent = errs.join('; ');
      return;
    }
    erro.textContent = '';
    estado.personagem = structuredClone(p);
    estado.variacao = Object.keys(p.variacoes ?? {})[0] ?? '';
    aoMudar();
  });
  const btnExcluir = botao('Excluir', () => {
    const nome = selSalvos.value;
    if (!confirm(`Excluir "${nome}" dos salvos?`)) return;
    const salvos = lerSalvos();
    delete salvos[nome];
    try {
      gravarSalvos(salvos);
    } catch (e) {
      erro.textContent = 'Não foi possível excluir: ' + e.message;
      return;
    }
    erro.textContent = '';
    reconstruirSalvos();
  });
  let assinaturaSalvos = null;
  function reconstruirSalvos() {
    const nomes = Object.keys(lerSalvos());
    const assinatura = JSON.stringify(nomes);
    if (assinatura === assinaturaSalvos) return;
    assinaturaSalvos = assinatura;
    if (!nomes.length) {
      selSalvos.replaceChildren(new Option('(nenhum salvo)', ''));
    } else {
      selSalvos.replaceChildren(...nomes.map(n => new Option(n, n)));
    }
    selSalvos.disabled = btnAbrirSalvo.disabled = btnExcluir.disabled = !nomes.length;
  }

  // Variação
  const selVar = document.createElement('select');
  selVar.addEventListener('change', () => {
    estado.variacao = selVar.value;
    aoMudar();
  });
  let chavesVar = null;
  function reconstruirVariacoes(chaves) {
    if (JSON.stringify(chaves) === chavesVar) return;
    chavesVar = JSON.stringify(chaves);
    selVar.replaceChildren(...(chaves.length
      ? chaves.map(k => new Option(k, k))
      : [new Option('(mão base)', '')]));
  }
  const btnRenomear = botao('Renomear', () => {
    const atual = estado.variacao;
    const nome = prompt('Nome da variação', atual)?.trim();
    const v = estado.personagem.variacoes;
    if (!nome || nome === atual || Object.hasOwn(v, nome)) return;
    estado.personagem.variacoes = Object.fromEntries(
      Object.entries(v).map(([k, val]) => [k === atual ? nome : k, val]));
    estado.variacao = nome;
    aoMudar();
  });
  const btnRemover = botao('Remover', () => {
    const atual = estado.variacao;
    if (!confirm(`Remover a variação "${atual}"?`)) return;
    delete estado.personagem.variacoes[atual];
    estado.variacao = Object.keys(estado.personagem.variacoes)[0] ?? '';
    aoMudar();
  });

  // Sliders: get/set recebem a chave via closure
  function slider([chave, min, max, passo], get, set) {
    const input = document.createElement('input');
    input.type = 'range';
    input.min = min; input.max = max; input.step = passo;
    const out = document.createElement('output');
    const t = document.createElement('span');
    t.append(rotulo(chave), ' ', ajuda(chave));
    const l = document.createElement('label');
    l.className = 'slider';
    l.append(t, input, out);
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
      v => ajustarVariacao(estado.personagem, estado.variacao || null, chave, v));
  });

  const labelVar = document.createElement('label');
  labelVar.append(rotulo('variacaoSel'), ' ', ajuda('variacaoSel'), ' ', selVar);

  elemento.append(
    titulo('Personagem ', ajuda('personagem')),
    campo('Nome', inputNome),
    linhaBotoes(
      botao('Novo personagem', () => {
        estado.personagem = novoPersonagem();
        estado.variacao = 'normal';
        aoMudar();
      }),
      botao('Salvar JSON', () => {
        const url = URL.createObjectURL(new Blob([JSON.stringify(estado.personagem, null, 2)], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = slug(estado.personagem.nome) + '.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }),
      botao('Abrir JSON', () => inputArquivo.click()),
    ),
    inputArquivo,
    titulo('Meus personagens (neste navegador)'),
    linhaBotoes(
      selSalvos,
      botao('Salvar aqui', () => {
        const nome = estado.personagem.nome?.trim();
        if (!nome) {
          erro.textContent = 'Dê um nome ao personagem antes de salvar.';
          return;
        }
        try {
          const salvos = lerSalvos();
          salvos[nome] = structuredClone(estado.personagem);
          gravarSalvos(salvos);
        } catch (e) {
          erro.textContent = 'Não foi possível salvar neste navegador: ' + e.message;
          return;
        }
        erro.textContent = '';
        reconstruirSalvos();
        selSalvos.value = nome;
      }),
      btnAbrirSalvo,
      btnExcluir,
    ),
    labelVar,
    linhaBotoes(
      botao('Adicionar', () => {
        const nome = prompt('Nome da variação')?.trim();
        if (!nome) return;
        estado.personagem.variacoes ??= {};
        if (Object.hasOwn(estado.personagem.variacoes, nome)) return;
        estado.personagem.variacoes[nome] = {};
        estado.variacao = nome;
        aoMudar();
      }),
      btnRenomear,
      btnRemover,
    ),
    titulo('Identidade'), ...blocosIdentidade,
    titulo('Execução'), ...blocosExecucao,
    erro,
  );

  function atualizar() {
    const p = estado.personagem;
    if (document.activeElement !== inputNome) inputNome.value = p.nome;
    reconstruirSalvos();
    const chaves = Object.keys(p.variacoes ?? {});
    if (!chaves.includes(estado.variacao)) estado.variacao = chaves[0] ?? '';
    reconstruirVariacoes(chaves);
    selVar.value = estado.variacao;
    btnRenomear.disabled = btnRemover.disabled = !chaves.length;
    for (const s of sincs) s();
    try {
      localStorage.setItem('writer.personagem', JSON.stringify({ personagem: p, variacao: estado.variacao }));
    } catch {}
  }

  atualizar();
  return atualizar;
}
