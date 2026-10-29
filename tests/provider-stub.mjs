// Test-only upstream simulation. Nothing is sent to Gemini or OpenAI.
import fs from 'node:fs';
const seen=new Map();
globalThis.fetch=async (url,options)=>{
  if (!String(url).startsWith('https://generativelanguage.googleapis.com/')) throw Error('Acesso externo bloqueado no teste');
  const body=JSON.parse(options.body);
  fs.appendFileSync('provider-calls.jsonl',JSON.stringify(body)+'\n');
  const message=body.contents.at(-1).parts[0].text;
  const attempt=(seen.get(message)||0)+1; seen.set(message,attempt);
  const code=message.match(/^HTTP_(\d+)/)?.[1];
  if(code) return Response.json({error:{message:'Não exibir: CHAVE_SINTETICA_NAO_USAR'}},{status:Number(code)});
  if(attempt===1){
    if(message==='TESTE_429') return Response.json({error:{}},{status:429});
    if(message==='TESTE_TIMEOUT') return new Promise((resolve,reject)=>{
      options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});
    });
    if(message==='TESTE_TRUNCADA') return Response.json({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'Uma frase cortada'}]}}]});
  }
  if(message==='TESTE_SAFETY') return Response.json({candidates:[{finishReason:'SAFETY',content:{parts:[{text:'Resposta bloqueada.'}]}}]});
  if(message==='TESTE_VAZIA') return Response.json({candidates:[{finishReason:'STOP',content:{parts:[]}}]});
  if(message==='TESTE_PARCIAL') return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'Dá para entender por que essa mensagem'}]}}]});
  if(message==='TESTE_LENTA') await new Promise((resolve,reject)=>{
    const timer=setTimeout(resolve,100);
    options.signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));},{once:true});
  });
  return Response.json({candidates:[{finishReason:'STOP',content:{parts:[
    {thought:true,text:'RACIOCINIO_NAO_EXIBIR'},
    {text:'Esta é uma resposta simulada completa. Que aspecto do cenário sustenta sua interpretação?'}
  ]}}],usageMetadata:{promptTokenCount:50,candidatesTokenCount:30,thoughtsTokenCount:10,totalTokenCount:90}});
};
