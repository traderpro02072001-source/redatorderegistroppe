# Redator PPE

Você escreve as anotações do seu jeito (pode errar o português). O sistema devolve o texto
formal e técnico, nos mesmos campos do Portal do Articulador, pronto para copiar e colar.

Modelos: **Relatório semanal**, **Registro territorial** e **Outro registro**.
Também importa as suas planilhas de rascunho `.xlsx`.

## Publicar (GitHub + Vercel)

1. Crie um repositório no GitHub (ex.: `ppe-redator`) e envie todos os arquivos desta pasta
   (`index.html`, `api/`, `manifest.json`, `sw.js`, ícones, `vercel.json`, `package.json`).
2. Na Vercel: **Add New > Project**, escolha o repositório e, em *Framework Preset*, deixe **Other**.
   Não precisa de comando de build.
3. (Recomendado) Em **Settings > Environment Variables**, cadastre `ACCESS_CODE` com uma senha sua.
   As chaves de IA você cadastra **dentro do site**, em **⚙️ Chaves de API** (nome + chave).
   Chaves grátis, sem cartão: console.groq.com/keys (Groq) e aistudio.google.com/apikey (Gemini).
   Elas ficam salvas só no seu navegador, são usadas na ordem da lista e, se uma atingir o limite, passa para a próxima.
   (Opcional: `GROQ_API_KEY`, `GEMINI_API_KEY` ou `ANTHROPIC_API_KEY` na Vercel valem como reserva do servidor.)
4. Se cadastrou as variáveis depois do deploy, faça um **Redeploy**.
5. Abra o site. Na primeira reescrita ele pede o código de acesso (fica salvo no seu navegador).

Os planos gratuitos têm limites diários, bem acima do uso de um articulador. Limites e modelos mudam; confira nos sites dos provedores.

## Instalar como programa no Windows

Abra o site no Chrome ou Edge e clique no ícone de instalar na barra de endereço
(ou menu > *Instalar Redator PPE*). Ele ganha ícone na área de trabalho e abre em janela própria,
como um .exe. Precisa de internet para reescrever.

## Privacidade

Os textos que você manda reescrever passam pelos provedores de IA que você configurou (planos gratuitos podem usar os dados para melhorar seus produtos). Os rascunhos ficam salvos
só no navegador do seu computador (localStorage). Evite colocar dados pessoais sensíveis
de terceiros (CPF, endereço, dados de saúde) nas anotações.
