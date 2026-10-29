# Companion Lab — revisão v4

CIN0055 — Tendências em Mídia e Interação · CIn/UFPE.

Esta revisão parte do **v2 completo + patch Gemini recebido**. Conserva os cenários, os dois estilos, o consentimento, os questionários e a ordem aleatória. A interface continua mostrando somente A e B. O limite permanece em **quatro mensagens concluídas por rodada**, com encerramento permitido a partir de duas.

## Comece aqui no Windows

Você já instalou o Node.js. Não é necessário reinstalar nem executar `npm install`.

1. Pare o servidor antigo com **Ctrl+C**. Extraia este ZIP em uma pasta nova, para manter a versão anterior e seus dados como cópia de segurança.
2. Copie **somente o seu `.env` local** da versão anterior para a nova pasta `companion-lab`, ao lado de `server.mjs`. Não compartilhe esse arquivo. Não substitua sua chave pelo campo vazio de `.env.example`.
3. Abra o PowerShell nessa nova pasta e execute:

```powershell
node server.mjs
```

Abra **http://localhost:3000**. Recarregue uma página que já estivesse aberta para carregar a interface nova. O terminal deve informar o provedor/modelo ou que o MOCK está ativo. A indicação de modelo confirma a configuração; somente receber uma resposta confirma uma geração bem-sucedida.

A versão nova fornece todos os arquivos do projeto. Os arquivos com correções são `server.mjs`, `public/app.js`, `public/index.html`, `public/styles.css`, `export_csv.mjs`, `.env.example`, `README.md` e `PROJETO.md`. Há também `CORRECOES_E_TESTES.md` e a pasta `tests`. `REGISTRO.md`, `ROTEIRO_TESTE.md` e `.gitignore` foram conservados do v2. A pasta `data` vem vazia; mantenha dados antigos na pasta anterior.

## Teste curto com sua configuração Gemini

Use só o cenário fictício “Trabalho em grupo”, com um código de teste como `TESTE01`.

- Marque o consentimento e registre uma interpretação inicial.
- Na conversa A, envie: **Acho que ele não confia no meu trabalho.**
- Espere uma resposta completa. O contador deve passar de 0 para 1, e o campo deve ficar disponível para a próxima mensagem.

Se houver erro, o texto é preservado e aparece uma explicação na página. Não é necessário revelar a chave. Para relatar um problema, envie somente a mensagem de erro visível e diga em qual rodada/contador ocorreu.

Após esse primeiro teste, complete as duas rodadas: envie quatro mensagens em A, avalie, envie quatro em B, avalie e finalize. A quinta mensagem não deve ser aceita; a rodada B deve começar em 0/4, com o campo habilitado. Os dados desse ensaio são dados de teste: não os trate como respostas de participantes.

## Recuperação de falhas

- **Espera:** o servidor encerra a espera do provedor em 30 segundos. O navegador tem um prazo de 40 segundos para receber a resposta do servidor. A página informa que está aguardando.
- **Enquanto aguarda:** envio, edição e mudança de rodada ficam bloqueados para evitar concorrência.
- **Erro conhecido da API:** nada é acrescentado ao histórico nem ao contador. O texto fica no campo e o botão permite nova tentativa.
- **Conexão perdida ou timeout do navegador:** o campo fica temporariamente bloqueado com o texto preservado. Use **Tentar novamente** para recuperar o mesmo envio antes de editar ou mudar de rodada. Se o servidor já havia concluído, ele devolve a resposta guardada sem outra geração.
- **Cota (429):** aguarde antes de repetir. O responsável deve consultar a cota do projeto no AI Studio. Não há tentativas automáticas.
- **Permissão ou configuração:** confira o projeto/modelo localmente. Gerar uma nova chave não é uma solução automática para restrições do projeto.
- **Servidor reiniciado:** sessões em andamento deixam de existir na memória. Recarregue a página e comece uma nova sessão; não trate a sessão interrompida como concluída.

Cancelar a espera não garante que o provedor tenha deixado de processar a solicitação já enviada; ela ainda pode consumir cota. A proteção de repetição vale enquanto este processo do servidor estiver ativo.

O servidor não troca para MOCK após erro da API. Ao iniciar sem chave para o provedor selecionado, ele usa MOCK e informa isso explicitamente na página e no terminal. Confira sempre o modo antes de começar a coleta.

## Configuração opcional

A chave continua somente no `.env` do computador que hospeda o servidor. Exemplo sem segredo:

```dotenv
AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash
PORT=3000
# MOCK_MODE=1
# AI_TIMEOUT_MS=30000
# GEMINI_MAX_OUTPUT_TOKENS=2048
```

O orçamento de 2048 tokens inclui raciocínio e saída visível. É uma margem para evitar cortes, não uma meta de tamanho nem uma garantia de resposta completa. As instruções continuam pedindo normalmente duas a cinco frases. O raciocínio permanece em `low`; `includeThoughts: false` impede pedir a exposição do raciocínio, mas não desativa o raciocínio interno. `MAX_TOKENS`, bloqueios, ausência de texto e finais aparentemente cortados não são mostrados como respostas normais. A checagem de pontuação final é uma heurística: pode rejeitar uma resposta válida sem pontuação e não comprova completude semântica.

Os dois estilos usam o mesmo modelo e os mesmos parâmetros. Não mude a configuração no meio da coleta sem registrar uma nova iteração.

## Privacidade e dados

Use somente o cenário fictício. Não escreva nomes reais, dados pessoais, informações sensíveis nem conflitos pessoais. A participação é voluntária. Fechar a página interrompe a participação, mas não apaga o que já foi registrado.

Em Gemini, as mensagens e o cenário são enviados ao Google. A documentação da camada gratuita informa uso de conteúdo para melhorar produtos. Os registros locais contêm conversas, avaliações, código do participante e ordem experimental; códigos não garantem anonimato dos textos.

Os dados ficam em `data/session-events.jsonl`. Para exportar no PowerShell:

```powershell
node export_csv.mjs
```

O resultado é `data/session-events.csv`, em UTF-8 com marcador para facilitar a abertura no Excel. O CSV mantém `mode`, `provider` e `model`, inclusive ao associar registros antigos ao início de suas sessões. Não misture MOCK e LLM na análise. Filtre também sessões incompletas e eventos de tentativa/erro; conte trocas concluídas pelos pares `chat_user`/`chat_assistant` com o mesmo `requestId`.

`chat_attempt` registra uma tentativa sem copiar o texto; `chat_error` registra o tipo de falha. Só trocas concluídas gravam `chat_user` e `chat_assistant`. Uma nova tentativa usa o mesmo `requestId`, com número `attempt` crescente. Os registros antigos podem ter outro formato e mensagens sem resposta; não devem ser reinterpretados como trocas concluídas.

Não inclua `.env`, JSONL ou CSV em ZIPs compartilhados. O `.gitignore` só protege contra inclusões acidentais no Git, não remove arquivos de pacotes criados manualmente.

## Plano B: apenas usabilidade

Se a API falhar persistentemente, avise os participantes, pare o servidor com **Ctrl+C** e abra o `.env` local:

```powershell
notepad .env
```

Adicione uma única linha `MOCK_MODE=1`, salve e execute novamente `node server.mjs`. Peça que todos recarreguem a página e iniciem **novas sessões**. Confirme o aviso MOCK. As respostas serão pré-programadas: use esse teste somente para avaliar interface e questionários, sem conclusões sobre comportamento de uma LLM. Para voltar ao Gemini, remova ou comente essa linha e reinicie.

Se o acesso externo falhar, prefira demonstração local ou avaliação guiada. Só configure um túnel depois de completar o teste local. Uma URL temporária é acessível a qualquer pessoa que a conheça; limite sua circulação à turma e encerre o túnel após a atividade. Esta revisão não cria nem publica um túnel.

## Testes incluídos

No PowerShell, na pasta do projeto:

```powershell
node --check server.mjs
node --check public/app.js
node --test tests/server.test.mjs tests/interface.test.mjs
```

Os testes usam somente módulos nativos do Node, executam em pastas temporárias e não leem seu `.env` nem chamam provedores externos. Foram executados com Node v24.22.1. Os testes da interface usam um **DOM simulado**, sem renderização de navegador; não substituem a conferência visual no Windows. Veja `CORRECOES_E_TESTES.md`.

## Fontes oficiais consultadas

- Modelo: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash
- Parâmetros REST: https://ai.google.dev/api/generate-content
- Raciocínio e tokens: https://ai.google.dev/gemini-api/docs/generate-content/thinking
- Preços e uso do conteúdo: https://ai.google.dev/gemini-api/docs/pricing
- Cotas: https://ai.google.dev/gemini-api/docs/rate-limits
- Erros: https://ai.google.dev/gemini-api/docs/troubleshooting

O modelo e o nível `low` constam na documentação. O acesso e a cota efetiva do seu projeto não foram verificados por uma chamada real. Limites de requisições por minuto, tokens por minuto e requisições por dia são compartilhados pelo projeto e variam por modelo/conta; não é possível prometer um número de participantes simultâneos pela indicação “nível gratuito”. Consulte os limites ativos no Google AI Studio sem habilitar cobrança para este teste.

O estudo é exploratório com uma amostra pequena e autorrelatos; não demonstra efeitos psicológicos universais nem substitui orientações acadêmicas do professor.
