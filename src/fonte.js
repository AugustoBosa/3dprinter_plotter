import { parsePath } from './svgpath.js';

export const FONTES = [
  'EMSAllure', 'EMSBird', 'EMSBirdSwashCaps', 'EMSDecorousScript', 'EMSDelight',
  'EMSDelightSwashCaps', 'EMSInvite', 'EMSLittlePrincess', 'EMSMistyNight', 'EMSSociety',
  'ReliefSingleLineSVG-Regular',
  'EMSBrush', 'EMSCapitol', 'EMSCasualHand', 'EMSElfin', 'EMSFelix', 'EMSHerculean', 'EMSLeague',
  'EMSNeato', 'EMSNixish', 'EMSNixishItalic', 'EMSOsmotron', 'EMSPancakes', 'EMSPepita', 'EMSQwandry',
  'EMSReadability', 'EMSReadabilityItalic', 'EMSSpaceRocks', 'EMSSwiss', 'EMSTech',
  'HersheyGothEnglish', 'HersheyGothGerman', 'HersheyGothItalian', 'HersheySans1', 'HersheySansMed',
  'HersheyScript1', 'HersheyScriptMed', 'HersheySerifBold', 'HersheySerifBoldItalic', 'HersheySerifMed',
  'HersheySerifMedItalic', 'MistralSingleLine', 'TwinSans',
];

// Fontes sem acentos (só maiúsculas ASCII).
export const SEM_ACENTOS = ['EMSSpaceRocks'];

const ENTIDADES = { amp: '&', quot: '"', lt: '<', gt: '>', apos: "'" };

// Decodifica entidades numéricas e nomeadas numa única passada.
function decodifica(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|lt|gt|apos);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1));
      return String.fromCodePoint(n);
    }
    return ENTIDADES[e.toLowerCase()];
  });
}

// Lê uma fonte SVG (SVG Font) com regex. Não inverte y: já é para cima.
export function parseFonte(svgText, nome) {
  const upm = Number(svgText.match(/units-per-em="([\d.]+)"/)?.[1]);
  const ascent = Number(svgText.match(/\sascent="(-?[\d.]+)"/)?.[1] ?? 800);
  const descent = Number(svgText.match(/\sdescent="(-?[\d.]+)"/)?.[1] ?? -200);
  const tagFonte = svgText.match(/<font\s[^>]*?horiz-adv-x="([\d.]+)"/);
  const advPadrao = tagFonte ? Number(tagFonte[1]) : upm / 2;

  const glifos = {};
  for (const [, attrs] of svgText.matchAll(/<glyph\b([^>]*?)\/?>/gs)) {
    const u = attrs.match(/\sunicode="([^"]*)"/);
    if (!u || u[1] === '') continue;
    const ch = decodifica(u[1]);
    if (Object.hasOwn(glifos, ch)) continue;
    const a = attrs.match(/\shoriz-adv-x="([\d.]+)"/);
    const d = attrs.match(/\sd="([^"]*)"/);
    glifos[ch] = {
      adv: a ? Number(a[1]) : advPadrao,
      tracos: d ? parsePath(d[1]) : [],
    };
  }
  return { nome, upm, ascent, descent, advPadrao, glifos };
}
