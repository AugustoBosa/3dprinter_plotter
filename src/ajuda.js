// Textos de ajuda e rótulos legíveis para as opções da UI.
// document só é usado dentro de ajuda(), para o import funcionar no Node.

export const AJUDA = {
  base: 'Fonte que forma as letras. Com mais de uma, as letras são misturadas conforme o peso. Funciona melhor com fontes da mesma família.',
  seed: 'Número inteiro. A mesma seed gera sempre a mesma mão. Trocar a seed muda os defeitos próprios de cada letra.',
  inclinacao: 'Inclina as letras, de -30 a 30 graus. 0 = letra reta; valores positivos deitam a letra para a direita.',
  largura: 'Largura das letras, de 0,5 a 1,5. 1 = tamanho original; menor deixa a letra estreita e maior deixa larga.',
  altura: 'Altura das letras, de 0,5 a 1,5. 1 = tamanho original; menor deixa a letra baixa e maior deixa alta.',
  espacamento: 'Espaço depois de cada letra, de -0,2 a 0,3 em (1 em = tamanho da letra). Negativo aperta as letras.',
  espacoPalavra: 'Espaço extra entre palavras, de 0 a 0,6 em. 0 = espaço normal.',
  idio: 'Quanto cada letra tem um defeito próprio, sempre o mesmo. É o que dá personalidade à mão. De 0 a 1.',
  pressa: 'Velocidade da escrita, de 0 a 1. Alto deixa a letra mais corrida, com traços menos cuidadosos e mais inclinada para frente.',
  capricho: 'Cuidado da escrita, de 0 a 1. 1 = letra no melhor da mão; menor deixa a letra relaxada e menos precisa.',
  tremor: 'Tremida da linha, de 0 a 2 mm. 0 = linha sem tremor; valores maiores deixam a letra trêmula.',
  queda: 'Desce ou sobe cada linha, de -2 a 2 mm por linha. Positivo faz cada linha descer um pouco mais que a anterior.',
  compressao: 'Espaço entre as letras, de 0,6 a 1,4. Menor deixa as letras mais coladas; maior deixa mais espaçadas.',
  variacao: 'Quanto a mesma letra muda cada vez que aparece, de 0 a 1. 0 = sempre igual; valores altos deixam o texto menos repetitivo.',
  desleixo: 'Desleixo da escrita, de 0 a 1. Deixa as letras tortas, a linha balançando e os tamanhos irregulares.',
  personagem: 'Cada personagem guarda uma mão e suas variações de humor. Você pode criar, salvar no navegador, abrir, excluir ou usar arquivo JSON.',
  variacaoSel: 'Humor ou situação da escrita, como formal ou apressado. Muda só o jeito de escrever, não a mão.',
  peso: 'Importância da fonte na mistura, de 0 a 1. Quanto maior, mais a letra se parece com essa fonte.',
  mutarSeed: 'Número que sorteia a mutação. O mesmo número dá sempre o mesmo resultado.',
  mutarForca: 'Quanto a mutação altera a mão, de 0 a 1. 0 = não altera; 1 = altera bastante a identidade da letra.',
  texto: 'O que será escrito. Deixe uma linha em branco para separar parágrafos.',
  pagina: 'Formato do papel: A4, A5, mesa da plotter de 210 x 210 mm ou personalizada.',
  larguraPagina: 'Largura da folha em mm. Use o valor do formato escolhido ou informe um tamanho personalizado.',
  alturaPagina: 'Altura da folha em mm. Use o valor do formato escolhido ou informe um tamanho personalizado.',
  margemTopo: 'Espaço em branco, em mm, entre a borda de cima e o texto.',
  margemDir: 'Espaço em branco, em mm, entre a borda da direita e o texto.',
  margemBase: 'Espaço em branco, em mm, entre a borda de baixo e o texto.',
  margemEsq: 'Espaço em branco, em mm, entre a borda da esquerda e o texto.',
  tamanho: 'Altura de uma letra, de 3 a 15 mm. Define o tamanho de todo o texto.',
  entrelinha: 'Distância entre as linhas, de 1 a 3. 1 = linhas coladas; 1,6 = confortável para ler.',
  alinhamento: 'Posição do texto: esquerda, centro ou justificado. Justificado estica o espaço para as linhas terminarem na margem.',
  comparar: 'Mostra duas variações do mesmo personagem lado a lado, para comparar o resultado.',
  offsetX: 'Distância, em mm, no eixo X, entre a ponta da caneta e a posição que a impressora acha que está. Corrige onde o desenho cai.',
  offsetY: 'Distância, em mm, no eixo Y, entre a ponta da caneta e a posição que a impressora acha que está. Corrige onde o desenho cai.',
  zEscrita: 'Altura Z, em mm, com a caneta tocando o papel. Ajuste até a caneta escrever sem falhar.',
  zLevantada: 'Altura Z, em mm, com a caneta no ar, ao se deslocar entre os traços.',
  fDesenho: 'Velocidade, em mm/min, enquanto a caneta escreve. Valores mais baixos escrevem com mais cuidado.',
  fViagem: 'Velocidade, em mm/min, com a caneta levantada, ao se deslocar entre os traços.',
  fZ: 'Velocidade, em mm/min, para subir e descer a caneta.',
  mesaX: 'Tamanho útil da mesa, em mm, no eixo X. O programa avisa se o desenho sair dela.',
  mesaY: 'Tamanho útil da mesa, em mm, no eixo Y. O programa avisa se o desenho sair dela.',
  header: 'Comandos G-code colocados no começo do arquivo, como aquecer ou zerar os eixos.',
  footer: 'Comandos G-code colocados no fim do arquivo, como estacionar a caneta.',
  otimizar: 'Reordena os traços para a caneta andar menos no ar. Não muda o desenho.',
};

export const ROTULOS = {
  base: 'fontes da mão',
  seed: 'seed da mão',
  inclinacao: 'inclinação (graus)',
  largura: 'largura',
  altura: 'altura',
  espacamento: 'espaçamento (em)',
  espacoPalavra: 'espaço entre palavras',
  idio: 'idiossincrasia',
  pressa: 'pressa',
  capricho: 'capricho',
  tremor: 'tremor (mm)',
  queda: 'queda por linha (mm)',
  compressao: 'compressão entre letras',
  variacao: 'variação',
  desleixo: 'desleixo',
  personagem: 'personagem',
  variacaoSel: 'variação',
  peso: 'peso',
  mutarSeed: 'seed da mutação',
  mutarForca: 'força da mutação',
  texto: 'texto',
  pagina: 'formato',
  larguraPagina: 'largura (mm)',
  alturaPagina: 'altura (mm)',
  margemTopo: 'margem superior (mm)',
  margemDir: 'margem direita (mm)',
  margemBase: 'margem inferior (mm)',
  margemEsq: 'margem esquerda (mm)',
  tamanho: 'tamanho (mm)',
  entrelinha: 'entrelinha',
  alinhamento: 'alinhamento',
  comparar: 'comparar duas variações',
  offsetX: 'desvio X (mm)',
  offsetY: 'desvio Y (mm)',
  zEscrita: 'altura Z ao escrever (mm)',
  zLevantada: 'altura Z no ar (mm)',
  fDesenho: 'velocidade de escrita (mm/min)',
  fViagem: 'velocidade no ar (mm/min)',
  fZ: 'velocidade de subir e descer (mm/min)',
  mesaX: 'mesa X (mm)',
  mesaY: 'mesa Y (mm)',
  header: 'início do arquivo (G-code)',
  footer: 'fim do arquivo (G-code)',
  otimizar: 'otimizar traços',
};

export function rotulo(chave) {
  return ROTULOS[chave] ?? chave;
}

export function ajuda(chave, texto = AJUDA[chave]) {
  if (!texto) throw new Error('sem texto de ajuda: ' + chave);
  const el = document.createElement('span');
  el.className = 'ajuda';
  el.tabIndex = 0;
  el.setAttribute('role', 'note');
  el.dataset.ajuda = texto;
  el.textContent = '?';
  const posicionar = () => {
    // tooltip: 220px de largura, centrado no "?"; empurra para dentro do contêiner (.esquerda ou dialog) ou da janela
    const r = el.getBoundingClientRect();
    const c = el.closest('.esquerda, dialog')?.getBoundingClientRect() ?? { left: 0, right: innerWidth };
    const centro = r.left + r.width / 2;
    const esq = Math.max(c.left + 4, Math.min(centro - 110, c.right - 4 - 220));
    el.style.setProperty('--dx', esq - (centro - 110) + 'px');
  };
  el.addEventListener('mouseenter', posicionar);
  el.addEventListener('focus', posicionar);
  return el;
}
