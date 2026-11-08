import { PERFIL_PADRAO, svg, otimizar, gcode } from './exportar.js';

const CAMPOS = [
  ['zEscrita', 'Z escrita (mm)', 0.1],
  ['zLevantada', 'Z levantada (mm)', 0.1],
  ['fDesenho', 'Velocidade de desenho F', 1],
  ['fViagem', 'Velocidade de viagem F', 1],
  ['fZ', 'Velocidade do Z F', 1],
  ['offsetX', 'Offset X da caneta (mm)', 0.1],
  ['offsetY', 'Offset Y da caneta (mm)', 0.1],
  ['mesaX', 'Mesa X (mm)', 1],
  ['mesaY', 'Mesa Y (mm)', 1],
];

const tracosAtuais = (estado) => {
  const tr0 = estado.resultado?.paginas[estado.paginaAtual] ?? [];
  return estado.otimizar ? otimizar(tr0) : tr0;
};

function baixar(conteudo, nome, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  Object.assign(document.createElement('a'), { href: url, download: nome }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function montar(elemento, estado, aoMudar) {
  const sincs = [];

  const rotulo = (texto, controle) => {
    const l = document.createElement('label');
    l.append(texto + ' ', controle);
    elemento.append(l);
  };

  const botao = (texto, aoClicar) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = texto;
    b.addEventListener('click', aoClicar);
    elemento.append(b);
  };

  for (const [chave, texto, passo] of CAMPOS) {
    const input = document.createElement('input');
    input.type = 'number';
    input.step = passo;
    input.addEventListener('input', () => {
      if (input.value === '') return;
      estado.perfil[chave] = Number(input.value);
      aoMudar();
    });
    rotulo(texto, input);
    sincs.push(() => {
      if (Number(input.value) !== estado.perfil[chave]) input.value = estado.perfil[chave];
    });
  }

  for (const [chave, texto] of [['header', 'Header G-code'], ['footer', 'Footer G-code']]) {
    const ta = document.createElement('textarea');
    ta.rows = 5;
    ta.style.fontFamily = 'monospace';
    ta.addEventListener('input', () => {
      estado.perfil[chave] = ta.value;
      aoMudar();
    });
    rotulo(texto, ta);
    sincs.push(() => {
      if (ta.value !== estado.perfil[chave]) ta.value = estado.perfil[chave];
    });
  }

  const otim = document.createElement('input');
  otim.type = 'checkbox';
  otim.addEventListener('change', () => {
    estado.otimizar = otim.checked;
    aoMudar();
  });
  rotulo('Otimizar ordem dos traços', otim);

  botao('Restaurar perfil padrão', () => {
    estado.perfil = structuredClone(PERFIL_PADRAO);
    aoMudar();
  });
  botao('Baixar SVG', () => {
    const n = estado.paginaAtual + 1;
    baixar(svg(tracosAtuais(estado), estado.pagina), `escrita-p${n}.svg`, 'image/svg+xml');
  });
  botao('Baixar G-code', () => {
    const n = estado.paginaAtual + 1;
    baixar(gcode(tracosAtuais(estado), estado.pagina, estado.perfil).texto, `escrita-p${n}.gcode`, 'text/plain');
  });

  const resumo = document.createElement('p');
  const lista = document.createElement('ul');
  elemento.append(resumo, lista);

  return () => {
    for (const sync of sincs) sync();
    otim.checked = estado.otimizar;
    lista.replaceChildren();
    if (!estado.resultado) {
      resumo.textContent = '—';
      return;
    }
    try {
      const g = gcode(tracosAtuais(estado), estado.pagina, estado.perfil);
      resumo.textContent = `Traços: ${g.nTracos} | Comprimento: ${g.comprimento.toFixed(1)} mm`;
      const avisos = g.avisos.length ? g.avisos : ['sem avisos'];
      for (const a of avisos) {
        const li = document.createElement('li');
        li.textContent = a;
        lista.append(li);
      }
    } catch (e) {
      resumo.textContent = `Erro: ${e.message}`;
    }
  };
}
