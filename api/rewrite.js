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

const SISTEMA = `Você é um revisor e redator técnico de relatórios do PPE (Pacto pela Economia), programa em que articuladores locais registram, em municípios do Piauí, suas atividades junto a prefeituras, secretarias, associações, sindicatos e órgãos estaduais e federais.

Você recebe anotações informais do articulador, escritas com as próprias palavras dele, possivelmente com erros de digitação, sem acentos, sem pontuação e sem letras maiúsculas. Sua tarefa é reescrevê-las em linguagem formal, técnica e impessoal, pronta para colar no relatório oficial.

REGRAS (em ordem de prioridade):

1. FIDELIDADE ABSOLUTA AO SENTIDO. Não acrescente, não remova e não altere nenhum fato, nome, cargo, número, quantidade, data, local, sigla, valor, decisão ou relação de causa e efeito. Não deduza nada que não esteja escrito. Não suavize nem reforce o que foi dito. Não explique siglas que o articulador não explicou. Se o articulador explicou algo (ex.: o que significa uma sigla), mantenha a explicação.
2. DÚVIDAS. Quando algo estiver ambíguo, ilegível ou parecer erro (nome que pode estar grafado errado, número estranho, frase sem sentido claro), mantenha o trecho o mais próximo possível do original e registre a dúvida em "avisos", citando o trecho. Nunca "adivinhe" para resolver a dúvida.
3. CORREÇÃO FORMAL. Corrija ortografia, acentuação, pontuação, concordância e uso de maiúsculas (inclusive nomes próprios de pessoas, municípios, instituições e siglas, como BADESPI, SEI, SINE-PI, CRAS, PPE). Nomes de pessoas: apenas capitalize e acentue quando for evidente; se não tiver certeza da grafia, mantenha e avise.
4. TOM. Formal, técnico, impessoal, em terceira pessoa. Prefira a voz passiva com "Foi" / "Foram" para ações realizadas ("Foi realizada visita técnica à Secretaria...", "Foram discutidas as diretrizes..."), com concordância correta. O próprio articulador deve aparecer como "o articulador local do PPE" ou "o articulador" (nunca "eu" ou "nós"). Cargos em minúsculas quando precedem o nome ("o prefeito municipal, Fulano").
5. SEM ENFEITE. Não use linguagem rebuscada, não crie introduções, conclusões, avaliações ou comentários. Mantenha o tamanho próximo ao do original, apenas organizado e corrigido.
6. FORMATO por campo (cada campo informa o seu):
   - "lista": um item por linha, cada linha iniciada por "- ". Todos os itens terminam com ponto e vírgula (;), exceto o último, que termina com ponto final (.). Se houver somente um assunto, escreva-o em texto corrido, sem "- ", terminado com ponto final.
   - "prosa": texto corrido, em um ou mais parágrafos, sem marcadores (salvo enumeração clara do que foi tratado, que pode usar "- ").
   - "frase": uma única frase curta, sem ponto final obrigatório.
7. Cada campo deve conter somente o que foi anotado para ele. Não mova informações de um campo para outro, não repita informações entre campos.
8. Se as anotações de um campo já estiverem em tom formal e corretas, apenas ajuste o que for necessário.
9. Responda SEMPRE chamando a ferramenta "entregar_texto", com um texto para cada campo recebido e, em "avisos", no máximo 6 observações curtas (vazio se não houver dúvidas).`;


// Grafias corretas de nomes e siglas (edite à vontade). Entram no prompt.
const GLOSSARIO = [
  'Admaelton Bezerra (prefeito municipal de São José do Piauí)',
  'Manoel Nelson Borges (secretário municipal de Agricultura e Abastecimento)',
  'Jakson de Sousa Silva (secretário municipal de Assistência Social e Cidadania)',
  'Jaqueline de Moura Barbosa (agente administrativa)',
  'Mário Philipe Martins da Paz (assistente de apoio do setor de abastecimento)',
  'Josiel Manoel Mendes (secretário de finanças e administração do Sindicato dos Trabalhadores Rurais)',
  'Siglas: PPE, BADESPI, SEI, ACT, SIM, SINE-PI, CRAS, PEP, SINTER, CAF, DAP, BNB, EMATER, PLANTI, SEPLAN, CIET, FAMEM, APPM, RFB, CIB',
];

// Exemplos de "rascunho -> texto final" (cada um: {campo, rascunho, final}). Quanto mais, melhor o estilo.
const EXEMPLOS = [];

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
        { model: modelo, temperature: 0.2, max_tokens: 4096, response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: sistema }, { role: 'user', content: msg }] }),
      async () => (await obter('https://api.groq.com/openai/v1/models', { authorization: 'Bearer ' + chave })).data.map((x) => x.id),
      (d) => d.choices[0].message.content),
  },
  gemini: {
    chave: 'GEMINI_API_KEY',
    chamar: (sistema, msg, chave, item) => usar(item, 'gemini', process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      (modelo) => postar(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, { 'x-goog-api-key': chave },
        { systemInstruction: { parts: [{ text: sistema }] }, contents: [{ role: 'user', parts: [{ text: msg }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } }),
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

  let sistema = SISTEMA.replace(/9\. Responda SEMPRE[\s\S]*$/, '9. Responda SOMENTE com um objeto JSON válido, sem markdown e sem nenhum texto fora dele, no formato {"campos":{"<chave>":"<texto formal>"},"avisos":["..."]}, com uma chave para cada campo recebido. Em "avisos", no máximo 6 observações curtas (lista vazia se não houver dúvidas).');
  sistema += '\n\nGRAFIAS CORRETAS (use exatamente assim quando esses nomes aparecerem):\n- ' + GLOSSARIO.join('\n- ');
  if (EXEMPLOS.length) {
    sistema += '\n\nEXEMPLOS DO ESTILO DESEJADO (rascunho -> texto final):';
    for (const e of EXEMPLOS) sistema += `\n[${e.campo}]\nRascunho: ${e.rascunho}\nFinal: ${e.final}\n`;
  }

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
