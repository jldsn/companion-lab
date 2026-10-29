# Companion Lab

Protótipo web experimental sobre companheiros digitais e IA afetiva, desenvolvido para a disciplina **CIN0055 — Tendências em Mídia e Interação**, do Centro de Informática da Universidade Federal de Pernambuco (CIn/UFPE).

## Proposta

Como duas estratégias relacionais, executadas pelo mesmo modelo de linguagem, influenciam a sensação de ser compreendido, a reconsideração da interpretação inicial e a confiança no companheiro durante uma interação breve?

O Companion Lab permite explorar essa pergunta por meio de conversas sobre uma situação social fictícia. Cada participante interage com dois companheiros, apresentados apenas como **A** e **B**, cuja ordem é sorteada a cada sessão:

- **Validante:** reconhece emoções e explora a interpretação inicial de maneira acolhedora.
- **Questionador:** ajuda a separar fatos de inferências, examina pressupostos e apresenta alternativas plausíveis.

Os dois estilos usam o mesmo modelo e os mesmos parâmetros de geração; a diferença está nas instruções relacionais. Trata-se de um estudo exploratório com autorrelatos e uma amostra pequena, sem pretensão de demonstrar efeitos psicológicos universais.

## Fluxo da experiência

1. Leitura do aviso de participação, consentimento e escolha de um cenário fictício.
2. Registro da interpretação inicial, confiança e clareza.
3. Conversa com o Companheiro A: de duas a quatro trocas concluídas.
4. Avaliação da primeira conversa.
5. Conversa com o Companheiro B e nova avaliação.
6. Comparação final e encerramento.

A leitura inicial é registrada como questionário; não é enviada automaticamente como primeira mensagem do chat.

## Executar localmente

O projeto utiliza Node.js e seus módulos nativos, sem dependências npm para o funcionamento básico. É necessário ter Node.js instalado, com suporte a `fetch`.

Baixe o repositório em **Code → Download ZIP**, extraia os arquivos e abra o PowerShell na pasta que contém `server.mjs`.

Crie sua configuração local:

```powershell
Copy-Item .env.example .env
notepad .env
```

No `.env`, preencha `GEMINI_API_KEY` com sua chave local. A configuração usada no ensaio concluído foi:

```dotenv
AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
PORT=3000
AI_TIMEOUT_MS=60000
GEMINI_MAX_OUTPUT_TOKENS=2048
```

A linha da chave está vazia neste exemplo intencionalmente. Nunca publique seu `.env`.

Inicie o servidor:

```powershell
node server.mjs
```

Abra [http://localhost:3000](http://localhost:3000). Confira o modo e o modelo indicados na página antes de iniciar. Para parar, pressione **Ctrl+C** no terminal. Reinicie o servidor após alterar o `.env`.

A configuração acima define espera de até 60 segundos pelo provedor, com margem adicional de 10 segundos no navegador. Sem `AI_TIMEOUT_MS`, o padrão do código é 30 segundos. Use o `.env` para reproduzir a configuração validada, inclusive o modelo; o padrão interno do servidor pode ser diferente.

## Falhas e recuperação

Tentativas malsucedidas não avançam o contador nem acrescentam trocas concluídas ao histórico. O texto é preservado e a página informa o erro. Não há repetição automática de geração nem troca automática para MOCK após falha da API.

Se a conexão se perder e o resultado do envio ficar incerto, use **Tentar novamente** antes de editar a mensagem ou mudar de rodada. Enquanto o servidor continuar ativo, uma resposta já concluída pode ser recuperada sem outra geração.

Respostas identificadas como incompletas ou bloqueadas não são exibidas como normais. A checagem de pontuação final é uma heurística: não garante completude semântica. Cancelar a espera também não garante que o provedor deixou de processar a solicitação ou consumir cota.

## Privacidade e registros

Use somente os cenários fictícios. Não insira nomes reais, dados sensíveis ou conflitos pessoais. A participação é voluntária; fechar a página interrompe o uso, mas não apaga registros anteriores.

No modo Gemini, o cenário e as mensagens são enviados ao Google. As condições aplicáveis ao uso do conteúdo devem ser consultadas nos termos do provedor; a documentação da camada gratuita informa uso para melhoria de produtos.

Conversas, avaliações, ordem dos estilos e informações de origem são gravadas no computador que hospeda o servidor, em `data/session-events.jsonl`. Códigos de participante não garantem anonimato dos textos.

Para exportar:

```powershell
node export_csv.mjs
```

O arquivo `data/session-events.csv` preserva modo, provedor e modelo. Separe sessões de teste, sessões incompletas e sessões MOCK dos dados coletados com participantes. Eventos de tentativa e erro não representam trocas concluídas.

Não publique `.env`, arquivos JSONL ou CSV. O `.gitignore` não protege arquivos enviados manualmente pelo navegador.

## Modo MOCK

Para testar somente a usabilidade, acrescente `MOCK_MODE=1` ao `.env` e reinicie o servidor. As respostas serão pré-programadas, sem geração por LLM. A página identifica esse modo; ele também é usado ao iniciar sem uma chave para o provedor selecionado.

Após uma mudança de modo, inicie novas sessões e avise os participantes. Dados MOCK não permitem conclusões sobre o comportamento de uma LLM.

## Validação e limitações

- Sete testes automatizados passaram com Node v24.22.1: servidor, fluxo da interface em DOM simulado, falhas, recuperação, concorrência e exportação. Esses testes não utilizam uma API externa.
- Em 28/10/2026, foi concluído um ensaio manual no Windows com Gemini real (`gemini-3.5-flash-lite`): quatro trocas em cada rodada, avaliações, comparação final e exportação CSV. Uma falha de geração foi recuperada sem duplicar as trocas concluídas.
- O `gemini-3.8-flash` apresentou timeouts nos testes anteriores. A causa desses timeouts não foi determinada.
- Acesso externo, uso simultâneo por participantes e capacidade sob carga ainda não foram validados.
- Sessões ativas e respostas recuperáveis ficam em memória. Reiniciar o servidor interrompe essas sessões, embora os eventos já gravados permaneçam em disco.

Para executar os testes automatizados:

```powershell
node --check server.mjs
node --check public/app.js
node --test tests/server.test.mjs tests/interface.test.mjs
```

## Acesso por outros dispositivos

O endereço `localhost` funciona no computador que executa o servidor. Colocar o código no GitHub não hospeda a aplicação.

Antes de disponibilizar acesso externo, teste o fluxo no dispositivo de um participante. Se usar um túnel temporário, qualquer pessoa com a URL poderá acessar; restrinja sua circulação à turma e encerre o túnel após a atividade. O servidor não possui proteção completa contra uso externo indevido.

## Documentação do projeto

- [PROJETO.md](PROJETO.md): pergunta de investigação e desenho exploratório.
- [ROTEIRO_TESTE.md](ROTEIRO_TESTE.md): condução da atividade e plano alternativo.
- [REGISTRO.md](REGISTRO.md): observações e decisões por iteração.
- [CORRECOES_E_TESTES.md](CORRECOES_E_TESTES.md): histórico técnico da revisão v4 e validação automatizada anterior ao ensaio manual descrito acima.

## Referências técnicas

- [Modelos Gemini](https://ai.google.dev/gemini-api/docs/models)
- [API de geração](https://ai.google.dev/api/generate-content)
- [Raciocínio e tokens](https://ai.google.dev/gemini-api/docs/generate-content/thinking)
- [Preços e uso do conteúdo](https://ai.google.dev/gemini-api/docs/pricing)
- [Limites de uso](https://ai.google.dev/gemini-api/docs/rate-limits)

A disponibilidade e as cotas dependem do projeto e devem ser conferidas no Google AI Studio. Uma consulta bem-sucedida à lista de modelos não garante que uma geração funcionará.
