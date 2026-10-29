import { test } from 'node:test';
import assert from 'node:assert/strict';
import { launch, pause } from './helpers.mjs';
import { interfaceFor } from './dom-simulation.mjs';
async function enter(ui){
 ui.select('#participant-code').value='TESTE_SINTETICO';
 await ui.click('#start-btn');assert.equal(ui.select('#screen-start').classList.contains('active'),true);
 ui.select('#consent').checked=true;await ui.click('#start-btn');
 assert(ui.select('#screen-pre').classList.contains('active'));
 ui.select('#pre-interpretation').value='Acho que ele não confia no meu trabalho.';
 await ui.click('#pre-btn');assert(ui.select('#screen-chat').classList.contains('active'));
}
async function send(ui,text){ui.select('#chat-input').value=text;await ui.submit();}
async function postRound(ui){
 await ui.click('#end-round-btn');assert(ui.select('#screen-post').classList.contains('active'));
 assert(ui.evaluate("$$('.post-scale').every(x => x.value === '4')"));
 ui.evaluate("$$('.post-scale')[0].value = '7'");
 ui.select('#post-interpretation').value='Talvez ele esteja apenas tentando ajudar.';
 await ui.click('#post-btn');
}
for(const mock of [true,false])test(`Interface em DOM simulado: fluxo completo com ${mock?'MOCK':'API Gemini simulada'}`,async()=>{
 const app=await launch(mock);
 try{
  const ui=await interfaceFor(app);await enter(ui);
  assert.equal(ui.select('#chat-input').attrs.maxlength,'2500');
  assert(ui.select('#chat-mode').textContent.includes(mock?'MOCK':'LLM'));
  assert(ui.select('#end-round-btn').disabled);
  for(let round=1;round<=2;round++){
   assert.equal(ui.state().round,round);assert.equal(ui.state().counts[round],0);
   for(let i=1;i<=4;i++){
    const message=i===1?'Acho que ele não confia no meu trabalho.':`Mensagem ${i} da rodada ${round}.`;
    await send(ui,message);
    assert.equal(ui.state().counts[round],i);
    assert.equal(ui.select('#chat-input').value,'');
    assert.equal(ui.select('#chat-log').children.length,i*2);
    assert.equal(ui.select('#end-round-btn').disabled,i<2);
    assert.equal(ui.select('#chat-input').disabled,i===4);
   }
   await ui.submit();assert.equal(ui.state().counts[round],4);
   await postRound(ui);
  }
  assert(ui.select('#screen-final').classList.contains('active'));
  ui.select('#final-comment').value='Comentário sintético do teste.';
  // The response to finish is lost once: repeating must complete without duplicating events.
  ui.loseNextFinish();await ui.click('#finish-btn');assert(ui.select('#screen-final').classList.contains('active'));
  await ui.click('#finish-btn');assert(ui.select('#screen-done').classList.contains('active'));
  const events=app.logs();assert.equal(events.filter(x=>x.type==='chat_user').length,8);
  assert.equal(events.filter(x=>x.type==='chat_assistant').length,8);
  assert.equal(events.filter(x=>x.eventName==='post_round').length,2);
  assert.equal(events.filter(x=>x.eventName==='final_comparison').length,1);
  assert.equal(events.filter(x=>x.type==='session_finish').length,1);
  assert.equal(app.calls().length,mock?0:8);
 }finally{await app.close();}
});

test('Interface em DOM simulado: falha preserva texto, contador e histórico; nova tentativa funciona',async()=>{
 const app=await launch();
 try{
  const ui=await interfaceFor(app);await enter(ui);
  for(const [message,count] of [['TESTE_429',1],['TESTE_TIMEOUT',2],['TESTE_TRUNCADA',3]]){
   await send(ui,message);
   assert.equal(ui.select('#chat-input').value,message);
   assert.equal(ui.state().counts[1],count-1);
   assert.equal(ui.select('#chat-log').children.length,(count-1)*2);
   assert.equal(ui.select('#chat-form button').disabled,false);
   assert.equal(ui.select('#chat-form button').textContent,'Tentar novamente');
   assert(ui.select('#app-status').classList.contains('error'));
   const requestId=ui.state().pending.requestId;
   await ui.submit();assert.equal(ui.state().counts[1],count);assert.equal(ui.state().pending,null);
   const records=app.logs().filter(x=>x.requestId===requestId);
   assert.equal(records.filter(x=>x.type==='chat_user').length,1);
   assert.equal(records.filter(x=>x.type==='chat_assistant').length,1);
  }
  ui.select('#chat-input').value='TESTE_LENTA';const first=ui.submit();
  assert(ui.state().busy);assert(ui.select('#chat-input').disabled);assert(ui.select('#end-round-btn').disabled);
  ui.select('#end-round-btn').onclick();assert.equal(ui.state().round,1);assert(ui.select('#screen-chat').classList.contains('active'));
  await ui.submit();await first;
  assert.equal(ui.state().counts[1],4);
  assert.equal(app.calls().filter(x=>x.contents.at(-1).parts[0].text==='TESTE_LENTA').length,1);
  await postRound(ui);assert.equal(ui.state().round,2);assert.equal(ui.select('#chat-input').disabled,false);
 }finally{await app.close();}
});

test('Interface em DOM simulado: resposta perdida ou timeout do cliente não duplica troca',async()=>{
 const app=await launch();
 try{
  const ui=await interfaceFor(app);await enter(ui);
  ui.loseNextChat();await send(ui,'Texto com resposta perdida.');
  assert.equal(ui.state().counts[1],0);assert.equal(ui.select('#chat-input').value,'Texto com resposta perdida.');
  assert(ui.select('#chat-input').disabled);assert(ui.state().pending.uncertain);
  const calls=app.calls().length;await ui.submit();assert.equal(app.calls().length,calls);assert.equal(ui.state().counts[1],1);
  ui.evaluate('state.chatTimeoutMs=25');await send(ui,'TESTE_LENTA');
  assert.equal(ui.state().counts[1],1);assert(ui.state().pending.uncertain);assert(ui.select('#chat-input').disabled);
  await pause(130);ui.evaluate('state.chatTimeoutMs=10250');
  await ui.submit();assert.equal(ui.state().counts[1],2);
  assert.equal(app.calls().filter(x=>x.contents.at(-1).parts[0].text==='TESTE_LENTA').length,1);
  assert.equal(app.logs().filter(x=>x.type==='chat_user').length,2);
  assert.equal(ui.select('#chat-log').children.length,4);
 }finally{await app.close();}
});
