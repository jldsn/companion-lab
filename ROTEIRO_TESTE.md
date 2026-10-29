# Roteiro de aplicação — Companion Lab (29/10/2026)

## Objetivo de amanhã

Testar se o fluxo do protótipo é compreensível e observar, de forma exploratória, diferenças percebidas entre dois estilos relacionais de companheiro digital. Não é um estudo capaz de provar efeitos gerais, nem uma avaliação clínica. Se a aplicação estiver no modo MOCK, o teste será apenas de usabilidade do fluxo e das medidas — não da capacidade de uma LLM.

## Abertura sugerida (até 5 minutos)

> Estou testando um protótipo para a disciplina Tendências em Mídia e Interação. A ideia é explorar como diferentes formas de responder de um companheiro digital podem influenciar a leitura de uma situação ambígua. Vocês verão um cenário fictício, registrarão uma interpretação inicial e conversarão com duas versões identificadas apenas como A e B.
>
> Não há resposta certa, e não estou avaliando vocês. Participar é voluntário. A aplicação mostra um aviso sobre o tratamento dos dados e pede confirmação antes de começar. Não escrevam nomes reais, informações pessoais, nem relatem conflitos ou experiências íntimas. Se a opção Gemini estiver ativa, as mensagens serão enviadas à API do Google; na camada gratuita, o Google informa que pode usar o conteúdo para melhorar os produtos. As conversas e respostas abertas também ficam gravadas localmente no computador que hospeda o protótipo para eu avaliar o funcionamento do experimento. Vocês podem desistir fechando a página.
>
> Ao final, vou explicar a diferença que tentei criar entre os dois estilos e pedir feedback sobre a experiência. Por favor, não conversem entre si sobre as respostas enquanto estiverem usando o protótipo.

**Importante:** se o professor ou a disciplina tiverem orientações formais sobre consentimento ou coleta de dados, siga essas orientações. Não peça que alguém participe se não estiver confortável com o aviso.

## Uso independente (25 minutos)

- **Minutos 0–3:** acessar o link, ler o aviso, marcar consentimento, escolher um código não identificável (por exemplo, T01) e um cenário fictício.
- **Minutos 3–5:** registrar a interpretação inicial, a confiança e a clareza da situação.
- **Minutos 5–11:** conversar com o Companheiro A. Sugestão: fazer pelo menos duas trocas completas; usar no máximo quatro mensagens enviadas pelo participante.
- **Minutos 11–14:** avaliar a conversa e registrar a interpretação atual.
- **Minutos 14–20:** conversar com o Companheiro B seguindo o mesmo procedimento.
- **Minutos 20–23:** responder às mesmas avaliações depois da segunda conversa.
- **Minutos 23–25:** indicar preferência, qual conversa mais fez refletir e deixar um comentário final.

Os tempos são orientativos. Não pressione ninguém a terminar se estiver desconfortável; registre se o protótipo for longo ou confuso.

## Discussão coletiva (20 minutos)

Perguntas sugeridas, sem pressupor qual perfil foi preferível:

1. O que pareceu diferente entre as duas conversas? Dê exemplos do que o sistema disse, sem relatar situações pessoais.
2. Em qual conversa você se sentiu mais compreendido? E em qual reconsiderou mais a interpretação? Essas respostas coincidiram?
3. Alguma resposta pareceu exageradamente concordante, repetitiva, agressiva ou artificial?
4. Você sentiu que poderia discordar do companheiro ou que ele tentava conduzir sua leitura?
5. O que atrapalhou o uso da interface? Alguma pergunta ou escala ficou confusa?
6. O que você mudaria primeiro no protótipo e por quê?

Anote observações no `REGISTRO.md`, distinguindo falhas técnicas, dificuldades de uso, feedback e hipóteses interpretativas. Não transforme uma opinião isolada em conclusão geral.

## Plano B

- **API falhou, mas a página abriu:** o servidor não troca para MOCK automaticamente. Se o erro for persistente, pare o servidor com `Ctrl+C`, adicione `MOCK_MODE=1` ao `.env`, reinicie com `node server.mjs` e confirme no terminal que o MOCK está ativo. Avise a turma, peça que recarreguem a página e comecem uma nova sessão; as sessões anteriores em andamento serão perdidas. Consulte o passo a passo no `README.md`. Peça feedback apenas sobre interface, sequência e questionários; não use esses dados para afirmar algo sobre uma LLM real.
- **Túnel falhou:** faça uma demonstração no seu computador e conduza uma avaliação coletiva do fluxo. Não perca a aula tentando consertar infraestrutura.
- **Conectividade ou API intermitente:** encerre novas sessões, não peça que participantes repitam repetidamente toda a atividade e anote o problema técnico no registro. Não misture sessões LLM e MOCK como se fossem a mesma condição; o arquivo registra o modo na abertura de cada sessão.

## Debriefing no final

Explique que os dois estilos foram definidos para a investigação: um prioriza acolhimento e trabalha mais a partir da interpretação inicial; o outro procura pressupostos e interpretações alternativas. Diga que são estilos construídos por instruções, não personalidades naturais nem necessariamente representações completas de pessoas. Pergunte se alguém ficou desconfortável ou quer que seus dados de sessão identificáveis apenas por código não sejam usados; combine com o professor uma forma apropriada de excluir registros, se necessário.
