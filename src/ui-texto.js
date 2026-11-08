import { PAGINAS } from './layout.js';

function titulo(texto) {
  const h = document.createElement('h3');
  h.textContent = texto;
  return h;
}

function rotulo(texto, controle) {
  const l = document.createElement('label');
  l.append(texto + ' ', controle);
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
    ['Largura (mm)', 20, () => estado.pagina, 'largura'],
    ['Altura (mm)', 20, () => estado.pagina, 'altura'],
    ['Margem superior (mm)', 0, () => estado.pagina.margens, 'topo'],
    ['Margem direita (mm)', 0, () => estado.pagina.margens, 'dir'],
    ['Margem inferior (mm)', 0, () => estado.pagina.margens, 'base'],
    ['Margem esquerda (mm)', 0, () => estado.pagina.margens, 'esq'],
  ].map(([texto, min, alvo, chave]) => {
    const input = document.createElement('input');
    input.type = 'number';
    input.min = min;
    input.step = 1;
    input.addEventListener('input', () => {
      const n = Number(input.value);
      if (input.value === '' || Number.isNaN(n) || n < min) return;
      alvo()[chave] = n;
      estado.paginaNome = 'personalizada';
      aoMudar();
    });
    return { input, alvo, chave, linha: rotulo(texto, input) };
  });

  const deslizantes = [
    ['Tamanho (mm do em)', 3, 15, 0.5, 'tamanho'],
    ['Entrelinha', 1, 3, 0.05, 'entrelinha'],
  ].map(([texto, min, max, passo, chave]) => {
    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = passo;
    const saida = document.createElement('output');
    input.addEventListener('input', () => {
      estado.opcoes[chave] = Number(input.value);
      aoMudar();
    });
    const l = document.createElement('label');
    l.className = 'slider';
    l.append(texto + ' ', input, ' ', saida);
    return { input, saida, chave, linha: l };
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

  elemento.replaceChildren(
    titulo('Texto'),
    textarea,
    titulo('Página'),
    rotulo('Formato', selPagina),
    ...medidas.map((m) => m.linha),
    titulo('Aparência'),
    ...deslizantes.map((d) => d.linha),
    rotulo('Alinhamento', selAlinhamento),
  );

  return function atualizar() {
    if (textarea.value !== estado.texto) textarea.value = estado.texto;
    sincronizar(selPagina, estado.paginaNome);
    for (const m of medidas) sincronizar(m.input, m.alvo()[m.chave]);
    for (const d of deslizantes) {
      sincronizar(d.input, estado.opcoes[d.chave]);
      d.saida.textContent = String(estado.opcoes[d.chave]);
    }
    sincronizar(selAlinhamento, estado.opcoes.alinhamento);
  };
}
