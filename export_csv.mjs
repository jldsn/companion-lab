import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const input=path.join(__dirname,'data','session-events.jsonl');
const output=path.join(__dirname,'data','session-events.csv');
if (!fs.existsSync(input)) { console.error('Nenhum dado encontrado.'); process.exit(1); }
const rows=fs.readFileSync(input,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const headers=['ts','type','sessionId','participantCode','scenarioId','round','profileKey','eventName','message','data',
  'mode','provider','model','order','requestId','attempt','errorCode','durationMs','usage'];
// Older records only carried provenance on session_start. Join it when exporting
// mixed historical files, without inferring a missing/unknown origin.
const starts=new Map(rows.filter(r=>r.type==='session_start').map(r=>[r.sessionId,r]));
const esc=v=>{
  let text=String(v??'');
  if (/^[\s]*[=+@-]/.test(text)) text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
};
const csv=[headers.join(','),...rows.map(r=>{
  const start=starts.get(r.sessionId)||{};
  const row={mode:start.mode,provider:start.provider,model:start.model,...r};
  return headers.map(h=>esc(['data','usage','order'].includes(h)?JSON.stringify(row[h]??(h==='data'?{}:null)):row[h])).join(',');
})].join('\r\n');
fs.writeFileSync(output,'\uFEFF'+csv,'utf8');
console.log(output);
