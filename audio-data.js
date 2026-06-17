/**
 * Extrai o manifesto de narração a partir do index.html.
 *
 * Uso:
 *   node audio-data.js              → gera audios/manifest.json
 *   const { buildManifest } = require('./audio-data');
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
const HTML_PATH = path.join(ROOT, 'index.html');
const OUTPUT_DIR = path.join(ROOT, 'audios');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

/** Textos customizados para slides com pouco conteúdo textual ou conteúdo dinâmico. */
const NARRATION_OVERRIDES = {
  s1:
    'Módulo de Treinamento. Segurança do Trabalho. NR-10 — ATEX — Áreas Classificadas. Capacitação em segurança nas Áreas Classificadas conforme NR-10 e ATEX.',
  s2:
    'Apresentação. Bem-vindo ao Treinamento. NR-10 — ATEX — Áreas Classificadas. Assista ao vídeo de introdução e avance quando concluir.',
  s6:
    'Sumário. Conteúdo Programático. Módulo 1: Fundamentos de Atmosferas Explosivas, ATEX. Módulo 2: Classificação e Mapeamento de Áreas. Módulo 3: Equipamentos de Proteção, Temperaturas e Rotulagem. Módulo 4: Riscos Inerentes e Identificação de Produtos Químicos. Módulo 5: Prevenção Contra Poeiras Combustíveis e Incêndios. Módulo 6: Boas Práticas de Gestão ATEX e Regras de Ouro da NR-10.',
  's-mod1':
    'Início do Módulo 1. Fundamentos de Atmosferas Explosivas, ATEX.',
  s2b:
    'Fundamentos. O que é uma Área Classificada? Área Classificada e Atmosfera Explosiva. Uma área classificada é qualquer local no ambiente de trabalho que apresente ou possa apresentar uma mistura perigosa de substâncias inflamáveis com o ar. Essa mistura, chamada de Atmosfera Explosiva, pode se formar devido à presença de gases, vapores, névoas, poeiras ou fibras combustíveis. Sinal EX. Toque em cada card para revelar os tipos de fontes de atmosfera explosiva. Gases e Vapores: substâncias inflamáveis em estado gasoso ou vaporizado misturadas ao ar. Névoas: gotículas finas suspensas no ar capazes de formar atmosfera explosiva. Poeiras e Fibras: partículas sólidas combustíveis que, em concentração, podem explodir. Toque em todos os cards para avançar.',
  s2c:
    'Vídeo. Tetraedro do Fogo. Fundamentos de Atmosferas Explosivas, ATEX. Assista ao vídeo sobre a concepção moderna do fogo: Combustível, Comburente, Energia de Ativação e Reação em Cadeia. Avance quando concluir.',
  s2d:
    'Vídeo. Atmosfera Explosiva. Fundamentos de Atmosferas Explosivas, ATEX. Assista ao vídeo sobre atmosferas potencialmente explosivas no dia a dia industrial — gases, vapores, poeiras e o reconhecimento de áreas classificadas. Avance quando concluir.',
  s2e: null, // montado a partir do deck do jogo Módulo 1
  's-mod2':
    'Início do Módulo 2. Classificação e Mapeamento de Áreas.',
  s3a:
    'Classificação. Método de Classificação Elétrica de Área. Como sabemos exatamente onde o perigo está? Para isso, utilizamos o Método de Classificação Elétrica de Área. Ele é um processo racional que delimita os volumes de controle e nos ajuda a mitigar qualquer fonte de ignição elétrica. Nesse processo, as substâncias são divididas em grupos principais. Grupo I — Minas: destinado a minas subterrâneas com risco de grisu. Grupo II — Gases Inflamáveis: abrange a maioria das indústrias, focado em gases e vapores inflamáveis. Grupo III — Poeiras Combustíveis: engloba poeiras e fibras combustíveis.',
  s3b:
    'Classificação. Grupos e Subdivisões. Classificação de grupos — gás ou poeira. Grupo I — Minas. Subdivisão I: Metano, Grisu. Grupo II — Gases Inflamáveis. Subdivisão IIA: Propano. IIB: Etileno. IIC: Acetileno. Grupo III — Poeiras Combustíveis. Subdivisão IIIA: Fibras combustíveis. IIIB: Poeiras não condutivas. IIIC: Poeiras condutivas.',
  s3c:
    'Vídeo. Zonas para Gases e Vapores. Classificação e Mapeamento de Áreas. Assista ao vídeo sobre zonas de áreas classificadas para gases e vapores. Avance quando concluir.',
  s3d:
    'Classificação. Zonas ATEX. Gases, vapores e névoas. Zona 0: Atmosfera Explosiva presente de forma contínua, por longos períodos. Frequência: Frequente. Zona 1: pode ocorrer em condições normais de funcionamento. Frequência: Ocasional. Zona 2: não é provável em condições normais. Frequência: Esporádico. Poeiras e fibras combustíveis. Zona 20: Nuvem de Poeira ou Fibra Combustível presente de forma contínua, por longos períodos. Frequência: Frequente. Zona 21: pode ocorrer em condições normais de funcionamento. Frequência: Ocasional. Zona 22: não é provável em condições normais. Frequência: Esporádico.',
  s3e:
    'Vídeo. Zonas de Poeiras e Fibras. Classificação e Mapeamento de Áreas. Assista ao vídeo sobre zonas de áreas classificadas para poeiras e fibras combustíveis. Avance quando concluir.',
  s3f:
    'Quiz. Módulo 2. Classificação e Mapeamento de Áreas. Cinco perguntas objetivas sobre o que você viu nos vídeos: método de classificação elétrica, grupos ATEX e zonas para gases, vapores e poeiras. Acerte pelo menos três questões para concluir o módulo.',
};

function cleanText(text) {
  return (text || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSlideText(slide) {
  const clone = slide.cloneNode(true);
  clone
    .querySelectorAll('script, iframe, svg, .wave, button, style, .nav-btn, .zoom-btn')
    .forEach((el) => el.remove());

  const custom = slide.getAttribute('data-audio-text');
  if (custom) return cleanText(custom);

  let text = cleanText(clone.textContent || '');

  if (text.length < 40) {
    const iframeTitle = slide.querySelector('iframe[title]')?.getAttribute('title');
    const imgAlt = slide.querySelector('img[alt]')?.getAttribute('alt');
    const title = slide.querySelector('.slide-title')?.textContent;
    const parts = [title, iframeTitle, imgAlt].map(cleanText).filter(Boolean);
    if (parts.length) text = parts.join('. ');
  }

  return text;
}

function parseQuizQuestions(html) {
  const match = html.match(/const\s+q1_questions\s*=\s*(\[[\s\S]*?\n\s*\]);/);
  if (!match) return [];

  try {
    return Function(`"use strict"; return (${match[1]});`)();
  } catch {
    return [];
  }
}

function parseQ5Questions(html) {
  const match = html.match(/const\s+q5_questions\s*=\s*(\[[\s\S]*?\n\s*\]);/);
  if (!match) return [];

  try {
    return Function(`"use strict"; return (${match[1]});`)();
  } catch {
    return [];
  }
}

function parseMod1GameDeck(html) {
  const match = html.match(/const\s+mod1GameDeck\s*=\s*(\[[\s\S]*?\n\s*\]);/);
  if (!match) return [];

  try {
    return Function(`"use strict"; return (${match[1]});`)();
  } catch {
    return [];
  }
}

function buildMod1Narration(deck) {
  const zones = {
    fuel: 'Combustível',
    oxidizer: 'Comburente',
    energy: 'Energia de Ativação',
    chain: 'Reação em Cadeia',
  };

  if (!deck.length) {
    return 'Desafio ATEX — Módulo 1. Tetraedro do Fogo. Classifique quatro situações nos elementos do tetraedro. Conclua o desafio para validar o módulo.';
  }

  const parts = [
    'Desafio. Tetraedro do Fogo. Desafio ATEX — Módulo 1. Classifique quatro situações nos elementos do Tetraedro do Fogo: Combustível, Comburente, Energia de Ativação e Reação em Cadeia. Toque na opção correta para avançar. Conclua o desafio para validar o módulo.',
  ];

  deck.forEach((item, index) => {
    parts.push(`Situação ${index + 1}: ${cleanText(item.text)}`);
    parts.push(`Resposta correta: ${zones[item.zone] || item.zone}. ${cleanText(item.tip)}`);
  });

  return parts.join(' ');
}

function parseMod3BinaryDeck(html) {
  const match = html.match(/const\s+mod3BinaryDeck\s*=\s*(\[[\s\S]*?\n\s*\]);/);
  if (!match) return [];

  try {
    return Function(`"use strict"; return (${match[1]});`)();
  } catch {
    return [];
  }
}

function parseMod4RiskDeck(html) {
  const match = html.match(/const\s+mod4RiskDeck\s*=\s*(\[[\s\S]*?\n\s*\]);/);
  if (!match) return [];

  try {
    return Function(`"use strict"; return (${match[1]});`)();
  } catch {
    return [];
  }
}

function buildMod3Narration(deck) {
  if (!deck.length) {
    return 'Desafio do Módulo 3. Permitido ou Proibido. Decida se cada prática pode ou não ser realizada na operação da PEMT. Conclua o jogo para validar o módulo.';
  }

  const parts = [
    'Desafio do Módulo 3. Permitido ou Proibido. Decida se cada prática pode ou não ser realizada na operação da PEMT. Cinco situações sobre movimentação, clima e segurança elétrica.',
  ];

  deck.forEach((item, index) => {
    const answer = item.allowed ? 'Permitido' : 'Proibido';
    parts.push(`Situação ${index + 1}: ${cleanText(item.text)} Resposta correta: ${answer}. ${cleanText(item.tip)}`);
  });

  parts.push('Conclua o jogo para validar o módulo.');
  return parts.join(' ');
}

function buildMod4Narration(deck) {
  const alternatives = ['Gambiarra', 'Organização', 'Elevação Insegura'];

  if (!deck.length) {
    return 'Desafio do Módulo 4. Identifique o Risco. Classifique cada situação como Gambiarra, Organização ou Elevação Insegura. Conclua o jogo para validar o módulo.';
  }

  const parts = [
    'Desafio do Módulo 4. Identifique o Risco. Classifique cada situação como Gambiarra, falha de Organização ou Elevação Insegura. Três cenários sobre proibições e procedimentos inseguros da PEMT.',
  ];

  deck.forEach((item, index) => {
    parts.push(`Situação ${index + 1}: ${cleanText(item.text)}`);
    alternatives.forEach((opt, optIndex) => {
      parts.push(`Alternativa ${optIndex + 1}: ${opt}`);
    });
  });

  parts.push('Conclua o jogo para validar o módulo.');
  return parts.join(' ');
}

function buildQuizNarration(questions, moduleNum = 1) {
  if (!questions.length) {
    return `Quiz do Módulo ${moduleNum}. Responda às perguntas sobre os conceitos apresentados no módulo.`;
  }

  const parts = [
    `Quiz do Módulo ${moduleNum}. Responda às ${questions.length} perguntas sobre os conceitos do módulo.`,
  ];

  questions.forEach((item, index) => {
    parts.push(`Pergunta ${index + 1}: ${cleanText(item.q)}`);
    item.opts.forEach((opt, optIndex) => {
      parts.push(`Alternativa ${optIndex + 1}: ${cleanText(opt)}`);
    });
  });

  return parts.join(' ');
}

function slideTitle(slide) {
  const titleEl = slide.querySelector('.slide-title, .mod-intro-title, h1');
  return cleanText(titleEl?.textContent || slide.id);
}

function buildManifest(htmlPath = HTML_PATH) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const quizQuestions = parseQuizQuestions(html);
  const q5Questions = parseQ5Questions(html);
  const mod3Deck = parseMod3BinaryDeck(html);
  const mod4Deck = parseMod4RiskDeck(html);
  const mod1Deck = parseMod1GameDeck(html);

  const slides = [...doc.querySelectorAll('#slides .slide')].map((slide, index) => {
    const id = slide.id || `slide-${index + 1}`;
    let text = NARRATION_OVERRIDES[id];

    if (text === null && id === 's7d') {
      text = buildQuizNarration(quizQuestions, 1);
    } else if (text === null && id === 's31') {
      text = buildQuizNarration(q5Questions, 5);
    } else if (text === null && id === 's26') {
      text = buildMod3Narration(mod3Deck);
    } else if (text === null && id === 's30') {
      text = buildMod4Narration(mod4Deck);
    } else if (text === null && id === 's2e') {
      text = buildMod1Narration(mod1Deck);
    } else if (text === undefined) {
      text = extractSlideText(slide);
    }

    if (!text) {
      text = `Slide ${index + 1}. ${slideTitle(slide)}`;
    }

    return {
      index,
      id,
      title: slideTitle(slide),
      file: `audios/${id}.mp3`,
      text,
      audioReady: fs.existsSync(path.join(ROOT, 'audios', `${id}.mp3`)),
    };
  });

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: path.basename(htmlPath),
    audioDir: 'audios',
    slides,
  };
}

function writeManifest(manifest, outputPath = MANIFEST_PATH) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf8');

  const jsPath = path.join(path.dirname(outputPath), 'audio-manifest.js');
  fs.writeFileSync(
    jsPath,
    `window.__AUDIO_NARRATION__ = ${JSON.stringify(manifest)};\n`,
    'utf8',
  );

  return outputPath;
}

if (require.main === module) {
  const manifest = buildManifest();
  const out = writeManifest(manifest);
  console.log(`Manifesto gerado: ${out}`);
  console.log(`${manifest.slides.length} slides encontrados.`);
  manifest.slides.forEach((slide) => {
    console.log(`  [${String(slide.index + 1).padStart(2, '0')}] ${slide.id} (${slide.text.length} chars)`);
  });
}

module.exports = {
  HTML_PATH,
  MANIFEST_PATH,
  OUTPUT_DIR,
  NARRATION_OVERRIDES,
  buildManifest,
  writeManifest,
  extractSlideText,
  cleanText,
  buildMod1Narration,
  parseMod1GameDeck,
};
