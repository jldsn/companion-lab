# Companion Lab — concepção do projeto

## Problema

Companheiros digitais baseados em modelos de linguagem podem ser configurados para adotar posturas relacionais diferentes. Este projeto explora não apenas o conteúdo das respostas, mas como uma forma de se relacionar — mais validante ou mais questionadora — pode ser percebida e influenciar a interpretação de uma situação ambígua.

## Pergunta de investigação

**Como duas estratégias relacionais construídas por instruções, executadas pelo mesmo modelo de linguagem, influenciam a sensação de ser compreendido, a reconsideração da interpretação inicial e a confiança no companheiro durante uma interação breve?**

A pergunta é deliberadamente delimitada. O projeto não pretende concluir que um tipo de companheiro é melhor para todas as pessoas, nem generalizar a partir de uma turma pequena.

## Hipóteses exploratórias (não são resultados previstos nem conclusões)

- Um estilo mais validante pode ser percebido como acolhedor, mas não necessariamente provocar reconsideração.
- Um estilo mais questionador pode incentivar a consideração de alternativas, mas também gerar desconforto ou parecer confrontador.
- As diferenças podem ser pequenas, inconsistentes, invertidas ou não aparecer. Isso também é resultado útil para revisar o protótipo.

## Artefato computacional

Uma aplicação web experimental que permite executar e registrar interações com duas estratégias relacionais sobre um mesmo cenário fictício. A ordem dos perfis é sorteada por sessão e a pessoa vê apenas os rótulos A e B.

O artefato oferece:

- interface para apresentação do cenário;
- registro da leitura inicial, confiança e clareza;
- chat com até quatro mensagens concluídas do participante em cada condição, com encerramento permitido a partir de duas trocas;
- avaliações após cada conversa;
- comparação final;
- registro de eventos e exportação para CSV.

## Tecnologia emergente e limite do modo MOCK

O foco é a configuração de estratégias relacionais sobre uma LLM, que pode responder de forma aberta aos detalhes específicos da conversa. O modo MOCK existe para testar a interface e a coleta: suas respostas são textos predefinidos e não testam adaptação, consistência ou comportamento de uma LLM. Resultados obtidos no MOCK devem ser tratados apenas como avaliação de usabilidade.

Na primeira versão com Gemini, as duas condições usam o mesmo modelo e mudam as instruções de comportamento. Portanto, o objeto da investigação é a diferença entre essas **instruções experimentais naquele modelo e naquela interação**, e não a personalidade de todas as IAs, nem um efeito psicológico universal.

## O que será observado

- diferença entre sentir-se compreendido e reconsiderar a própria leitura;
- percepção de confiança e desconforto;
- se os dois estilos são distinguíveis para os participantes;
- se as instruções parecem exageradas, repetitivas ou pouco naturais;
- problemas de acesso, interface, tempo e clareza das perguntas.

As medidas são exploratórias e autorrelatadas. Para a análise, distinguir escala numérica, texto aberto, observação direta e interpretação do pesquisador. A ordem aleatória ajuda a reduzir, mas não elimina, efeitos de ordem e aprendizagem entre as duas conversas.

## Escopo ético do primeiro teste

- usar cenários fictícios e de baixo risco;
- não solicitar conflitos reais, diagnósticos ou informações íntimas;
- explicar a gravação local e o eventual envio de mensagens ao provedor de LLM;
- pedir confirmação de participação antes de iniciar;
- não coletar nomes ou dados desnecessários;
- não usar o perfil problemático/manipulativo nesta iteração.

## Próximas iterações

O primeiro teste deve informar a próxima alteração. Uma extensão com transferência para conversa humana, memória persistente ou comportamentos relacionais problemáticos só deve ser incluída se a observação revelar uma pergunta clara e houver tempo para avaliá-la de forma responsável.

## Decisão da revisão v4

O limite de quatro foi mantido para corresponder ao roteiro de 29/10/2026 e ao código da interface do v2. A menção anterior a seis era uma inconsistência documental. Tentativas com falha não contam como mensagens concluídas. As duas condições continuam usando o mesmo modelo e parâmetros, com apenas as instruções relacionais diferentes. A revisão corrige recuperação e registros, sem mudar cenários, perguntas ou ordem aleatória.
