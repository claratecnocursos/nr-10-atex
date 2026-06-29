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
    'Classificação. Zonas ATEX. Classificação de zonas ATEX. Grupo II — Gases, vapores e névoas. Zona 0: local onde uma Atmosfera Explosiva de Gás, Vapor ou Névoa está presente de forma contínua, por longos períodos. Frequência: Frequente. Zona 1: local onde uma Atmosfera Explosiva de Gás, Vapor ou Névoa pode ocorrer in condições normais de funcionamento. Frequência: Ocasional. Zona 2: local onde uma Atmosfera Explosiva de Gás, Vapor ou Névoa não é provável de ocorrer em condições normais de funcionamento. Frequência: Esporádico. Grupo III — Poeiras e fibras combustíveis. Zona 20: local onde uma Atmosfera Explosiva de Nuvem de Poeira ou Fibra Combustível está presente de forma contínua, por longos períodos. Frequência: Frequente. Zona 21: local onde a nuvem de poeira ou fibra combustível pode ocorrer em condições normais de funcionamento. Frequência: Ocasional. Zona 22: local onde a nuvem de poeira ou fibra combustível não é provável de ocorrer em condições normais de funcionamento. Frequência: Esporádico.',
  s3v4:
    'Tabela de Tipos de Proteção Ex para Gases e Vapores. A tabela de tipos de proteção Ex para gases e vapores nos mostra quais tipos de proteção são adequados para cada zona de risco, que vão da Zona zero, que é a mais crítica, até as Zonas um e dois. Primeiro, temos o modo de proteção letra d, que corresponde ao Equipamento à Prova de Explosão. Ele é indicado para aplicação nas Zonas um e dois. Em seguida, o tipo e, que representa o Equipamento de Segurança Aumentada, também permitido nas Zonas um e dois. Já o modo de proteção i, de Segurança Intrínseca, é dividido em duas categorias: A categoria i-a é extremamente segura e pode ser utilizada em qualquer zona, ou seja, nas Zonas zero, um e dois. A categoria i-b é permitida apenas nas Zonas um e dois. Continuando, temos o tipo m, que identifica Equipamentos Imersos em Resina, e o tipo n, que representa os Equipamentos Não Acendíveis. Ambos são aplicados nas Zonas um e dois. O tipo o refere-se a Equipamentos Imersos em Óleo, o tipo p a Equipamentos Pressurizados, e o tipo q a Equipamentos Imersos em Areia. Todos estes três modos de proteção são adequados para as Zonas um e dois. Por fim, temos o tipo s, que representa os Equipamentos Especiais. Eles podem ser aplicados nas Zonas um e dois e, sob condições e certificações específicas, também na Zona zero, indicado pelo asterisco com a letra X na tabela. Lembre-se: conhecer o tipo de proteção e a zona correta de aplicação é essencial para evitar riscos de ignição no ambiente de trabalho!',
  s3v5:
    'Tabela de Modos de Proteção para Poeiras e Fibras Combustíveis. A tabela de modos de proteção para poeiras e fibras combustíveis nos mostra quais tipos de proteção são adequados para as zonas de risco, que vão da Zona vinte, que é a mais crítica, até as Zonas vinte e um e vinte e dois. Primeiro, temos o modo de proteção t-D, que corresponde ao Equipamento com Invólucro Estanque a Poeira. Ele é indicado para aplicação nas Zonas vinte e um e vinte e dois. Em seguida, o modo de proteção m-D, que identifica equipamentos com partes protegidas em resina, é dividido em duas categorias: A categoria m-a-D é extremamente segura e pode ser utilizada em qualquer zona de poeira, ou seja, nas Zonas vinte, vinte e um e vinte e dois. A categoria m-b-D é permitida apenas nas Zonas vinte e um e vinte e dois. Por fim, temos o tipo i-D, que representa o Equipamento de Segurança Intrínseca. Este modo de proteção é altamente seguro e adequado para aplicação em todas as zonas de risco, cobrindo as Zonas vinte, vinte e um e vinte e dois. Lembre-se: selecionar o equipamento com o modo de proteção adequado para poeiras é essencial para evitar o risco de explosões catastróficas em áreas classificadas!',
  s3v6:
    'Tabela de Rotulagem de Equipamentos Ex. A rotulagem de equipamentos Ex nos mostra as marcações obrigatórias impressas na placa de identificação de um equipamento certificado para áreas classificadas. Ao analisar a imagem da placa de identificação, identificamos os seguintes itens essenciais: Primeiro, no canto superior esquerdo, temos o Logotipo do INMETRO e a marcação UL Listed, que comprovam que o equipamento passou por ensaios em laboratórios credenciados. Logo abaixo, a indicação BR indica a Rotulagem e Certificação Brasileira, atestando a conformidade com as normas nacionais. No centro da placa, vemos a marcação BR hífen Ex m II T3. O código Ex m indica que o tipo de proteção do equipamento é por encapsulamento, geralmente em resina epóxi, impedindo que uma centelha interna entre em contato com a atmosfera explosiva. O algarismo romano II indica o Grupo de utilização do equipamento, adequado para indústrias de superfície com presença de gases ou vapores inflamáveis. A indicação T3 representa a classe de temperatura, definindo que a temperatura máxima que a superfície externa do equipamento pode atingir é de duzentos graus Celsius. Abaixo dessa linha, vemos a indicação Tamb de menos quinze graus a mais cinquenta graus Celsius, informando a faixa de temperatura ambiente de operação segura, seguida pelas especificações de tensão elétrica. No rodapé da placa, vemos o código do certificado do equipamento, que no exemplo é zero quatro barra U-L hífen B-R-A-E hífen zero zero zero nove X. O caractere X ao final do número do certificado indica que existem condições específicas para a instalação ou uso seguro do equipamento, descritas em seu manual. Por fim, no canto inferior esquerdo, temos a indicação de certificado relativo ao equipamento. Lembre-se: ler e interpretar corretamente a placa de identificação Ex é fundamental antes de realizar qualquer instalação ou manutenção em áreas classificadas!',
  s3t:
    'Tabela de Classes de Temperatura. Esta tabela apresenta a classificação da temperatura máxima de superfície de equipamentos elétricos conforme a norma NEC quinhentos ponto oito C. A temperatura máxima de superfície é a maior temperatura que o equipamento pode atingir na sua carcaça ou partes externas para evitar a ignição da atmosfera explosiva. A classe T1 permite uma temperatura máxima de quatrocentos e cinquenta graus Celsius. A classe T2 permite trezentos graus Celsius, dividindo-se também em subgrupos como T2A de duzentos e oitenta graus, T2B de duzentos e sessenta graus, T2C de duzentos e trinta graus, e T2D de duzentos e quinze graus. A classe T3 permite duzentos graus Celsius, contendo os subgrupos T3A de cento e oitenta graus, T3B de cento e sessenta e cinco graus, e T3C de cento e sessenta graus. A classe T4 permite cento e trinta e cinco graus Celsius, com a subclasse T4A de cento e vinte graus. A classe T5 permite cem graus Celsius. E por fim, a classe T6 é a mais segura e restritiva, limitando a temperatura a no máximo oitenta e cinco graus Celsius.',
  s3f: null, // montado a partir do quiz Módulo 2
  's-mod4':
    'Módulo 4. Riscos Inerentes e Identificação de Produtos Químicos. Neste módulo você aprenderá a reconhecer fontes de ignição, formação de atmosferas explosivas, riscos de equipamentos inadequados, e como identificar produtos químicos por meio da FDS, rotulagem GHS e compatibilidade química.',
  s4v:
    'Vídeo. Riscos Químicos. Riscos Inerentes e Identificação de Produtos Químicos. Assista ao vídeo sobre riscos químicos em áreas classificadas, identificação de produtos perigosos e cuidados no manuseio em ambiente ATEX. Avance quando concluir.',
  s4s:
    'Tabela de Classes de Perigo do GHS. A tabela de classes de perigo do GHS, ou Sistema Globalmente Harmonizado, apresenta os pictogramas de perigo utilizados na rotulagem de produtos químicos. A tabela está organizada em três linhas de pictogramas, facilitando a identificação visual dos riscos. Na primeira linha, temos três pictogramas: O primeiro mostra uma chama sobre um círculo, que representa substâncias oxidantes e peróxidos orgânicos. O segundo mostra uma caveira e ossos cruzados, indicando risco de toxicidade aguda severa, ou seja, perigo grave à saúde em caso de exposição ou ingestão. O terceiro exibe a silhueta de uma pessoa com uma estrela no peito, simbolizando perigos crônicos à saúde, como substâncias carcinogênicas, sensibilizantes respiratórios, tóxicas à reprodução, mutagênicas ou com toxicidade a órgãos-alvo. Na segunda linha, encontramos mais três riscos: O primeiro pictograma mostra uma chama simples, identificando produtos inflamáveis, auto-reativos, pirofóricos, auto-aquecíveis ou que emitem gases inflamáveis. O segundo mostra substâncias pingando sobre uma superfície e sobre uma mão, indicando produtos corrosivos, que causam queimaduras severas na pele e danos aos olhos. O terceiro mostra um ponto de exclamação, representando produtos irritantes, sensibilizantes cutâneos ou com toxicidade aguda perigosa. Na terceira linha, concluímos com os últimos três pictogramas: O primeiro representa uma bomba explodindo, indicando substâncias altamente explosivas, reativas ou peróxidos orgânicos. O segundo exibe um cilindro de gás, identificando recipientes contendo gases sob pressão. O terceiro mostra uma árvore sem folhas e um peixe fora da água, identificando substâncias com perigo agudo ou crônico para o meio ambiente, especialmente a vida aquática. Lembre-se: reconhecer e entender estes pictogramas de perigo na FDS e nos rótulos é essencial para garantir a segurança no manuseio de produtos químicos em áreas classificadas!',
  s4s3:
    'Tabela do Painel de Segurança e Ficha de Emergência. O Painel de Segurança é uma placa retangular na cor laranja utilizada no transporte de produtos perigosos para identificação rápida dos riscos. Ao analisarmos a imagem, vemos que o painel é composto por duas linhas de números. Na linha superior, temos o Número de Risco, composto por dois ou três algarismos. O primeiro algarismo indica o risco principal, e o segundo e terceiro algarismos representam os riscos subsidiários ou a intensidade do risco. No primeiro exemplo da imagem, vemos o número oitenta na parte superior. O número oitenta indica que o produto é corrosivo, e o zero indica a ausência de risco subsidiário. Na parte inferior do painel, vemos o Número da ONU, composto por quatro algarismos que identificam internacionalmente a substância química. No primeiro exemplo, o número mil oitocentos e vinte e quatro identifica o Hidróxido de Sódio em solução, popularmente conhecido como soda cáustica. A imagem também mostra fotos de caminhões tanques carregados com cargas perigosas, exibindo os respectivos painéis de segurança e rótulos de risco nas laterais e na traseira, incluindo a identificação de Atmosferas Explosivas com o símbolo EX. No segundo exemplo, na parte inferior da tela, temos um painel com o número de risco meia três na linha superior e o número da ONU dois mil setecentos e oitenta e três na linha inferior. Neste caso, no número de risco meia três, o primeiro algarismo, seis, indica que o produto é tóxico. O segundo algarismo, três, representa o risco subsidiário de inflamabilidade. Portanto, temos um produto tóxico e inflamável. O número dois mil setecentos e oitenta e três na linha de baixo identifica o produto como um defensivo agrícola organofosforado. Lembre-se: em caso de acidentes ou vazamentos, identificar corretamente os números no Painel de Segurança e consultar a Ficha de Emergência é a primeira e mais importante ação para resgates e contenção segura do produto!',
  s4s5:
    'Tabela de Riscos à Saúde e Reatividade. Esta página apresenta as tabelas de classificação detalhadas para duas das quatro cores do Diamante de Hommel: o Risco à Saúde, na cor azul, e a Instabilidade ou Reatividade, na cor amarela. Ambas as escalas vão do nível zero, representando a ausência de perigo, até o nível quatro, que representa o perigo máximo. Vamos analisar primeiro a tabela de Risco à Saúde, representada em azul: O nível zero indica que a substância não apresenta riscos à saúde e nenhuma precaução especial é necessária, como a água ou o propilenoglicol. O nível um indica que a exposição pode causar irritação local, mas apenas danos residuais leves, como a acetona ou o cloreto de sódio. O nível dois indica que a exposição prolongada ou persistente, mas não crônica, pode causar incapacidade temporária ou possíveis danos residuais, como o éter etílico e o clorofórmio. O nível três indica que uma exposição curta pode causar sérios danos residuais temporários ou permanentes, como a amônia e o ácido sulfúrico. O nível quatro representa o risco máximo, indicando que uma exposição muito curta pode causar a morte ou sérios danos residuais graves, como o cianeto de hidrogênio e o fosgênio. Agora, analisando a tabela de Reatividade, representada em amarelo: O nível zero indica substâncias normalmente estáveis, mesmo sob exposição ao fogo, e que não reagem com a água, como a água e o gás hélio. O nível um indica produtos normalmente estáveis, mas que podem se tornar instáveis sob temperaturas e pressões elevadas, como o propano. O nível dois indica que o material sofre alteração química violenta sob altas temperaturas e pressões, reage violentamente com a água ou pode formar misturas explosivas com ela, como o metal sódio e o ácido sulfúrico. O nível três indica substâncias capazes de detonar ou decompor-se de forma explosiva, mas que requerem uma fonte de ignição forte, aquecimento sob confinamento, ou que reagem de forma explosiva com a água ou sob impacto, como o nitrato de amônio e o nitrometano. O nível quatro indica o risco máximo de reatividade, representando produtos instantaneamente capazes de detonar ou decompor-se de forma explosiva sob condições normais de temperatura e pressão, como a nitroglicerina e o trinitrotolueno, também conhecido como T-N-T. Lembre-se: compreender essas classificações nos permite escolher o equipamento de proteção individual correto e os procedimentos de manuseio seguros para cada substância no ambiente industrial!',
  s4s6:
    'Tabela de Inflamabilidade e Risco Específico. Esta página apresenta as tabelas de classificação detalhadas para as duas cores restantes do Diamante de Hommel: a Inflamabilidade, na cor vermelha, e o Risco Específico, na cor branca. Vamos analisar primeiro a tabela de Inflamabilidade, representada em vermelho, que varia de zero a quatro: O nível zero indica materiais que não queimam, mesmo sob condições severas de exposição ao fogo, como a água e o gás hélio. O nível um indica produtos que precisam ser pré-aquecidos para que a ignição ocorra, com ponto de fulgor por volta de noventa e três graus Celsius, como o óleo mineral. O nível dois indica que o material precisa ser moderadamente aquecido ou exposto a uma temperatura ambiente relativamente alta para que a ignição possa ocorrer, apresentando ponto de fulgor entre trinta e oito e noventa e três graus Celsius, como o combustível diesel. O nível três indica líquidos e sólidos que podem inflamar-se sob quase todas as condições de temperatura ambiente, com ponto de fulgor abaixo de vinte e três graus e ponto de ebulição acima de trinta e oito graus Celsius, como o etanol e o benzeno. O nível quatro indica o grau máximo de inflamabilidade. São gases e líquidos inflamáveis que vaporizam rápida e completamente sob condições normais de pressão e temperatura, ou que se dispersam no ar inflamando-se instantaneamente, com ponto de fulgor abaixo de vinte e três graus Celsius, como o éter etílico. Agora, analisando a tabela de Risco Específico, representada em branco na parte inferior ou lateral do diamante. Esta área não exibe números, mas sim símbolos e siglas de advertência especiais: A sigla O-X representa substâncias oxidantes, que liberam oxigênio facilmente e alimentam a combustão de outros materiais, como o hipoclorito de potássio. A letra W cortada por um traço indica materiais que reagem com a água de maneira incomum ou perigosa, como o metal sódio. A sigla S-A indica gases asfixiantes simples, que deslocam o oxigênio do ar e representam risco de sufocamento em ambientes confinados, como o hélio e o nitrogênio gasoso. Lembre-se: ler o Diamante de Hommel nos ajuda a identificar rapidamente os riscos principais de qualquer produto armazenado ou transportado nas dependências da fábrica!',
  s4a:
    'Riscos Inerentes. O que torna uma área classificada perigosa no dia a dia? Além da classificação de zonas, existem riscos inerentes — perigos que podem estar presentes mesmo quando seguimos procedimentos. Fontes de Ignição: faíscas, superfícies quentes, descargas eletrostáticas e equipamentos elétricos não certificados Ex podem acender uma mistura inflamável. Formação de AE: vazamentos, evaporação, acúmulo de poeiras e névoas aumentam a concentração de substâncias inflamáveis no ar. Equipamento Inadequado: usar material sem certificação Ex, temperatura superficial incorreta ou categoria de proteção inadequada para a zona é risco inerente grave.',

  s4f: null, // montado a partir do deck do jogo Módulo 4
  's-mod5':
    'Módulo 5. Prevenção Contra Poeiras Combustíveis e Incêndios. Neste módulo você aprenderá sobre a prevenção e controle de poeiras combustíveis, mitigação de riscos de incêndio em áreas classificadas, e os principais procedimentos e equipamentos de segurança associados.',
  s5v:
    'Vídeo. Poeiras e Incêndios. Prevenção Contra Poeiras Combustíveis e Incêndios. Assista ao vídeo sobre a prevenção contra poeiras combustíveis e incêndios em áreas classificadas. Avance quando concluir.',
  s5a:
    'Fundamentos. Poeiras Combustíveis. O Conceito de Poeiras Combustíveis. Uma poeira combustível é qualquer sólido particulado combustível finamente dividido que apresenta um perigo de incêndio ou risco de explosão quando suspenso no ar ou em um processo específico de oxidação médio em um range de concentração. O risco operacional surge porque o próprio transporte e movimentação desses sólidos podem gerar o acúmulo de eletricidade estática nas superfícies. Sem os devidos sistemas de equalização e aterramento, uma mínima faísca pode iniciar uma combustão catastrófica. Atmosfera Explosiva.',
  s5v2:
    'Vídeo. Pentágono de Explosão. O Pentágono de Explosão de Poeira. Assista ao vídeo sobre os cinco elementos do pentágono de explosão de poeiras em ambientes industriais. Avance quando concluir.',
  s5p:
    'Tabela do Pentágono de Explosão de Poeira. Esta página apresenta o conceito do Pentágono de Explosão, que descreve os cinco elementos físicos e químicos necessários para que ocorra uma explosão catastrófica envolvendo poeiras combustíveis suspensas no ar. No topo da tela, temos um aviso de segurança de extrema importância: Remover qualquer um dos elementos previne a explosão, mas não necessariamente o fogo. Abaixo desse aviso, vemos o diagrama gráfico do pentágono, contendo cinco lados de proteção que convergem ao centro, onde está escrito Explosão sobre o desenho de uma chama. Os cinco elementos indispensáveis para a ocorrência de uma explosão de poeira são: Primeiro, a Poeira Combustível, que atua como o combustível sólido particulado finamente dividido. Segundo, o Oxigênio no ar, que funciona como o comburente alimentando a combustão. Terceiro, a Ignição, que fornece a energia térmica necessária para dar início à reação química, como faíscas elétricas ou eletrostáticas. Estes três primeiros elementos formam o tradicional triângulo do fogo. Para que ocorra a explosão de poeira, contudo, são necessários dois elementos físicos adicionais: O quarto elemento é a Dispersão de Partículas, que cria uma nuvem de poeira suspensa no ar na concentração correta de inflamabilidade. O quinto elemento é o Confinamento de Poeiras, representando um ambiente fechado ou semi-fechado que impede a dissipação da pressão, gerando uma onda de choque destrutiva quando a queima rápida acontece. Lembre-se: em áreas industriais com risco de poeiras combustíveis, a nossa principal estratégia de segurança é romper este pentágono, eliminando as fontes de ignição, limpando o acúmulo de poeiras ou evitando o confinamento de misturas perigosas!',
  s5v3:
    'Vídeo. Reação das Substâncias. Particularidades de Reação das Substâncias. Assista ao vídeo sobre as características específicas de combustão e reação física de poeiras em áreas ATEX. Avance quando concluir.',
  s5v4:
    'Vídeo. Extintores Portáteis. Extintores Portáteis e o Combate em Áreas Classificadas. Assista ao vídeo sobre a correta utilização de extintores portáteis e técnicas de combate a incêndio em áreas classificadas. Avance quando concluir.',
  s5f:
    'Desafio do Módulo 5. Julgue as afirmações sobre poeiras e extintores. Quatro afirmações sobre o Pentágono de Explosão, energias mínimas de ignição e a escolha do agente extintor correto para a segurança em áreas classificadas. Responda Verdadeiro ou Falso para cada afirmação e conclua o desafio para validar o módulo.',
  's-mod6':
    'Módulo 6. Boas Práticas de Gestão ATEX e Regras de Ouro da NR-10. Neste módulo você aprenderá sobre a importância da gestão integrada, análise de riscos e as regras de segurança fundamentais da NR-10 em áreas ATEX.',
  s6v:
    'Vídeo. Boas Práticas e Regras de Ouro. Boas Práticas de Gestão ATEX e Regras de Ouro da NR-10. Assista ao vídeo sobre as boas práticas de gestão ATEX e regras de ouro para segurança na NR-10. Avance quando concluir.',
  s6v2:
    'Vídeo. Requisitos Legais. Requisitos Legais da NR-10 para ATEX. Assista ao vídeo sobre os requisitos legais mínimos da NR-10 para atmosferas explosivas. Avance quando concluir.',
  s6_legal_reqs:
    'Fundamentos. Requisitos Legais da NR-10. A NR-10 estabelece quesitos legais mínimos mandatórios para atmosferas explosivas. Os tópicos incluem: Análise de riscos formais elaborada e atualizada. Medidas de controle adotadas com base no estudo de classificação de área. Diagramas unifilares e aterramentos dos sistemas elétricos e protecionais. Equipamentos e materiais certificados para ATEX, mantidos em prontuário formal. Procedimentos formais estabelecidos para emissão de Permissão de Trabalho. Sinalização visual adequada para as áreas classificadas. Treinamento e capacitação específica para atuação na manutenção de áreas classificadas. E informação clara fornecida aos trabalhadores sobre os riscos envolvidos e as medidas de controle aplicadas. Revise todos esses quesitos legais obrigatórios.',
  s6v3:
    'Vídeo. Regras de Ouro. As 5 Regras de Ouro da NR-10. Assista ao vídeo sobre as 5 regras de ouro para segurança em instalações elétricas desenergizadas. Avance quando concluir.',
  s6_rules:
    'Fundamentos. As 5 Regras de Ouro. Conheça as cinco regras de ouro da NR-10 para garantir a segurança em instalações elétricas desenergizadas. Regra 1: Desligar as fontes de tensão, realizando o seccionamento do circuito. Regra 2: Impedir a reenergização por meio de bloqueios mecânicos e travamentos. Regra 3: Constatar a ausência de tensão com detectores adequados e calibrados. Regra 4: Aterrar o sistema elétrico e curto-circuitar as fases para proteção temporária. Regra 5: Sinalizar os bloqueios com etiquetas, placas e cartões de aviso.',
  s6v4:
    'Vídeo. Conclusão. Conclusão do Treinamento. Assista ao vídeo de encerramento com mensagem final e recomendações de segurança. Avance quando concluir.',
  s6f: null, // montado a partir da prova final Módulo 6
  s_end:
    'Treinamento Concluído! Parabéns, você finalizou com sucesso todas as etapas deste treinamento de NR-10 e Atmosferas Explosivas. Obrigado pela sua atenção e lembre-se sempre de priorizar a segurança integrada e os procedimentos corretos em todas as suas atividades industriais!',
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

function parseQm4Questions(html) {
  const match = html.match(/const\s+qm4_data\s*=\s*(\[[\s\S]*?\n\s*\]);/);
  if (!match) return [];
  try {
    return Function('"use strict"; return (' + match[1] + ');')();
  } catch {
    return [];
  }
}

function parseQm6Questions(html) {
  const match = html.match(/const\s+qm6_data\s*=\s*(\[[\s\S]*?\n\s*\]);/);
  if (!match) return [];
  try {
    return Function('"use strict"; return (' + match[1] + ');')();
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
      text = buildQuizNarration(parseQm4Questions(html), 4);
    } else if (text === null && id === 's6f') {
      text = buildQuizNarration(parseQm6Questions(html), 6);
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
