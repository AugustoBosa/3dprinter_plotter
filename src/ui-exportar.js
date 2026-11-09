import { PERFIL_PADRAO, svg, otimizar, gcode } from './exportar.js';
import { rotulo, ajuda } from './ajuda.js';

// Chave do campo = chave de estado.perfil = chave de ajuda.
const CAMPOS = [
  ['zEscrita', 0.1],
  ['zLevantada', 0.1],
  ['fDesenho', 1],
  ['fViagem', 1],
  ['fZ', 1],
  ['offsetX', 0.1],
  ['offsetY', 0.1],
  ['mesaX', 1],
  ['mesaY', 1],
];

const tracosDaPagina = (estado, i) => {
  const tr0 = estado.resultado?.paginas[i] ?? [];
  return estado.otimizar ? otimizar(tr0) : tr0;
};
const tracosAtuais = (estado) => tracosDaPagina(estado, estado.paginaAtual);

function baixar(conteudo, nome, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  Object.assign(document.createElement('a'), { href: url, download: nome }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function montar(elemento, estado, aoMudar) {
  const sincs = [];

  const linha = (chave, controle) => {
    const l = document.createElement('label');
    l.append(rotulo(chave), ' ', ajuda(chave), ' ', controle);
    elemento.append(l);
  };

  const botao = (texto, aoClicar) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = texto;
    b.addEventListener('click', aoClicar);
    elemento.append(b);
  };

  for (const [chave, passo] of CAMPOS) {
    const input = document.createElement('input');
    input.type = 'number';
    input.step = passo;
    input.addEventListener('input', () => {
      if (input.value === '') return;
      estado.perfil[chave] = Number(input.value);
      aoMudar();
    });
    linha(chave, input);
    sincs.push(() => {
      if (Number(input.value) !== estado.perfil[chave]) input.value = estado.perfil[chave];
    });
  }

  for (const chave of ['header', 'footer']) {
    const ta = document.createElement('textarea');
    ta.rows = 5;
    ta.style.fontFamily = 'monospace';
    ta.addEventListener('input', () => {
      estado.perfil[chave] = ta.value;
      aoMudar();
    });
    linha(chave, ta);
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
  linha('otimizar', otim);

  const traj = document.createElement('input');
  traj.type = 'checkbox';
  traj.addEventListener('change', () => {
    estado.trajeto = traj.checked;
    aoMudar();
  });
  linha('trajeto', traj);

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

  // Um arquivo por página; sem zip (add se o navegador bloquear vários downloads).
  const todas = (ext, tipo, gerar) => () => {
    (estado.resultado?.paginas ?? []).forEach((_, i) =>
      baixar(gerar(tracosDaPagina(estado, i)), `escrita-p${i + 1}.${ext}`, tipo));
  };
  botao('Baixar todos os SVG', todas('svg', 'image/svg+xml', (t) => svg(t, estado.pagina)));
  botao('Baixar todos os G-code', todas('gcode', 'text/plain', (t) => gcode(t, estado.pagina, estado.perfil).texto));

  const resumo = document.createElement('p');
  const lista = document.createElement('ul');
  elemento.append(resumo, lista);

  return () => {
    for (const sync of sincs) sync();
    otim.checked = estado.otimizar;
    traj.checked = estado.trajeto;
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
