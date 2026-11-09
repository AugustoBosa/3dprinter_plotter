export const PERFIL_PADRAO = {
  zEscrita: 3, zLevantada: 6, fDesenho: 2400, fViagem: 6000, fZ: 500,
  offsetX: 0, offsetY: 0, mesaX: 210, mesaY: 210,
  header: "G21\nG91\nG0 Z10 F500\nG90\nM412 S0\nG28 X Y\nG28 Z\nG0 Z6 F500\n",
  footer: "G0 Z15 F500\nG0 X0 Y200 F6000\nM84\n",
};

const valido = (t) => Array.isArray(t) && t.length >= 2;
const dist = ([x1, y1], [x2, y2]) => Math.hypot(x2 - x1, y2 - y1);
const num = (v) => String(+v.toFixed(3));

// Viagem no ar (mm), partindo de (0,0), na ordem dada.
export function viagem(tracos) {
  let pos = [0, 0], total = 0;
  for (const t of tracos.filter(valido)) { total += dist(pos, t[0]); pos = t[t.length - 1]; }
  return total;
}

// trajeto: desenha por cima a viagem no ar (tracejado), início (verde) e fim (vermelho) de cada traço, numerados.
export function svg(tracos, pagina, { trajeto = false } = {}) {
  const { largura, altura } = pagina;
  const validos = tracos.filter(valido);
  const paths = validos.map((t) =>
    `<path d="M ${t.map(([x, y]) => `${num(x)} ${num(y)}`).join(" L ")}" fill="none" stroke="black" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round"/>`);
  const extra = [];
  if (trajeto) {
    let pos = [0, 0];
    validos.forEach((t, i) => {
      const [ix, iy] = t[0], [fx, fy] = t[t.length - 1];
      extra.push(
        `<path d="M ${num(pos[0])} ${num(pos[1])} L ${num(ix)} ${num(iy)}" fill="none" stroke="#888" stroke-width="0.2" stroke-dasharray="1 1"/>`,
        `<circle cx="${num(ix)}" cy="${num(iy)}" r="0.6" fill="green"/>`,
        `<circle cx="${num(fx)}" cy="${num(fy)}" r="0.6" fill="red"/>`,
        `<text x="${num(ix + 0.8)}" y="${num(iy - 0.8)}" font-size="2" fill="#06c">${i + 1}</text>`,
      );
      pos = [fx, fy];
    });
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}mm" height="${altura}mm" viewBox="0 0 ${largura} ${altura}">`,
    ...paths,
    ...extra,
    "</svg>",
  ].join("\n");
}

// ponytail: guloso + 2-opt em janela de 50 traços e até 5 passadas (A4 cheia sem travar); janela maior/Or-opt se a viagem ainda pesar
export function otimizar(tracos, tol = 0.1) {
  const restantes = tracos.filter(valido).map((t) => t.map((p) => [...p]));
  let seq = [];
  let pos = [0, 0];
  while (restantes.length) {
    let melhor = -1, inverter = false, melhorD = Infinity;
    restantes.forEach((t, i) => {
      const dIni = dist(pos, t[0]), dFim = dist(pos, t[t.length - 1]);
      if (dIni < melhorD) { melhorD = dIni; melhor = i; inverter = false; }
      if (dFim < melhorD) { melhorD = dFim; melhor = i; inverter = true; }
    });
    const [t] = restantes.splice(melhor, 1);
    if (inverter) t.reverse();
    seq.push(t);
    pos = t[t.length - 1];
  }
  // 2-opt: inverte o trecho seq[i..j] (ordem e sentido de cada traço) se encurta a viagem.
  const ini = (k) => seq[k][0], fim = (k) => seq[k][seq[k].length - 1];
  for (let passada = 0, melhorou = true; melhorou && passada < 5; passada++) {
    melhorou = false;
    for (let i = 0; i < seq.length; i++) {
      for (let j = i; j < Math.min(seq.length, i + 50); j++) {
        const a = i ? fim(i - 1) : [0, 0];
        const antes = dist(a, ini(i)) + (j + 1 < seq.length ? dist(fim(j), ini(j + 1)) : 0);
        const depois = dist(a, fim(j)) + (j + 1 < seq.length ? dist(ini(i), ini(j + 1)) : 0);
        if (depois < antes - 1e-9) {
          const trecho = seq.slice(i, j + 1).reverse();
          trecho.forEach((t) => t.reverse());
          seq.splice(i, j - i + 1, ...trecho);
          melhorou = true;
        }
      }
    }
  }
  const saida = [];
  for (const t of seq) {
    const ultimo = saida[saida.length - 1];
    if (ultimo && dist(ultimo[ultimo.length - 1], t[0]) <= tol) ultimo.push(...t.slice(1));
    else saida.push(t);
  }
  return saida;
}

export function gcode(tracos, pagina, perfil = PERFIL_PADRAO) {
  const p = { ...PERFIL_PADRAO, ...perfil };
  const validos = tracos.filter(valido);
  const avisos = [];
  let texto = p.header;
  let comprimento = 0;
  validos.forEach((t, i) => {
    const maq = t.map(([x, y]) => [x + p.offsetX, pagina.altura - y + p.offsetY]);
    if (maq.some(([x, y]) => x < 0 || x > p.mesaX || y < 0 || y > p.mesaY)) {
      avisos.push(`traço ${i + 1} fora da mesa`);
    }
    const [ini, ...resto] = maq;
    texto += `G0 X${ini[0].toFixed(3)} Y${ini[1].toFixed(3)} F${p.fViagem}\n`;
    texto += `G1 Z${p.zEscrita} F${p.fZ}\n`;
    for (const [x, y] of resto) texto += `G1 X${x.toFixed(3)} Y${y.toFixed(3)} F${p.fDesenho}\n`;
    texto += `G0 Z${p.zLevantada} F${p.fZ}\n`;
    for (let k = 1; k < t.length; k++) comprimento += dist(t[k - 1], t[k]);
  });
  texto += p.footer;
  return { texto, avisos, nTracos: validos.length, comprimento };
}
