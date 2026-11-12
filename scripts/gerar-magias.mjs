// Gera dados/magias.json (fora do git) a partir dos JSON de magias do 5etools.
// Uso: node scripts/gerar-magias.mjs [pasta-das-magias]
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizar } from '../src/magia.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origem = process.argv[2] ?? join(raiz, '..', '..', 'dnd', 'data', 'spells');
// dados/traducao-ptbr.txt: uma linha por magia, `id|Nome|Resumo`; magias do PHB podem vir sem o sufixo -phb.
const arqTrad = join(raiz, 'dados', 'traducao-ptbr.txt');
const trad = {};
if (existsSync(arqTrad)) {
  for (const linha of readFileSync(arqTrad, 'utf8').split(/\r?\n/)) {
    if (!linha.trim() || linha.startsWith('#')) continue;
    const [id, nome, ...resto] = linha.split('|');
    trad[id] = { nome, resumo: resto.join('|') };
  }
}

const magias = readdirSync(origem).filter((f) => f.endsWith('.json')).map((f) => {
  const id = f.slice(0, -5);
  return normalizar(JSON.parse(readFileSync(join(origem, f), 'utf8')), id, trad[id] ?? trad[id.replace(/-phb$/, '')]);
}).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));

mkdirSync(join(raiz, 'dados'), { recursive: true });
writeFileSync(join(raiz, 'dados', 'magias.json'), JSON.stringify(magias));
const semTrad = magias.filter((m) => !m.resumo).length;
console.log(`${magias.length} magias em dados/magias.json (${semTrad} sem tradução)`);
