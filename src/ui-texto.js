import { PAGINAS } from './layout.js';
import { rotulo, ajuda } from './ajuda.js';

function titulo(texto, chave) {
  const h = document.createElement('h3');
  h.append(texto);
  if (chave) h.append(' ', ajuda(chave));
  return h;
}

function linha(chave, controle) {
  const l = document.createElement('label');
  l.append(rotulo(chave), ' ', ajuda(chave), ' ', controle);
  return l;
}

// Não mexe no elemento que o usuário está editando (evita perder o cursor).
function sincronizar(el, valor) {
  if (el !== document.activeElement && String(el.value) !== String(valor)) el.value = valor;
}

export function montar(elemento, estado, aoMudar) {
  const textarea = document.createElement('textarea');
  textarea.rows = 8;
  textarea.addEventListener('input', () => {
    estado.texto = textarea.value;
    aoMudar();
  });

  const selPagina = document.createElement('select');
  for (const nome of ['A4', 'A5', 'mesa', 'personalizada']) {
    const op = document.createElement('option');
    op.value = nome;
    op.textContent = nome;
    selPagina.append(op);
  }
  selPagina.addEventListener('change', () => {
    const nome = selPagina.value;
    if (nome !== 'personalizada') {
      estado.pagina = structuredClone(PAGINAS[nome]);
      estado.paginaAtual = 0;
    }
    estado.paginaNome = nome;
    aoMudar();
  });

  const medidas = [
    ['larguraPagina', 20, () => estado.pagina, 'largura'],
    ['alturaPagina', 20, () => estado.pagina, 'altura'],
    ['margemTopo', 0, () => estado.pagina.margens, 'topo'],
    ['margemDir', 0, () => estado.pagina.margens, 'dir'],
    ['margemBase', 0, () => estado.pagina.margens, 'base'],
    ['margemEsq', 0, () => estado.pagina.margens, 'esq'],
  ].map(([chave, min, alvo, campo]) => {
    const input = document.createElement('input');
    input.type = 'number';
    input.min = min;
    input.step = 1;
    input.addEventListener('input', () => {
      const n = Number(input.value);
      if (input.value === '' || Number.isNaN(n) || n < min) return;
      alvo()[campo] = n;
      estado.paginaNome = 'personalizada';
      aoMudar();
    });
    return { input, alvo, campo, linha: linha(chave, input) };
  });

  const deslizantes = [
    ['tamanho', 3, 15, 0.5, 'tamanho'],
    ['entrelinha', 1, 3, 0.05, 'entrelinha'],
  ].map(([chave, min, max, passo, opcao]) => {
    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = passo;
    const saida = document.createElement('output');
    input.addEventListener('input', () => {
      estado.opcoes[opcao] = Number(input.value);
      aoMudar();
    });
    const texto = document.createElement('span');
    texto.append(rotulo(chave), ' ', ajuda(chave));
    const l = document.createElement('label');
    l.className = 'slider';
    l.append(texto, input, ' ', saida);
    return { input, saida, opcao, linha: l };
  });

  const selAlinhamento = document.createElement('select');
  for (const nome of ['esquerda', 'centro', 'justificado']) {
    const op = document.createElement('option');
    op.value = nome;
    op.textContent = nome;
    selAlinhamento.append(op);
  }
  selAlinhamento.addEventListener('change', () => {
    estado.opcoes.alinhamento = selAlinhamento.value;
    aoMudar();
  });

  const arquivo = document.createElement('input');
  arquivo.type = 'file';
  arquivo.accept = '.txt,text/plain';
  arquivo.addEventListener('change', async () => {
    const f = arquivo.files[0];
    arquivo.value = '';
    const erro = document.getElementById('erro');
    if (!f) return;
    if (f.size > 200_000) { erro.textContent = 'Arquivo grande demais (máximo 200 KB).'; return; }
    erro.textContent = '';
    estado.texto = await f.text();
    aoMudar();
  });

  elemento.replaceChildren(
    titulo('Texto', 'texto'),
    textarea,
    linha('importarTxt', arquivo),
    titulo('Página'),
    linha('pagina', selPagina),
    ...medidas.map((m) => m.linha),
    titulo('Aparência'),
    ...deslizantes.map((d) => d.linha),
    linha('alinhamento', selAlinhamento),
  );

  return function atualizar() {
    if (textarea.value !== estado.texto) textarea.value = estado.texto;
    sincronizar(selPagina, estado.paginaNome);
    for (const m of medidas) sincronizar(m.input, m.alvo()[m.campo]);
    for (const d of deslizantes) {
      sincronizar(d.input, estado.opcoes[d.opcao]);
      d.saida.textContent = String(estado.opcoes[d.opcao]);
    }
    sincronizar(selAlinhamento, estado.opcoes.alinhamento);
  };
}
