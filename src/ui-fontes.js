import { mutar } from './mao.js';

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

function deslizante(texto, min, max, passo, valor) {
  const input = document.createElement('input');
  input.type = 'range';
  input.min = min;
  input.max = max;
  input.step = passo;
  input.value = valor;
  const saida = document.createElement('output');
  saida.textContent = String(valor);
  const l = document.createElement('label');
  l.className = 'slider';
  l.append(texto + ' ', input, ' ', saida);
  return { rotulo: l, input, saida };
}

// Não mexe no elemento que o usuário está editando (evita perder o cursor/arraste).
function sincronizar(el, valor) {
  if (el !== document.activeElement && String(el.value) !== String(valor)) el.value = valor;
}

export function montar(elemento, estado, aoMudar) {
  const lista = document.createElement('div');
  let linhas = [];

  function criarLinha(i) {
    const sel = document.createElement('select');
    for (const nome of estado.nomesFontes) {
      const op = document.createElement('option');
      op.value = nome;
      op.textContent = nome;
      sel.append(op);
    }
    sel.addEventListener('change', () => {
      estado.personagem.mao.base[i].fonte = sel.value;
      aoMudar();
    });

    const peso = deslizante('peso', 0, 1, 0.05, 0);
    peso.input.addEventListener('input', () => {
      estado.personagem.mao.base[i].peso = Math.max(0.01, Number(peso.input.value));
      aoMudar();
    });

    const remover = document.createElement('button');
    remover.type = 'button';
    remover.textContent = 'remover';
    remover.addEventListener('click', () => {
      estado.personagem.mao.base.splice(i, 1);
      aoMudar();
    });

    const linha = document.createElement('div');
    linha.append(rotulo('fonte', sel), peso.rotulo, remover);
    return { linha, sel, peso, remover };
  }

  const adicionar = document.createElement('button');
  adicionar.type = 'button';
  adicionar.textContent = 'adicionar fonte';
  adicionar.addEventListener('click', () => {
    estado.personagem.mao.base.push({ fonte: estado.nomesFontes[0], peso: 0.5 });
    aoMudar();
  });

  const seedMao = document.createElement('input');
  seedMao.type = 'number';
  seedMao.step = 1;
  seedMao.addEventListener('input', () => {
    const n = Math.trunc(Number(seedMao.value));
    if (seedMao.value === '' || Number.isNaN(n)) return;
    estado.personagem.mao.seed = n;
    aoMudar();
  });

  const seedMutar = document.createElement('input');
  seedMutar.type = 'number';
  seedMutar.step = 1;
  seedMutar.value = 1;

  const forca = deslizante('força', 0, 1, 0.05, 0.3);
  forca.input.addEventListener('input', () => {
    forca.saida.textContent = forca.input.value;
  });

  const botaoMutar = document.createElement('button');
  botaoMutar.type = 'button';
  botaoMutar.textContent = 'Mutar';
  botaoMutar.addEventListener('click', () => {
    estado.personagem.mao = mutar(estado.personagem.mao, Number(seedMutar.value), Number(forca.input.value));
    seedMutar.value = Number(seedMutar.value) + 1;
    aoMudar();
  });

  elemento.replaceChildren(
    titulo('Fontes da mão'),
    lista,
    adicionar,
    rotulo('Seed da mão', seedMao),
    titulo('Mutar'),
    rotulo('Seed da mutação', seedMutar),
    forca.rotulo,
    botaoMutar,
  );

  return function atualizar() {
    const base = estado.personagem.mao.base;
    const mudou = base.length !== linhas.length || base.some((it, i) => linhas[i].sel.value !== String(it.fonte));
    if (mudou) {
      linhas = base.map((_, i) => criarLinha(i));
      lista.replaceChildren(...linhas.map((l) => l.linha));
    }
    base.forEach((it, i) => {
      const l = linhas[i];
      sincronizar(l.sel, it.fonte);
      sincronizar(l.peso.input, it.peso);
      l.peso.saida.textContent = String(it.peso);
      l.remover.disabled = base.length <= 1;
    });
    sincronizar(seedMao, estado.personagem.mao.seed);
  };
}
