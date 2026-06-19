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
    'Módulo 2. Classificação e Mapeamento de Áreas. Neste módulo você aprenderá a identificar onde o perigo está na fábrica, conhecer os grupos de classificação ATEX, as subdivisões por tipo de substância e o mapeamento em zonas para gases, vapores, névoas, poeiras e fibras combustíveis.',
  s3a:
    'Classificação. Método de Classificação Elétrica de Área. Como sabemos exatamente onde o perigo está? Para isso, utilizamos o Método de Classificação Elétrica de Área. Ele é um processo racional que delimita os volumes de controle e nos ajuda a mitigar qualquer fonte de ignição elétrica. Nesse processo, as substâncias são divididas em grupos principais. Grupo I — Minas: destinado a minas subterrâneas com risco de grisu. Grupo II — Gases Inflamáveis: abrange a maioria das indústrias, focado em gases e vapores inflamáveis. Grupo III — Poeiras Combustíveis: engloba poeiras e fibras combustíveis. Revise cada grupo nos cards de classificação ATEX.',
  s3b:
    'Classificação. Grupos e Subdivisões. Classificação de grupos — gás ou poeira. Grupo I — Minas. Subdivisão I: Metano, Grisu. Grupo II — Gases Inflamáveis. Subdivisão IIA: Propano. Subdivisão IIB: Etileno. Subdivisão IIC: Acetileno. Grupo III — Poeiras Combustíveis. Subdivisão IIIA: Fibras combustíveis. Subdivisão IIIB: Poeiras não condutivas. Subdivisão IIIC: Poeiras condutivas.',
  s3c:
    'Vídeo. Zonas para Gases e Vapores. Classificação e Mapeamento de Áreas. Assista ao vídeo. Para garantir a sua segurança, mapeamos a probabilidade de uma mistura explosiva acontecer dividindo a fábrica em Zonas. Para gases e vapores, preste muita atenção: a Zona 0 é o local mais crítico, onde a atmosfera explosiva está presente de forma contínua ou frequente, por longos períodos. A Zona 1 é onde esse perigo pode ocorrer de forma ocasional durante o funcionamento normal. Já a Zona 2 é um local onde a mistura não é provável de ocorrer no dia a dia, sendo considerada um risco apenas esporádico. Avance quando concluir o vídeo.',
  s3e:
    'Vídeo. Zonas de Poeiras e Fibras. Classificação e Mapeamento de Áreas. Assista ao vídeo. O perigo não vem só dos gases. Quando lidamos com nuvens de poeira ou fibras combustíveis, usamos uma numeração diferente, mas a lógica de proteção é a mesma. A Zona 20 indica que a poeira explosiva está presente de forma contínua e frequente. A Zona 21 sinaliza que a nuvem perigosa pode ocorrer ocasionalmente nas condições normais. Por fim, a Zona 22 é a área de risco esporádico, onde não é provável que a nuvem se forme no funcionamento normal. Conhecer exatamente em qual Zona você está pisando é o que preserva a sua vida. Avance quando concluir o vídeo.',
  s3d:
    'Classificação. Zonas ATEX. Classificação de zonas ATEX. Grupo II — Gases, vapores e névoas. Zona 0: local onde uma Atmosfera Explosiva de Gás, Vapor ou Névoa está presente de forma contínua, por longos períodos. Frequência: Frequente. Zona 1: local onde uma Atmosfera Explosiva de Gás, Vapor ou Névoa pode ocorrer em condições normais de funcionamento. Frequência: Ocasional. Zona 2: local onde uma Atmosfera Explosiva de Gás, Vapor ou Névoa não é provável de ocorrer em condições normais de funcionamento. Frequência: Esporádico. Grupo III — Poeiras e fibras combustíveis. Zona 20: local onde uma Atmosfera Explosiva de Nuvem de Poeira ou Fibra Combustível está presente de forma contínua, por longos períodos. Frequência: Frequente. Zona 21: local onde a nuvem de poeira ou fibra combustível pode ocorrer em condições normais de funcionamento. Frequência: Ocasional. Zona 22: local onde a nuvem de poeira ou fibra combustível não é provável de ocorrer em condições normais de funcionamento. Frequência: Esporádico.',
  s3f: null, // montado a partir do quiz Módulo 2
  's-mod4':
    'Módulo 4. Riscos Inerentes e Identificação de Produtos Químicos. Neste módulo você aprenderá a reconhecer fontes de ignição, formação de atmosferas explosivas, riscos de equipamentos inadequados, e como identificar produtos químicos por meio da FDS, rotulagem GHS e compatibilidade química.',
  s4v:
    'Vídeo. Riscos Químicos. Riscos Inerentes e Identificação de Produtos Químicos. Assista ao vídeo sobre riscos químicos em áreas classificadas, identificação de produtos perigosos e cuidados no manuseio em ambiente ATEX. Avance quando concluir.',
  s4s:
    'Sinalização. Classes de Perigo do GHS — Globally Harmonized System. Tabela de pictogramas de perigo. Oxidantes e peróxidos orgânicos. Toxidade aguda severa. Carcinogênico, sensibilizante à respiração, toxidade à reprodução, toxidade a órgãos-alvo e mutagenicidade. Inflamáveis, auto-reativos, autoforrícos, pirofóricos, auto-aquecíveis e emissão de gás inflamável. Corrosivos. Irritante, sensibilizante dérmico e toxidade aguda perigosa. Explosivos, reativos e peróxidos orgânicos. Gases sob pressão. Perigoso para o meio ambiente. Consulte a tabela de sinalização GHS para identificar corretamente os produtos químicos.',
  s4a:
    'Riscos Inerentes. O que torna uma área classificada perigosa no dia a dia? Além da classificação de zonas, existem riscos inerentes — perigos que podem estar presentes mesmo quando seguimos procedimentos. Fontes de Ignição: faíscas, superfícies quentes, descargas eletrostáticas e equipamentos elétricos não certificados Ex podem acender uma mistura inflamável. Formação de AE: vazamentos, evaporação, acúmulo de poeiras e névoas aumentam a concentração de substâncias inflamáveis no ar. Equipamento Inadequado: usar material sem certificação Ex, temperatura superficial incorreta ou categoria de proteção inadequada para a zona é risco inerente grave.',
  s4b:
    'Identificação de Produtos Químicos. FDS, Rotulagem e Compatibilidade. Em áreas classificadas, o manuseio de produtos químicos inflamáveis exige identificação correta antes de qualquer operação. FDS — Ficha de Dados de Segurança: documento obrigatório com informações sobre perigos, manuseio, armazenamento, EPIs e procedimentos de emergência. Consulte ponto de fulgor, limites de explosividade e incompatibilidades. Rotulagem GHS e CLP: pictogramas, frases de perigo H e de precaução P identificam inflamabilidade, toxicidade e reatividade. Compatibilidade Química: misturar produtos incompatíveis pode gerar reação violenta, calor ou gases inflamáveis. Sempre consulte a FDS, separe incompatíveis e use recipientes adequados. Toque em todos os cards para avançar.',
  s4f: null, // montado a partir do deck do jogo Módulo 4
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

function parseQm2Questions(html) {
  const match = html.match(/const\s+qm2_questions\s*=\s*(\[[\s\S]*?\n\s*\]);/);
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

function buildMod2Narration(questions) {
  if (!questions.length) {
    return 'Desafio ATEX — Módulo 2. Classificação e Zonas. Responda cinco perguntas sobre grupos de classificação, zonas para gases e zonas para poeiras. Acerte pelo menos três questões para concluir o módulo.';
  }

  const parts = [
    'Desafio. Classificação e Zonas. Desafio ATEX — Módulo 2. Responda cinco perguntas sobre grupos de classificação ATEX, método de classificação elétrica de área, zonas para gases e vapores e zonas para poeiras e fibras combustíveis. Acerte pelo menos três questões para concluir o módulo.',
  ];

  questions.forEach((item, index) => {
    parts.push(`Pergunta ${index + 1}: ${cleanText(item.q)}`);
    item.opts.forEach((opt, optIndex) => {
      const marker = optIndex === item.correct ? 'Resposta correta' : `Alternativa ${optIndex + 1}`;
      parts.push(`${marker}: ${cleanText(opt)}`);
    });
    if (item.feedback_ok) {
      parts.push(cleanText(item.feedback_ok));
    }
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
  const alternatives = ['Fonte de Ignição', 'Produto Químico', 'Procedimento Inseguro'];

  if (!deck.length) {
    return 'Desafio do Módulo 4. Identifique o Risco. Classifique cada situação como Fonte de Ignição, Produto Químico ou Procedimento Inseguro. Conclua o jogo para validar o módulo.';
  }

  const parts = [
    'Desafio do Módulo 4. Identifique o Risco. Classifique cada situação como Fonte de Ignição, Produto Químico ou Procedimento Inseguro. Três cenários sobre riscos inerentes e manuseio de químicos em área classificada.',
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
  const qm2Questions = parseQm2Questions(html);

  const slides = [...doc.querySelectorAll('#slides .slide')].map((slide, index) => {
    const id = slide.id || `slide-${index + 1}`;
    let text = NARRATION_OVERRIDES[id];

    if (text === null && id === 's7d') {
      text = buildQuizNarration(quizQuestions, 1);
    } else if (text === null && id === 's31') {
      text = buildQuizNarration(q5Questions, 5);
    } else if (text === null && id === 's26') {
      text = buildMod3Narration(mod3Deck);
    } else if (text === null && id === 's4f') {
      text = buildMod4Narration(mod4Deck);
    } else if (text === null && id === 's2e') {
      text = buildMod1Narration(mod1Deck);
    } else if (text === null && id === 's3f') {
      text = buildMod2Narration(qm2Questions);
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
  buildMod2Narration,
  parseQm2Questions,
};
