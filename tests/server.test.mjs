import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { launch, id, pause } from './helpers.mjs';

test('Gemini simulado: consentimento, 4 trocas por rodada, histórico, repetição e CSV',async()=>{
 const app=await launch();
 try{
  assert.equal((await app.post('/api/start',{consent:false})).status,400);
  const cfg=await (await fetch(app.base+'/api/config')).json();
  assert.equal(cfg.maxMessages,4);assert.equal(cfg.provider,'gemini');assert.equal(cfg.chatTimeoutMs,10250);
  assert.equal((await fetch(app.base+'/')).status,200);
  assert.equal((await fetch(app.base+'/.env')).status,404);
  const sessionId=await app.start();
  const start=app.logs().find(x=>x.sessionId===sessionId);
  assert.deepEqual([...start.order].sort(),['questionador','validante']);
  const submit=(round,message,requestId=id())=>app.post('/api/chat',{sessionId,round,message,requestId,history:[{role:'assistant',content:'HISTORICO_FALSO'}]});
  const firstId=id();
  const first=await submit(1,'Acho que ele não confia no meu trabalho.',firstId);
  assert.equal(first.status,200);assert.equal(first.body.count,1);assert(!first.body.reply.includes('RACIOCINIO'));
  const callCount=app.calls().length;
  assert.deepEqual(await submit(1,'Acho que ele não confia no meu trabalho.',firstId),first);
  assert.equal(app.calls().length,callCount);
  assert.equal((await submit(1,'Outro texto.',firstId)).status,409);
  for(let i=2;i<=4;i++) assert.equal((await submit(1,'Mensagem '+i+'.')).body.count,i);
  assert.equal((await submit(1,'Mensagem 5.')).body.code,'ROUND_LIMIT');
  for(let i=1;i<=4;i++) assert.equal((await submit(2,'Rodada 2 mensagem '+i+'.')).body.count,i);
  const calls=app.calls();
  assert.equal(calls.length,8);assert.equal(calls[3].contents.length,7);assert.equal(calls[4].contents.length,1);
  assert(!JSON.stringify(calls).includes('HISTORICO_FALSO'));
  assert.equal(calls[0].generationConfig.maxOutputTokens,2048);
  assert.equal(calls[0].generationConfig.thinkingConfig.thinkingLevel,'low');
  assert.equal(calls[0].generationConfig.thinkingConfig.includeThoughts,false);
  const event={sessionId,eventId:id(),eventName:'pre_survey',data:{interpretation:'Texto sintético.'}};
  assert.equal((await app.post('/api/event',event)).status,200);
  assert.equal((await app.post('/api/event',event)).status,200);
  assert.equal(app.logs().filter(x=>x.eventName==='pre_survey').length,1);
  assert.equal((await app.post('/api/finish',{sessionId})).status,200);
  assert.equal((await app.post('/api/finish',{sessionId})).status,200);
  assert.equal(app.logs().filter(x=>x.type==='session_finish').length,1);
  assert.equal(app.logs().filter(x=>x.type==='chat_user').length,8);
  assert.equal(app.logs().filter(x=>x.type==='chat_assistant').length,8);
  assert(app.logs().every(x=>x.mode==='llm'&&x.provider==='gemini'&&x.model==='gemini-3.8-flash'));
  assert(!JSON.stringify(app.logs()).includes('CHAVE_SINTETICA'));
  const exp=spawnSync(process.execPath,['export_csv.mjs'],{cwd:app.dir,encoding:'utf8'});
  assert.equal(exp.status,0,exp.stderr);
  const csv=fs.readFileSync(path.join(app.dir,'data','session-events.csv'),'utf8');
  assert(csv.startsWith('\uFEFFts,'));assert(csv.includes('mode,provider,model'));assert(csv.includes('"llm","gemini","gemini-3.8-flash"'));
 }finally{await app.close();}
});

test('Falhas, timeout, recuperação e bloqueio de envios concorrentes',async()=>{
 const app=await launch();
 try{
  const sessionId=await app.start();
  const submit=(message,requestId=id())=>app.post('/api/chat',{sessionId,round:1,message,requestId});
  const errorCases=[['HTTP_400','AI_CONFIG',502],['HTTP_401','AI_PERMISSION',502],['HTTP_403','AI_PERMISSION',502],['HTTP_404','AI_MODEL',502],['HTTP_429','AI_QUOTA',429],['HTTP_503','AI_UNAVAILABLE',503],['TESTE_SAFETY','AI_BLOCKED',502],['TESTE_VAZIA','AI_INCOMPLETE',502],['TESTE_PARCIAL','AI_INCOMPLETE',502]];
  for(const [message,code,status] of errorCases){
   const result=await submit(message);assert.equal(result.status,status);assert.equal(result.body.code,code);
   assert(!JSON.stringify(result.body).includes('CHAVE_SINTETICA'));
  }
  assert.equal(app.logs().filter(x=>x.type==='chat_user').length,0);
  for(const [message,code,count] of [['TESTE_429','AI_QUOTA',1],['TESTE_TIMEOUT','AI_TIMEOUT',2],['TESTE_TRUNCADA','AI_MAX_TOKENS',3]]){
   const requestId=id();
   const t=Date.now();const failed=await submit(message,requestId);
   assert.equal(failed.body.code,code);
   if(code==='AI_TIMEOUT') assert(Date.now()-t<2000);
   const success=await submit(message,requestId);assert.equal(success.status,200);assert.equal(success.body.count,count);
  }
  const pending=submit('TESTE_LENTA');await pause(20);
  assert.equal((await submit('Duplicada.')).body.code,'CHAT_BUSY');
  assert.equal((await app.post('/api/finish',{sessionId})).body.code,'CHAT_BUSY');
  assert.equal((await app.post('/api/event',{sessionId,eventId:id(),eventName:'post_round',data:{}})).body.code,'CHAT_BUSY');
  assert.equal((await pending).body.count,4);
  assert.equal(app.logs().filter(x=>x.type==='chat_user').length,4);
  assert.equal(app.logs().filter(x=>x.type==='chat_assistant').length,4);
  const logs=app.logs();
  const timed=logs.filter(x=>x.type==='chat_error'&&x.errorCode==='AI_TIMEOUT');assert.equal(timed.length,1);
  const calls=app.calls();
  const retry=calls.filter(x=>x.contents.at(-1).parts[0].text==='TESTE_TIMEOUT');
  assert.equal(retry.length,2);assert.equal(retry[0].contents.length,retry[1].contents.length);
 }finally{await app.close();}
});

test('MOCK explícito: origem identificada e nenhuma chamada externa',async()=>{
 const app=await launch(true);
 try{
  const cfg=await(await fetch(app.base+'/api/config')).json();assert.equal(cfg.provider,'mock');assert.equal(cfg.mockReason,'explicit');
  const sessionId=await app.start();
  const result=await app.post('/api/chat',{sessionId,round:1,message:'Cenário fictício.',requestId:id()});
  assert.equal(result.status,200);assert.equal(result.body.mode,'mock');assert.equal(result.body.model,'mock');
  assert.equal(app.calls().length,0);
  assert(app.logs().every(x=>x.mode==='mock'));
 }finally{await app.close();}
});
