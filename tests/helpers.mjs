import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const project = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
export async function launch(mock = false, source = project) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'companion-test-'));
  for (const file of ['server.mjs','export_csv.mjs','public']) fs.cpSync(path.join(source,file),path.join(dir,file),{recursive:true});
  fs.copyFileSync(new URL('./provider-stub.mjs', import.meta.url),path.join(dir,'stub.mjs'));
  const reservation = net.createServer();
  reservation.listen(0,'127.0.0.1'); await once(reservation,'listening');
  const port = reservation.address().port;
  await new Promise(resolve=>reservation.close(resolve));
  const child = spawn(process.execPath,['--import',path.join(dir,'stub.mjs'),path.join(dir,'server.mjs')],{
    cwd:dir,
    // Deliberately do not inherit credentials or load the user's .env.
    env:{PATH:process.env.PATH,SystemRoot:process.env.SystemRoot || '',PORT:String(port),
      AI_PROVIDER:'gemini',GEMINI_API_KEY:'CHAVE_SINTETICA_NAO_USAR',GEMINI_MODEL:'gemini-3.8-flash',
      AI_TIMEOUT_MS:'250',MOCK_MODE:mock?'1':'0'},
    stdio:['ignore','pipe','pipe']
  });
  let stderr=''; child.stderr.on('data',b=>stderr+=b);
  let timer;
  try {
    await Promise.race([once(child.stdout,'data'),new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(Error('Servidor de teste não iniciou: '+stderr)),3000);
      child.once('exit',code=>reject(Error('Servidor terminou: '+code+' '+stderr)));
    })]);
  } finally { clearTimeout(timer); }
  const base='http://127.0.0.1:'+port;
  const post=async (route,body,signal)=>{
    const r=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});
    return {status:r.status,body:await r.json()};
  };
  const readLines=name=>fs.existsSync(path.join(dir,name))?fs.readFileSync(path.join(dir,name),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[];
  return {dir,base,post,logs:()=>readLines('data/session-events.jsonl'),calls:()=>readLines('provider-calls.jsonl'),
    start:async()=> (await post('/api/start',{consent:true,participantCode:'TESTE_SINTETICO',scenarioId:'grupo'})).body.sessionId,
    async close(){ child.kill(); if(child.exitCode===null) await once(child,'exit'); fs.rmSync(dir,{recursive:true,force:true}); }
  };
}
export const id=()=>randomUUID();
