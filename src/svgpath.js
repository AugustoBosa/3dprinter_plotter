const TOKEN = /[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;
const ARGS = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

// Converte o atributo d de um <path> em polilinhas (uma por subcaminho).
// ponytail: A (arco) vira reta até o ponto final; flags compactas (ex.: "011") não são separadas.
export function parsePath(d, tol = 2) {
  const tk = d.match(TOKEN) ?? [];
  const out = [];
  let poly = null, cx = 0, cy = 0, sx = 0, sy = 0;
  let cmd = null, prev = null, ctrl = null;
  let i = 0;

  const fecha = () => { if (poly && poly.length >= 2) out.push(poly); poly = null; };
  const pl = () => (poly ??= [[cx, cy]]);
  const refl = () => [2 * cx - ctrl[0], 2 * cy - ctrl[1]];

  while (i < tk.length) {
    if (/[a-zA-Z]/.test(tk[i])) {
      cmd = tk[i++];
      const U = cmd.toUpperCase();
      if (U === 'Z') {
        if (poly && (poly.at(-1)[0] !== sx || poly.at(-1)[1] !== sy)) poly.push([sx, sy]);
        fecha();
        cx = sx; cy = sy; cmd = null;
      } else if (!(U in ARGS)) cmd = null;
      continue;
    }
    if (!cmd) { i++; continue; }

    const U = cmd.toUpperCase(), rel = cmd !== U, n = ARGS[U];
    if (i + n > tk.length) break;
    const a = tk.slice(i, i + n).map(Number);
    if (a.some(Number.isNaN)) break;
    i += n;

    const bx = rel ? cx : 0, by = rel ? cy : 0;
    const e = (k) => [a[k] + bx, a[k + 1] + by];
    const pvt = prev;
    prev = null;

    if (U === 'M') {
      const p = e(0);
      fecha();
      poly = [p];
      cx = sx = p[0]; cy = sy = p[1];
      cmd = rel ? 'l' : 'L';
    } else if (U === 'L') {
      const p = e(0); pl().push(p); cx = p[0]; cy = p[1];
    } else if (U === 'H') {
      const p = [a[0] + bx, cy]; pl().push(p); cx = p[0];
    } else if (U === 'V') {
      const p = [cx, a[0] + by]; pl().push(p); cy = p[1];
    } else if (U === 'A') {
      const p = e(5); pl().push(p); cx = p[0]; cy = p[1];
    } else {
      // C, S, Q, T: quadrática vira cúbica exata (2/3 do controle)
      const cur = [cx, cy];
      let c1, c2, end;
      if (U === 'C') { c1 = e(0); c2 = e(2); end = e(4); ctrl = c2; prev = 'C'; }
      else if (U === 'S') { c1 = pvt === 'C' ? refl() : cur; c2 = e(0); end = e(2); ctrl = c2; prev = 'C'; }
      else {
        const q = U === 'Q' ? e(0) : pvt === 'Q' ? refl() : cur;
        end = U === 'Q' ? e(2) : e(0);
        c1 = [cur[0] + 2 / 3 * (q[0] - cur[0]), cur[1] + 2 / 3 * (q[1] - cur[1])];
        c2 = [end[0] + 2 / 3 * (q[0] - end[0]), end[1] + 2 / 3 * (q[1] - end[1])];
        ctrl = q; prev = 'Q';
      }
      curva(cur, c1, c2, end, tol, 0, pl());
      cx = end[0]; cy = end[1];
    }
  }
  fecha();
  return out;
}

// Achatamento recursivo (de Casteljau, t=0.5). Empilha pontos finais, sem o inicial.
function curva(p0, p1, p2, p3, tol, prof, out) {
  if (prof >= 16 || Math.max(distancia(p1, p0, p3), distancia(p2, p0, p3)) <= tol) {
    out.push(p3);
    return;
  }
  const m = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const a = m(p0, p1), b = m(p1, p2), c = m(p2, p3);
  const d = m(a, b), f = m(b, c), g = m(d, f);
  curva(p0, a, d, g, tol, prof + 1, out);
  curva(g, f, c, p3, tol, prof + 1, out);
}

// Distância do ponto p à reta a-b (ou ao ponto a, se a == b).
function distancia(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / len;
}
