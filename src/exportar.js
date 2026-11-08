export const PERFIL_PADRAO = {
  zEscrita: 3, zLevantada: 6, fDesenho: 2400, fViagem: 6000, fZ: 500,
  offsetX: 0, offsetY: 0, mesaX: 210, mesaY: 210,
  header: "G21\nG91\nG0 Z10 F500\nG90\nM412 S0\nG28 X Y\nG28 Z\nG0 Z6 F500\n",
  footer: "G0 Z15 F500\nG0 X0 Y200 F6000\nM84\n",
};

const valido = (t) => Array.isArray(t) && t.length >= 2;
const dist = ([x1, y1], [x2, y2]) => Math.hypot(x2 - x1, y2 - y1);
const num = (v) => String(+v.toFixed(3));

export function svg(tracos, pagina) {
  const { largura, altura } = pagina;
  const paths = tracos.filter(valido).map((t) =>
    `<path d="M ${t.map(([x, y]) => `${num(x)} ${num(y)}`).join(" L ")}" fill="none" stroke="black" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round"/>`);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}mm" height="${altura}mm" viewBox="0 0 ${largura} ${altura}">`,
    ...paths,
    "</svg>",
  ].join("\n");
}

// ponytail: guloso (vizinho mais próximo), sem 2-opt; add 2-opt if viagem matters
export function otimizar(tracos, tol = 0.1) {
  const restantes = tracos.filter(valido).map((t) => t.map((p) => [...p]));
  const saida = [];
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
    const ultimo = saida[saida.length - 1];
    if (ultimo && dist(ultimo[ultimo.length - 1], t[0]) <= tol) ultimo.push(...t.slice(1));
    else saida.push(t);
    pos = t[t.length - 1];
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
