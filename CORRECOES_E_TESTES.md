# Diagnóstico, correções e validação — revisão v4

Preparado em 28/10/2026, para a atividade de 29/10/2026.

## Materiais realmente recebidos

- ZIP `companion-lab-mvp-revisado-v2.zip`: projeto completo, incluindo `public`.
- ZIP `companion-lab-patch-gemini.zip`: somente `server.mjs`.
- Arquivos avulsos da primeira mensagem e relato `Pasted text.txt`.
- O ZIP v3 não foi recebido. Não se afirma que esta revisão tenha sido comparada a um v3 completo.
- O `.env` anexado não foi aberto, executado, copiado para o projeto nem incluído na entrega.

Os dois ZIPs de entrada passaram na verificação de integridade. O patch e o `server.mjs` avulso são idênticos em bytes: SHA-256 `a60e52f4e3c3f15de2436b6a9b3ce534f9705bb68d0192e25f29e5942560aa3f`.

## Diferença exata entre v2 e patch

O patch altera somente a chamada ao Gemini em `server.mjs`:

| Item | v2 | Patch |
| --- | --- | --- |
| `maxOutputTokens` | 260 | 600 |
| `temperature` | 0.7 | Removido |
| `thinkingConfig.thinkingLevel` | Ausente | `low` |
| Final `MAX_TOKENS` | Não tratado | Gera erro e não exibe o texto parcial |
| Texto vazio | Erro genérico | Erro com motivo de finalização |

O patch não contém `public/app.js` ou `public/index.html`: aplicado sobre o v2, mantém integralmente a interface do v2, inclusive os problemas de recuperação.

## Fatos e causas ainda não confirmadas

Fatos verificados no original:

- `maxMessages: 4`; `maxlength="2500"`. Não há um limite de caracteres que explique o corte daquela frase curta.
- O contador avança apenas após sucesso.
- O campo é apagado antes da chamada, sem restauração no erro.
- O balão do participante é inserido antes do sucesso, deixando uma mensagem sem resposta na falha.
- Não há timeout definido no navegador ou na chamada ao provedor.
- Não há trava lógica explícita contra um novo envio concorrente, além do botão desabilitado.
- Depois de duas trocas, o botão de encerramento continua habilitado enquanto uma nova resposta está pendente. Como o retorno usa `state.round`, uma mudança de rodada nesse intervalo pode afetar o estado errado.
- O servidor registra `chat_user` antes de saber se haverá resposta, não controla o limite de quatro e aceita solicitações duplicadas.
- O exportador antigo não preserva as colunas `mode`, `provider` e `model`, embora elas existam em `session_start` no JSONL.
- `PROJETO.md` menciona seis mensagens; o roteiro e a interface indicam quatro.

Reproduções executadas com o JavaScript original em DOM simulado, conectado ao servidor original com provedor simulado:

1. Erro 429: o texto desaparece do campo, fica um balão sem resposta e o contador não avança.
2. Depois de dois sucessos, o encerramento leva à avaliação enquanto a terceira resposta ainda está pendente.

**Não foi confirmada a causa histórica do bloqueio no computador do usuário.** Não houve acesso ao processo em execução, à solicitação problemática nem à resposta real do Gemini. Latência, erro de cota, corte por tokens e configuração são hipóteses distinguíveis pelos novos erros e pela recuperação. A frase curta, isoladamente, não permite escolher uma delas.

## Correções implementadas

### Interface

- Texto mantido até uma resposta completa; nenhuma mensagem é adicionada ao histórico visível antes do sucesso.
- Trava de envio em andamento e bloqueio da mudança de rodada enquanto se aguarda.
- Captura da rodada de origem, sem depender do estado que poderia mudar durante a chamada.
- Prazo padrão de 40 segundos no navegador, com erro visível e recuperação.
- Reutilização do identificador do envio. Se a conexão falhar depois do sucesso no servidor, a repetição recupera a resposta já guardada.
- Enquanto o resultado for incerto, texto e rodada ficam protegidos até recuperar o mesmo envio. Em uma falha conhecida da API, é possível editar o texto e tentar novamente.
- Contador sincronizado com o número de trocas concluídas no servidor.
- Questionários com tratamento de erro e trava contra cliques repetidos; avaliações da segunda rodada voltam ao valor inicial 4, sem carregar escalas da primeira.
- Aviso de origem LLM/MOCK no chat. Consentimento, privacidade e perguntas conservados.

### Servidor

- Prazo padrão de 30 segundos para receber e ler a resposta do provedor, com cancelamento da espera.
- Erros distintos de cota, acesso, modelo, configuração, rede, indisponibilidade, corte e bloqueio.
- Nenhuma repetição automática de geração e nenhuma mudança de modo por falha da API.
- Quatro trocas por rodada, histórico mantido no servidor, trava de concorrência e cache por `requestId`.
- Tentativas e erros separados das trocas concluídas; repetição não cria outro par de mensagens concluídas.
- Proveniência em todos os eventos novos e na resposta do chat. Exportação com origem também para eventos antigos associados a `session_start`.
- Respostas Gemini aceitas somente com final `STOP`, sem bloqueio, com texto visível e pontuação final plausível. Partes marcadas como raciocínio não são exibidas.
- Orçamento de saída padrão de 2048, mesmo para os dois perfis, com nível `low`. Aumento dá margem para o raciocínio, mas não garante completude ou rapidez. A heurística de pontuação pode rejeitar textos válidos sem pontuação e não avalia a correção semântica.
- Erros brutos do provedor e credenciais não são enviados à interface ou aos logs compartilhados.

### Desenho experimental

Quatro mensagens por condição foi a decisão explícita: coincide com o roteiro e a interface anteriores. A menção a seis no projeto foi corrigida. Cenários, instruções relacionais, ordem aleatória, rótulos A/B, consentimento e medidas foram preservados. A revisão não acrescenta condições experimentais.

## O que foi executado

Ambiente: Node **v24.22.1**, em ambiente de execução Linux. Não foi necessário instalar dependências do projeto. O computador do usuário usa Windows e uma versão diferente do Node; não se afirma que os testes tenham sido executados nesse computador.

Comandos:

```powershell
node --check server.mjs
node --check public/app.js
node --check export_csv.mjs
node --test tests/server.test.mjs tests/interface.test.mjs
```

Resultado: verificações de sintaxe aprovadas e **7 testes automatizados aprovados**, sem falhas.

| Teste | Cobertura |
| --- | --- |
| Servidor, Gemini simulado | Consentimento, sessão, quatro trocas em cada rodada, histórico separado, limite da quinta, cache da resposta, eventos, finalização e CSV |
| Servidor, falhas simuladas | 400/401/403/404/429/503, timeout, `MAX_TOKENS`, bloqueio de segurança, resposta vazia/cortada, recuperação e concorrência |
| Servidor, MOCK | Identificação explícita do modo e nenhuma chamada ao provedor |
| Interface, MOCK | Fluxo inteiro: consentimento, questionário inicial, 4 + 4 trocas, duas avaliações, comparação e conclusão |
| Interface, Gemini simulado | Mesmo fluxo completo e recuperação da finalização cuja resposta se perdeu |
| Interface, falhas | Texto preservado, contador e histórico sem avanço indevido, nova tentativa, nenhuma mudança de rodada durante envio |
| Interface, resposta perdida | Desconexão depois do sucesso no servidor, timeout do cliente e recuperação sem segunda geração ou mensagem duplicada |

Os testes da interface executam **o arquivo `public/app.js` real**, com elementos derivados do `index.html` real, em um DOM simulado. O servidor e as chamadas HTTP locais são reais; o provedor externo é substituído por um simulador. Nos testes, o prazo do provedor foi reduzido para 250 ms para verificar o mesmo mecanismo sem esperar 30 segundos a cada falha. Os simuladores são ferramentas de teste: não são um modo adicional do aplicativo e não foram usados para produzir dados de participantes.

## Limitações da validação

- **Nenhuma chamada real ao Gemini foi executada.** Não foram verificados acesso da conta, cota, latência real, naturalidade, aderência aos estilos ou frequência real de cortes.
- A instalação do navegador local de testes não foi concluída. O navegador disponível também bloqueou a abertura do endereço local por política do ambiente. Não foi feita validação visual em navegador real, digitação nativa, acessibilidade ou compatibilidade Windows.
- Não foram realizados ensaio de carga, teste com participantes nem teste de túnel público.
- As sessões e o cache ficam na memória do processo. Reiniciar o servidor interrompe sessões e elimina a capacidade de recuperar respostas dessas sessões.
- Um timeout cancela a espera local; não garante que a solicitação já enviada ao provedor não consuma cota.
- A fonte documental confirma modelo e parâmetros, mas não substitui uma geração com a configuração da conta do usuário.

O teste curto de geração no Windows está no README. Se falhar, a nova mensagem de erro ajuda a distinguir permissão, cota, indisponibilidade, timeout e corte sem expor a chave. Use o MOCK somente para usabilidade e mantenha esses dados separados dos dados LLM.

## Conferência da entrega

O ZIP deve conter uma única pasta raiz `companion-lab`, com `server.mjs`, `public`, documentação, exportador e testes. A pasta `data` deve estar vazia. Não devem existir `.env`, JSONL, CSV, logs, dependências instaladas ou dados pessoais no pacote. A verificação de integridade, estrutura e ausência desses arquivos foi executada após a criação do ZIP; os testes também foram executados a partir de uma cópia extraída da entrega.

## Documentação oficial consultada

- https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash
- https://ai.google.dev/api/generate-content
- https://ai.google.dev/gemini-api/docs/generate-content/thinking
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/rate-limits
- https://ai.google.dev/gemini-api/docs/troubleshooting

`gemini-3.8-flash` é um identificador documentado, com nível `low` suportado. A API REST documenta `generationConfig.thinkingConfig.thinkingLevel`. Tokens de raciocínio e saída compartilham o limite da geração. A tabela de preços lista entrada/saída gratuitas na camada gratuita e uso do conteúdo para melhoria de produtos; disponibilidade e cotas dependem do projeto. Erros de acesso podem aparecer como 403, de cota como 429 e de indisponibilidade como 503. Os limites ativos devem ser consultados no AI Studio; não foi assumido um número fixo de chamadas por minuto ou por dia para a conta.
