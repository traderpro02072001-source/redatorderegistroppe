// Função serverless da Vercel: recebe as anotações informais e devolve o texto formal.
// Usa modelos com plano gratuito, em sequência: se um atingir o limite, passa para o próximo.
// Variáveis de ambiente (Vercel > Settings > Environment Variables). Cadastre pelo menos uma chave:
// As chaves podem ser cadastradas na própria tela (⚙️ Chaves de API) ou aqui, como reserva do servidor:
//   GROQ_API_KEY       (grátis: console.groq.com/keys)
//   GEMINI_API_KEY     (grátis: aistudio.google.com/apikey)
//   ANTHROPIC_API_KEY  (opcional, pago por uso)
//   ACCESS_CODE        (recomendada: senha para ninguém mais usar suas chaves)
//   PROVEDORES         (opcional, ordem de uso. Padrão: groq,gemini,anthropic)
//   GROQ_MODEL, GEMINI_MODEL, ANTHROPIC_MODEL (opcionais, para trocar de modelo)


const TITULOS = {
  semanal: 'Relatório Semanal',
  territorial: 'Registro Territorial',
  outro: 'Outro Registro',
};

// formato: "lista" = itens iniciados por "- ", um por linha | "prosa" = texto corrido | "frase" = frase curta
const CAMPOS = {
  semanal: {
    pendencias: {
      nome: 'Pendências anteriores',
      guia: 'Atividades, retornos ou encaminhamentos de semanas anteriores que ainda estão em aberto ou aguardando resolução.',
      formato: 'lista',
    },
    atividades: {
      nome: 'Principais atividades da semana',
      guia: 'Principais atividades realizadas durante a semana. Cada atividade vira um item iniciado por "Foi" / "Foram" (voz passiva).',
      formato: 'lista',
    },
    avancos: {
      nome: 'Avanços da semana',
      guia: 'O que avançou ou produziu algum resultado relevante. Itens iniciados por "Foi" / "Foram" quando forem ações concluídas.',
      formato: 'lista',
    },
    atencao: {
      nome: 'Pontos de atenção',
      guia: 'Dificuldades, situações ou pendências que precisam da atenção da equipe PPE.',
      formato: 'lista',
    },
    proximos: {
      nome: 'Próximos passos',
      guia: 'Atividades ou encaminhamentos da próxima semana. Use verbos no infinitivo (ex.: "Acompanhar...", "Participar...", "Aguardar...").',
      formato: 'lista',
    },
    extras: {
      nome: 'Extras',
      guia: 'Outras informações relevantes da semana: percepções, oportunidades ou acontecimentos importantes.',
      formato: 'prosa',
    },
  },
  territorial: {
    aconteceu: {
      nome: 'O que aconteceu?',
      guia: 'Descrição breve da atividade ou situação registrada e seu objetivo. Itens iniciados por "Foi" / "Foram" (voz passiva).',
      formato: 'lista',
    },
    envolvidos: {
      nome: 'Quem esteve envolvido?',
      guia: 'Pessoas, grupos, instituições ou parceiros. Escreva em uma única frase, com os envolvidos separados por ponto e vírgula, cargo antes do nome (ex.: "o prefeito municipal, Fulano de Tal; o secretário municipal de Agricultura, Beltrano; e o articulador local do PPE.").',
      formato: 'prosa',
    },
    informacoes: {
      nome: 'Principais informações',
      guia: 'Principais assuntos, informações, demandas ou decisões identificados durante a atividade. Itens iniciados por "Foi" / "Foram" (voz passiva) quando forem fatos ou decisões.',
      formato: 'lista',
    },
    atencao: {
      nome: 'Pontos de atenção',
      guia: 'Problema, dificuldade, oportunidade ou situação relevante que a equipe PPE precisa conhecer.',
      formato: 'lista',
    },
    proximos: {
      nome: 'Próximos passos',
      guia: 'O que precisa acontecer, quem ficou responsável, prazo ou retorno previsto. Use verbos no infinitivo (ex.: "Promover...", "Acompanhar...").',
      formato: 'lista',
    },
    extras: {
      nome: 'Extras',
      guia: 'Outras informações relevantes que não se encaixem nos tópicos anteriores.',
      formato: 'prosa',
    },
  },
  outro: {
    assunto: {
      nome: 'Assunto',
      guia: 'Descrição breve do que está sendo registrado. Uma única frase nominal, sem começar com "Foi" (ex.: "Reunião com a equipe técnica do CRAS sobre o programa X, no município Y").',
      formato: 'frase',
    },
    contexto: {
      nome: 'Contexto',
      guia: 'Informações necessárias para que a equipe PPE compreenda a situação. Texto corrido em voz passiva ("Foi realizada...", "Foi repassado ao articulador..."); se houver enumeração de assuntos tratados, pode listar com "- ".',
      formato: 'prosa',
    },
    proximos: {
      nome: 'Próximos passos',
      guia: 'O que precisa acontecer, quem ficou responsável, prazo ou retorno previsto. Use verbos no infinitivo.',
      formato: 'lista',
    },
    extras: {
      nome: 'Extras',
      guia: 'Outras informações que o articulador considerar importantes.',
      formato: 'prosa',
    },
  },
};

const SISTEMA = `Você é redator técnico e revisor de relatórios do PPE (Pacto pela Economia), programa em que articuladores locais registram, em municípios do Piauí, suas atividades junto a prefeituras, secretarias, associações, sindicatos e órgãos estaduais e federais.

Você recebe anotações informais do articulador, escritas com as próprias palavras dele, com erros de digitação, sem acentos, sem pontuação e sem maiúsculas. Sua tarefa NÃO é apenas corrigir o que ele escreveu: é REDIGIR o texto no padrão de um relatório institucional, formal, técnico e bem articulado, pronto para colar no Portal do Articulador, preservando integralmente os fatos.

REGRAS (em ordem de prioridade):

1. FIDELIDADE AOS FATOS. Os fatos (quem, o quê, quando, onde, quanto, resultado, situação "feito / em andamento / pendente / apenas combinado") não podem ser acrescentados, removidos ou alterados. Tudo o que não é fato (vocabulário, sintaxe, ordem das orações, conectivos, tratamento) deve ser totalmente reescrito.
2. REDAÇÃO FORMAL DE VERDADE. Reescreva cada item por inteiro, em vez de só ajustar o rascunho. O resultado deve ser claramente mais formal, claro e encorpado que o original: sujeito e complementos explícitos, artigos e preposições corretos (à, ao, junto à, no âmbito de, referente a), vocabulário institucional, orações bem encadeadas. Como a linguagem formal é mais explícita, o texto final costuma ser maior que o rascunho (uma linha informal normalmente vira uma ou duas linhas formais). Um resultado quase idêntico ao rascunho, mudando só ortografia e maiúsculas, é uma falha.
3. O QUE É PERMITIDO ACRESCENTAR (somente linguagem): conectivos e fórmulas formais ("tendo em vista", "no âmbito de", "referente a", "bem como", "a fim de", "o referido", "o mencionado"); termos institucionais equivalentes aos usados pelo articulador; cargos e siglas do GLOSSÁRIO; "o articulador local do PPE" quando o articulador for o agente; finalidade ("visando a", "com o objetivo de") SOMENTE quando as anotações já indicarem a finalidade (por exemplo com "para", "pra", "a fim de", "pra ver se").
4. O QUE É PROIBIDO: inventar finalidade, resultado, motivo, participante, local, data, valor ou consequência; elevar o grau do que ocorreu (conversa não vira reunião formal; "ficou de fazer" não vira "foi aprovado"; "pediu" não vira "foi concedido"; "tentou" não vira "conseguiu"; "disse que vai" não vira "foi decidido"); tornar certo o que está incerto; trocar o tipo de ato; omitir qualquer item ou dado das anotações; unir ou dividir itens de modo que se perca informação.
5. DÚVIDAS. Quando algo estiver ambíguo, ilegível ou parecer erro (nome que talvez esteja errado, número estranho, sigla desconhecida, frase sem sentido claro), mantenha o trecho o mais próximo possível do original e registre a dúvida em "avisos", citando o trecho. Nunca adivinhe. Sigla que não esteja no GLOSSÁRIO não deve ser expandida.
6. ORTOGRAFIA E NOMES. Corrija ortografia, acentuação, pontuação, concordância e maiúsculas. Nomes de pessoas: capitalize e acentue só quando for evidente; se não tiver certeza, mantenha e avise. Use as grafias e cargos do GLOSSÁRIO. Corrija também siglas digitadas errado quando o glossário permitir (por exemplo "atc" é ACT; "sei" é SEI).
7. TOM E VOZ. Formal, técnico, impessoal, em terceira pessoa. Prefira a voz passiva com "Foi" / "Foram" para ações realizadas, com concordância correta. O articulador aparece como "o articulador local do PPE" ou "o articulador" (nunca "eu", "nós" ou "a gente"). Cargos antes do nome, em minúsculas ("o prefeito municipal, Fulano"); para o prefeito, pode-se usar "o Exmo. Prefeito Municipal, Fulano". Na primeira ocorrência de uma sigla do glossário em cada campo, escreva o nome por extenso com a sigla entre parênteses ("Sistema Eletrônico de Informações (SEI)" ou "SEI (Sistema Eletrônico de Informações)"); nas seguintes, só a sigla.
8. EQUIVALÊNCIAS DE LINGUAGEM (preservando o grau do que ocorreu): "fui na / passei na / visitei" -> "Foi realizada visita à/ao..."; "conversei com" -> "Foi realizada conversa com..." ou "Foi estabelecido diálogo com..."; "reunião / reunimos" -> "Foi realizada reunião com..."; "pedi / solicitei" -> "Foi solicitado..."; "mandei / enviei" -> "Foi encaminhado..."; "recebi" -> "Foi recebido..."; "liberou / liberaram" -> "Foi liberado..."; "assinou" -> "Foi assinado..."; "me avisou / me falou / informou" -> "Foi informado ao articulador, por [quem], que..."; "ficou de" -> "Ficou acordado que..." ou "[quem] ficou responsável por..."; "vai acontecer / vai ter" -> "será realizado / ocorrerá"; "começou / comecei" -> "Foi dado início a..."; "terminei / acabei / concluí" -> "Foi concluído..."; "tá em andamento" -> "encontra-se em andamento"; "esperando / aguardando" -> "aguardo de..." ou "encontra-se pendente / aguardando..."; "ainda não" -> "ainda não foi..., encontrando-se pendente"; "falta / faltando" -> "encontra-se pendente..."; "ajudei" -> "Foi prestado apoio a..."; "acompanhei" -> "Foi acompanhado..."; "o pessoal do/da X" -> "a equipe do/da X"; "o prefeito" -> "o prefeito municipal"; "pra / pro" -> "para / para o".
9. ESTILO POR CAMPO (baseado nos relatórios reais do articulador):
   - Pendências anteriores: itens nominais ("Preenchimento do relatório de urbanidades;", "Identificação da Sala do Empreendedor;").
   - Principais atividades / O que aconteceu / Principais informações: "Foi/Foram + particípio" com complementos institucionais completos. Reuniões: "Foi realizada reunião com [quem], para tratar de [assunto]". Informações recebidas: "Foi informado pela/o X que...". Decisões: "Foi determinada / autorizada / definida ... pelo ...".
   - Avanços: substantivo de ação ("Conclusão do mapeamento...", "Recebimento do Termo de Parceria...", "Emissão de autorização...") ou "Foi registrado progresso em...", somente para o que o rascunho apresentar como avanço.
   - Próximos passos: verbo no infinitivo ("Acompanhar a liberação...", "Promover...", "Iniciar...") ou substantivo de ação ("Aguardo da liberação...", "Conclusão do preenchimento...").
   - Quem esteve envolvido: uma única frase, com os envolvidos separados por ponto e vírgula, cargo antes do nome, terminando com "e o articulador local do PPE." quando ele participou.
   - Assunto: uma frase nominal curta ("Reunião com a equipe técnica do CRAS sobre o programa X, no município Y").
   - Contexto: parágrafo em voz passiva ("Foi realizada uma reunião no ..., com ..., para tratar de ..."); quando houver assuntos enumerados, seguir com "Nesta reunião foram tratados os seguintes assuntos:" e uma lista com "- ".
   - Extras: parágrafo formal curto.
10. FORMATO. Campos do tipo "lista": um item por linha, cada linha iniciada por "- ". Todos os itens terminam com ponto e vírgula (;), exceto o último, que termina com ponto final (.). Se houver somente um assunto, escreva em texto corrido, sem "- ", terminado com ponto final. Campos do tipo "prosa": texto corrido (e lista com "- " apenas para enumerar assuntos tratados). Campos do tipo "frase": uma única frase curta.
11. Cada campo contém somente o que foi anotado para ele. Não mova informações entre campos nem repita informações entre campos. Se o campo já estiver formal e correto, melhore apenas o necessário.
12. Os EXEMPLOS e as REFERÊNCIAS mostram o nível de reescrita e o estilo esperados. Imite o estilo, nunca reaproveite os fatos deles.
13. PADRÃO DE ELABORAÇÃO (use com naturalidade, sem exagero). Fórmulas que dão corpo ao texto sem alterar os fatos: "encontrando-se o documento devidamente concluído" (somente quando algo foi concluído); "tendo sido ... recebido e assinado"; "a referida ação / o referido documento / a mencionada reunião"; "tem realização prevista para o dia X, no intervalo das 9h às 13h"; "nas dependências do/da"; "por meio de imagem de divulgação encaminhada via aplicativo de mensagens (WhatsApp)"; "destinado ao atendimento e à orientação sobre"; "junto à/ao"; "Exmo. Prefeito Municipal" para o prefeito; "devidamente" (apenas quando o ato realmente foi concluído). Quando um item trouxer mais de uma ideia, pode organizá-las em duas frases curtas no mesmo item, na ordem em que foram anotadas.
14. ARMADILHAS (já ocorreram e são erros graves): (a) inventar o significado de sigla que não está no GLOSSÁRIO (por exemplo, expandir SEPLAN ou EMATER por conta própria, ou chamar ACT/ATC de "Termo de Compromisso"); (b) classificar uma entidade de modo diferente do glossário (por exemplo, chamar a PLANTI de "empresa", quando é a Diretoria de Planejamento e Inteligência Territorial); (c) inserir verbos que mudam o fato (por exemplo, "restabelecido", "reaberto" ou "renovado" quando o rascunho diz apenas "liberado"); (d) presumir a categoria de uma pessoa ("servidora", "Sra.", "Dr.") quando o GLOSSÁRIO não informa: use o cargo do glossário ou apenas o nome; (e) afirmar sequência temporal ("ato contínuo", "posteriormente", "em seguida") que as anotações não declaram; (f) trocar o ato: se o rascunho diz "foi informado sobre o evento", mantenha o ato de informar (pode descrever o meio), não transforme em "foi recebido material".

RESPOSTA: chame a ferramenta "entregar_texto", com um texto para cada campo recebido e, em "avisos", no máximo 6 observações curtas (lista vazia se não houver dúvidas).`;

// Grafias corretas, cargos e siglas (edite à vontade). Entram no prompt.
const GLOSSARIO = [
  "Pessoas e cargos: Admaelton Bezerra (prefeito municipal de São José do Piauí); Manoel Nelson Borges (secretário municipal de Agricultura e Abastecimento); Jakson de Sousa Silva (secretário municipal de Assistência Social e Cidadania); Jaqueline de Moura Barbosa (agente administrativa e ponto focal); Mário Philipe Martins da Paz (assistente de apoio do setor de abastecimento); Josiel Manoel Mendes (secretário de finanças e administração do Sindicato dos Trabalhadores Rurais); Israel de Sousa Borges (presidente do Sindicato dos Trabalhadores); Agivan Moura Fé Luz (agente de desenvolvimento do BNB); Fernando Francisco de Moura (gerente de relacionamentos do BNB); Lucilândia de Sousa Bezerra (assistente de apoio ao agricultor); Peter Moura Rodrigues (articulador local do PPE)",
  "Instituições: BADESPI = Agência de Fomento e Desenvolvimento do Estado do Piauí S.A.; BNB = Banco do Nordeste do Brasil S.A.; CRAS = Centro de Referência da Assistência Social; PPE = Pacto pela Economia; SADA = Secretaria de Estado da Assistência Técnica e Defesa Agropecuária; CIET = Centro de Inteligência em Economia e Estratégias Territoriais; PLANTI = Diretoria de Planejamento e Inteligência Territorial; GRI = Gerência de Regiões Inteligentes",
  "Siglas: SEI = Sistema Eletrônico de Informações; ACT = Acordo de Cooperação Técnica (também chamado de Termo de Parceria); SIM = Serviço de Inspeção Municipal (Selo SIM); SINE = Sistema Nacional de Emprego (SINE-PI no Piauí); PEP = Plano Estratégico de Produção; CAF = Cadastro Nacional da Agricultura Familiar; DAP = Declaração de Aptidão ao Pronaf; CIB = Cadastro Imobiliário Brasileiro; SENAR = Serviço Nacional de Aprendizagem Rural; ATER = Assistência Técnica e Extensão Rural",
  "Siglas sem expansão conhecida (manter como estão, sem expandir): SEPLAN, EMATER, FAMEM, APPM, RFB, SINTER"
];

// Exemplos de "rascunho -> texto final" (cada um: {campo, rascunho, final}). Acrescente os seus: quanto mais, melhor o estilo.
const EXEMPLOS = [
  {
    "campo": "atividades",
    "rascunho": "- Concluido o relatorio de urbanidades da planti;\n- foi liberado o acesso a plataforma sei, o atc da badespi foi recebido e assinado pelo prefeito admaelton bezerra;\n- foi informado por imagem de divulgação enviado via whatsapp por jaqueline de moura barbosa sobre o evento da SADA para atendimento e orientações sobre linha de credito rural, que vai acontecer dia 12 de novembro de 2026 das 9h a 13h no auditorio da secretaria municipal de agricultura e abastecimento;",
    "final": "- Foi finalizada a elaboração do relatório de urbanidades da Diretoria de Planejamento e Inteligência Territorial (PLANTI), encontrando-se o documento devidamente concluído;\n- Foi liberado o acesso à plataforma do Sistema Eletrônico de Informações (SEI), tendo sido, igualmente, recebido e assinado, pelo Exmo. Prefeito Municipal, Admaelton Bezerra, o Acordo de Cooperação Técnica (ACT) da BADESPI;\n- Foi informado ao articulador, por meio de imagem de divulgação encaminhada via aplicativo de mensagens (WhatsApp) pela agente administrativa, Jaqueline de Moura Barbosa, sobre a realização de evento da Secretaria de Estado da Assistência Técnica e Defesa Agropecuária (SADA), destinado ao atendimento e à orientação sobre linha de crédito rural. A referida ação tem realização prevista para o dia 12 de novembro de 2026, no intervalo das 9h às 13h, nas dependências do auditório da Secretaria Municipal de Agricultura e Abastecimento."
  },
  {
    "campo": "avancos",
    "rascunho": "- concluido o relatorio de urbanidades;",
    "final": "- Conclusão do relatório de urbanidades."
  },
  {
    "campo": "proximos",
    "rascunho": "- acompanhar o evento da sada na secretaria municipal de agricultura e abastecieento para atendimento e orientacao para linha de credito rural;",
    "final": "- Acompanhar o evento da Secretaria de Estado da Assistência Técnica e Defesa Agropecuária (SADA), na Secretaria Municipal de Agricultura e Abastecimento, destinado ao atendimento e à orientação sobre linha de crédito rural."
  },
  {
    "campo": "envolvidos",
    "rascunho": "prefeito admaelton, secretario de agricultura manoel nelson, jaqueline e eu",
    "final": "O prefeito municipal, Admaelton Bezerra; o secretário municipal de Agricultura e Abastecimento, Manoel Nelson Borges; a agente administrativa, Jaqueline de Moura Barbosa; e o articulador local do PPE."
  },
  {
    "campo": "atividades (exemplo ilustrativo com fatos fictícios)",
    "rascunho": "fui na secretaria de agricultura conversar com o secretario sobre o arado, ele disse que ainda nao chegou o trator e que vai avisar quando chegar",
    "final": "Foi realizada visita à Secretaria Municipal de Agricultura e Abastecimento, com o objetivo de conversar com o secretário municipal sobre o arado. Foi informado pelo secretário que o trator ainda não havia chegado ao município e que o articulador seria comunicado quando da sua chegada."
  }
];

// Trechos reais de relatórios já enviados pelo articulador, como referência de tom e estrutura.
const REFERENCIAS = [
  {
    "campo": "Principais atividades da semana",
    "texto": "- Foi concluído o mapeamento das urbanidades do município de São José do Piauí, abrangendo o levantamento de pontos comerciais, prestadores de serviços, prédios institucionais, áreas de lazer e a classificação das vias públicas;\n- Foi dado início ao preenchimento do relatório técnico de urbanidades, atividade que se encontra em andamento;\n- Foi realizada uma reunião com o Exmo. Prefeito Municipal para discutir demandas, incluindo o SINE-PI, o Selo SIM (Serviço de Inspeção Municipal), a Sala do Empreendedor, a consolidação do banco de dados/lista de agricultores e os trâmites para a assinatura do Acordo de Cooperação Técnica (ACT) com a BADESPI;\n- Foi estabelecido contato da BADESPI com o Articulador com o objetivo de alinhar e agilizar a assinatura do referido Acordo de Cooperação Técnica (ACT);\n- Foi realizada uma reunião virtual de apresentação e alinhamento do Plano Estratégico de Produção 2026/2027, conduzida pelas equipes da SADA e SEPLAN. O ato contou com a participação do Secretário Municipal de Agricultura e Abastecimento, Sr. Manoel Nelson Borges, e da Agente Administrativa e ponto focal, Sra. Jaqueline de Moura Barbosa, visando planejar as próximas ações voltadas ao incremento da produtividade da agricultura familiar local."
  },
  {
    "campo": "Avanços da semana",
    "texto": "- Conclusão do mapeamento das urbanidades, abrangendo estabelecimentos comerciais, prestadores de serviços, prédios institucionais, além de áreas de lazer e convivência;\n- Elaboração em andamento do relatório de urbanidades;\n- Emissão de autorização para a reabertura da Sala do Empreendedor;\n- Recebimento do Termo de Parceria enviado pela Badespi para assinatura do município."
  },
  {
    "campo": "Próximos passos",
    "texto": "- Conclusão do preenchimento do Relatório de Urbanidades;\n- Continuidade às ações de reabertura, funcionamento e identificação da Sala do Empreendedor no município;\n- Início da produção do banco de dados e da lista de agricultores de São José do Piauí pela Secretaria de Agricultura;\n- Aguardo da liberação de acesso para usuários externos na plataforma SEI para assinar o ATC com a BADESPI."
  },
  {
    "campo": "Principais informações",
    "texto": "- Foi determinada pelo Prefeito Municipal a prorrogação do prazo para a implantação do Serviço de Inspeção Municipal (SIM), tendo em vista a indisponibilidade orçamentária momentânea para o custeio das adequações às exigências legais do selo;\n- Foi autorizada a continuidade dos procedimentos administrativos necessários para a reabertura da Sala do Empreendedor do município;\n- Foram traçadas estratégias, em conjunto com o Gestor Municipal e o Secretário Municipal de Agricultura e Abastecimento, visando à criação de um banco de dados ou lista dos agricultores locais para informar o Plano Estratégico de Produção (PEP);\n- Foi formalizada a solicitação para assinatura do Termo de Parceria com a BADESPI. A agente administrativa Jaqueline de Moura Barbosa realizou o cadastro no SEI e a liberação do acesso para usuário externo está em andamento para a posterior assinatura e consolidação do Acordo de Cooperação Técnica (ACT);\n- Foi comunicado pelo Gestor Municipal ao articulador que o município, no momento, não dispõe de uma unidade do Sistema Nacional de Emprego do Piauí (SINE-PI)."
  },
  {
    "campo": "Contexto (outro registro)",
    "texto": "Foi realizada uma reunião no prédio público onde está instalado o Centro de Referencia da Assistencia Social - CRAS de São José do Piauí, com a equipe técnica que compunha o corpo de profissionais da Secretaria Municipal de Assistência Social e Cidadania, para tratar do Auxílio Alimentação, programa este que veio decorrente do Decreto 24.692/2026 de emergência pela seca, emitido pelo Estado. O Articulador Local do PPE esteve presente para acompanhamento e registro. Nesta reunião foi conversado sobre:\n- Decreto 24.692/2026, emergência pela seca;\n- Cronograma e organização da realização das visitas, preenchimento do formulário e alimentação do sistema com os dados coletados;\n- Critérios para se enquadrar no programa;\n- Estratégias para seleção das famílias beneficiárias;\n- Divisão de tarefas entre a equipe."
  },
  {
    "campo": "Principais informações",
    "texto": "- Apresentação de projetos diversificados, direcionados aos diferentes perfis de agricultores com Cadastro Nacional da Agricultura Familiar (CAF);\n- Fortalecimento do relacionamento institucional e estreitamento de laços entre a instituição financeira e a Secretaria Municipal de Agricultura e Abastecimento;\n- Prospecção de novos clientes de forma conjunta com a secretaria, com o intuito de viabilizar novos projetos em parceria com o BNB;\n- Desenvolvimento de estratégias conjuntas para impulsionar a agricultura familiar local, assegurando o alinhamento das ações com as diretrizes do Pacto pela Economia (PPE)."
  }
];

function montarSistema() {
  let s = SISTEMA.replace(/RESPOSTA:[\s\S]*$/, 'RESPOSTA: responda SOMENTE com um objeto JSON válido, sem markdown e sem nenhum texto fora dele, no formato {"campos":{"<chave>":"<texto formal>"},"avisos":["..."]}, com uma chave para cada campo recebido. Em "avisos", no máximo 6 observações curtas (lista vazia se não houver dúvidas).');
  s += '\n\nGLOSSÁRIO (use exatamente estas grafias, cargos e expansões):\n- ' + GLOSSARIO.join('\n- ');
  if (EXEMPLOS.length) {
    s += '\n\nEXEMPLOS DE REESCRITA (rascunho -> texto final):';
    for (const e of EXEMPLOS) s += `\n[${e.campo}]\nRascunho: ${e.rascunho}\nFinal: ${e.final}\n`;
  }
  if (REFERENCIAS.length) {
    s += '\n\nREFERÊNCIAS DE ESTILO (textos finais reais do articulador; imite o tom e a estrutura, nunca reaproveite os fatos):';
    for (const r of REFERENCIAS) s += `\n[${r.campo}]\n${r.texto}\n`;
  }
  return s;
}

function limpar(texto) {
  return String(texto || '').replace(/\r\n/g, '\n').trim();
}

function lerJson(texto) {
  const t = String(texto || '').replace(/```json|```/g, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { return null; }
}

async function postar(url, headers, corpo) {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(corpo) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText || ''}: ` + String((d.error && (d.error.message || d.error)) || JSON.stringify(d)).slice(0, 400));
  return d;
}

const PREF_GROQ = [/llama-3\.3-70b/, /gpt-oss-120b/, /llama-4/, /qwen/, /kimi/, /gpt-oss-20b/, /llama-3\.1-70b/, /llama-3\.1-8b/, /gemma/];
const EXCLUI = /whisper|tts|guard|embed|orpheus|playai|safeguard|compound|moderation|image|vision|transcri|audio|live/i;
// Escolhe o melhor modelo de texto entre os que a conta realmente possui.
function escolherModelo(provedor, ids) {
  ids = ids.filter((i) => !EXCLUI.test(i));
  if (provedor === 'groq') {
    for (const re of PREF_GROQ) { const m = ids.find((i) => re.test(i)); if (m) return m; }
    return ids[0] || null;
  }
  if (provedor === 'gemini') {
    const v = (i) => { const m = i.match(/gemini-(\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : 0; };
    const flash = ids.filter((i) => /flash/.test(i));
    const estaveis = flash.filter((i) => !/lite|exp|thinking|preview|latest/.test(i)).sort((a, b) => v(b) - v(a));
    return estaveis[0] || flash.sort((a, b) => v(b) - v(a))[0] || ids[0] || null;
  }
  if (provedor === 'anthropic') return ids.find((i) => /sonnet/.test(i)) || ids[0] || null;
  return null;
}

async function obter(url, headers) {
  const r = await fetch(url, { headers });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText || ''}: ` + JSON.stringify(d).slice(0, 300));
  return d;
}

// Tenta o modelo padrão (ou o escolhido pelo usuário). Se a conta não o tiver (HTTP 400/404), lista os modelos e usa o melhor.
async function usar(item, prov, padrao, enviar, listar, extrair) {
  const inicial = item.modelo || padrao;
  try {
    item.usado = inicial;
    return extrair(await enviar(inicial));
  } catch (e) {
    if (item.modelo || !/HTTP (400|404)/.test(e.message)) throw e;
    let ids;
    try { ids = await listar(); } catch (e2) { throw new Error(e.message + ' | falha ao listar modelos: ' + e2.message); }
    const novo = escolherModelo(prov, ids);
    if (!novo || novo === inicial) throw new Error(e.message + ' | modelos disponíveis: ' + ids.slice(0, 15).join(', '));
    item.usado = novo;
    return extrair(await enviar(novo));
  }
}

const PROVEDORES = {
  groq: {
    chave: 'GROQ_API_KEY',
    chamar: (sistema, msg, chave, item) => usar(item, 'groq', process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      (modelo) => postar('https://api.groq.com/openai/v1/chat/completions', { authorization: 'Bearer ' + chave },
        { model: modelo, temperature: 0.3, max_tokens: 4096, response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: sistema }, { role: 'user', content: msg }] }),
      async () => (await obter('https://api.groq.com/openai/v1/models', { authorization: 'Bearer ' + chave })).data.map((x) => x.id),
      (d) => d.choices[0].message.content),
  },
  gemini: {
    chave: 'GEMINI_API_KEY',
    chamar: (sistema, msg, chave, item) => usar(item, 'gemini', process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      (modelo) => postar(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, { 'x-goog-api-key': chave },
        { systemInstruction: { parts: [{ text: sistema }] }, contents: [{ role: 'user', parts: [{ text: msg }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' } }),
      async () => (await obter('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { 'x-goog-api-key': chave }))
        .models.filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m) => m.name.replace('models/', '')),
      (d) => d.candidates[0].content.parts.map((p) => p.text || '').join('')),
  },
  anthropic: {
    chave: 'ANTHROPIC_API_KEY',
    chamar: (sistema, msg, chave, item) => usar(item, 'anthropic', process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      (modelo) => postar('https://api.anthropic.com/v1/messages', { 'x-api-key': chave, 'anthropic-version': '2023-06-01' },
        { model: modelo, max_tokens: 4096, system: sistema, messages: [{ role: 'user', content: msg }] }),
      async () => (await obter('https://api.anthropic.com/v1/models', { 'x-api-key': chave, 'anthropic-version': '2023-06-01' })).data.map((x) => x.id),
      (d) => d.content.filter((b) => b.type === 'text').map((b) => b.text).join('')),
  },
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  const codigo = process.env.ACCESS_CODE;
  if (codigo && req.headers['x-access-code'] !== codigo) {
    return res.status(401).json({ erro: 'Código de acesso inválido.' });
  }

  const corpo = req.body || {};

  // Fila de chaves: primeiro as cadastradas na tela (⚙️), depois as variáveis de ambiente do servidor.
  const fila = [];
  for (const c of Array.isArray(corpo.chaves) ? corpo.chaves.slice(0, 10) : []) {
    const chave = String(c && c.chave || '').trim();
    if (!c || c.ativa === false || !PROVEDORES[c.provedor] || chave.length < 10 || chave.length > 400 || /\s/.test(chave)) continue;
    fila.push({ nome: limpar(c.nome).slice(0, 60) || c.provedor, provedor: c.provedor, chave, modelo: /^[\w.\-\/:]{1,80}$/.test(c.modelo || '') ? c.modelo : '' });
  }
  const doCliente = fila.length;
  for (const p of (process.env.PROVEDORES || 'groq,gemini,anthropic').split(',').map((x) => x.trim())) {
    if (PROVEDORES[p] && process.env[PROVEDORES[p].chave]) fila.push({ nome: 'servidor ' + p, provedor: p, chave: process.env[PROVEDORES[p].chave] });
  }
  if (!fila.length) {
    return res.status(400).json({ erro: 'Nenhuma chave de IA disponível. Cadastre uma em ⚙️ Chaves de API.' });
  }

  if (corpo.teste) {
    const item = fila[0];
    if (!doCliente) return res.status(400).json({ erro: 'Chave inválida.' });
    try {
      await PROVEDORES[item.provedor].chamar('Responda somente com o JSON {"ok":true}.', 'teste', item.chave, item);
      return res.status(200).json({ ok: true, modelo: item.usado });
    } catch (e) {
      return res.status(502).json({ erro: String(e.message).split(item.chave).join('***') });
    }
  }
  const tipo = corpo.tipo;
  const guias = CAMPOS[tipo];
  if (!guias) return res.status(400).json({ erro: 'Tipo de registro inválido.' });

  const campos = {};
  for (const k of Object.keys(guias)) {
    const v = limpar(corpo.campos && corpo.campos[k]);
    if (v) campos[k] = v.slice(0, 12000);
  }
  const chaves = Object.keys(campos);
  if (!chaves.length) return res.status(200).json({ campos: {}, avisos: [] });

  const municipio = limpar(corpo.municipio).slice(0, 80);

  let mensagem = `Tipo de registro: ${TITULOS[tipo]}\n`;
  if (municipio) mensagem += `Município: ${municipio}\n`;
  mensagem += '\nReescreva cada campo abaixo seguindo as regras.\n';
  for (const k of chaves) {
    const g = guias[k];
    mensagem += `\n=== Campo "${k}" — ${g.nome} ===\nOrientação do campo: ${g.guia}\nFormato: ${g.formato}\nAnotações do articulador:\n"""\n${campos[k]}\n"""\n`;
  }

  const sistema = montarSistema();

  const erros = [];
  for (const item of fila) {
    try {
      const texto = await PROVEDORES[item.provedor].chamar(sistema, mensagem, item.chave, item);
      const obj = lerJson(texto);
      if (!obj || typeof obj.campos !== 'object' || obj.campos === null) throw new Error('resposta fora do formato');
      const saida = {};
      for (const k of chaves) saida[k] = limpar(obj.campos[k]);
      const avisos = Array.isArray(obj.avisos) ? obj.avisos.map(limpar).filter(Boolean).slice(0, 6) : [];
      return res.status(200).json({ campos: saida, avisos, motor: `${item.nome} (${item.usado || ''})` });
    } catch (e) {
      erros.push(`${item.nome}: ` + String(e.message).split(item.chave).join('***'));
    }
  }
  return res.status(502).json({ erro: 'Todos os provedores falharam. ' + erros.join(' | ') });
};
