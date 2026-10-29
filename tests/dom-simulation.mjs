// A small, explicitly simulated DOM for testing event handlers in Node.
// It does not emulate a browser's rendering, accessibility or native form events.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { project, pause } from './helpers.mjs';
class Element {
 constructor(tag,attrs={}) {
  this.tagName=tag;this.attrs=attrs;this.children=[];this.parentElement=null;
  this.className=attrs.class||'';this._value=attrs.value??'';this._text='';
  this.disabled='disabled' in attrs;this.checked='checked' in attrs;this.dataset={};
  for(const [key,val] of Object.entries(attrs)) if(key.startsWith('data-')) this.dataset[key.slice(5)]=val;
  this.classList={
   contains:name=>this.className.split(/\s+/).includes(name),
   add:name=>{if(!this.classList.contains(name))this.className+=(this.className?' ':'')+name;},
   remove:name=>{this.className=this.className.split(/\s+/).filter(x=>x!==name).join(' ');},
   toggle:(name,force)=>{const add=force??!this.classList.contains(name);this.classList[add?'add':'remove'](name);}
  };
 }
 get value(){return this.tagName==='select'&&!this._value?(this.children.find(x=>x.tagName==='option')?.value||''):this._value;}
 set value(v){this._value=String(v);}
 get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}
 set textContent(v){this._text=String(v);this.children=[];}
 set innerHTML(v){if(v!=='')throw Error('Only clearing HTML is simulated');this.children=[];this._text='';}
 appendChild(child){child.parentElement=this;this.children.push(child);return child;}
 setAttribute(k,v){this.attrs[k]=String(v);}
 focus(){this.focused=true;}
 get nextElementSibling(){const peers=this.parentElement?.children||[];return peers[peers.indexOf(this)+1]||null;}
}
function matches(el,selector){
 const checked=selector.endsWith(':checked');selector=selector.replace(/:checked$/,'');
 if(checked&&!el.checked)return false;
 if(selector.startsWith('#'))return el.attrs.id===selector.slice(1);
 if(selector.startsWith('.'))return el.classList.contains(selector.slice(1));
 const attr=selector.match(/^([\w-]+)\[([\w-]+)="([^"]+)"\]$/);
 if(attr)return el.tagName===attr[1]&&el.attrs[attr[2]]===attr[3];
 return el.tagName===selector;
}
function parse(html){
 const root=new Element('document');const stack=[root];
 for(const token of html.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g)||[]){
  if(token.startsWith('<!'))continue;
  if(token.startsWith('</')){stack.pop();continue;}
  if(token.startsWith('<')){
   const tag=token.match(/^<([\w-]+)/)?.[1];if(!tag)continue;
   const attrs={};const raw=token.slice(tag.length+1,-1);
   for(const a of raw.matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)')?/g))attrs[a[1]]=a[2]??a[3]??'';
   const el=new Element(tag,attrs);stack.at(-1).appendChild(el);
   if(!['meta','link','input','br','hr','img'].includes(tag)&&!token.endsWith('/>'))stack.push(el);
  }else stack.at(-1)._text+=token;
 }
 const all=()=>{const out=[];const walk=e=>{for(const child of e.children){out.push(child);walk(child);}};walk(root);return out;};
 const document={createElement:tag=>new Element(tag),querySelectorAll:selector=>{
  const selectors=selector.split(/\s+/);return all().filter(el=>{
   if(!matches(el,selectors.at(-1)))return false;
   let parent=el.parentElement;
   for(let i=selectors.length-2;i>=0;i--){while(parent&&!matches(parent,selectors[i]))parent=parent.parentElement;if(!parent)return false;parent=parent.parentElement;}
   return true;
  });
 }};
 document.querySelector=selector=>document.querySelectorAll(selector)[0]||null;
 return document;
}
export async function interfaceFor(app, source = project){
 const document=parse(fs.readFileSync(path.join(source,'public/index.html'),'utf8'));
 let loseChat=false,loseFinish=false;
 const context=vm.createContext({document,window:{scrollTo(){}},crypto:{randomUUID},AbortController,console,
  TypeError,SyntaxError,Error,DOMException,setTimeout,clearTimeout,alert:()=>{},
  fetch:async(route,options)=>{
   const response=await fetch(app.base+route,options);
   if((route==='/api/chat'&&loseChat)||(route==='/api/finish'&&loseFinish)){
    if(route==='/api/chat')loseChat=false;else loseFinish=false;
    await response.text();throw new TypeError('Simulated response loss after server commit');
   }
   return response;
  }
 });
 vm.runInContext(fs.readFileSync(path.join(source,'public/app.js'),'utf8'),context);
 for(let i=0;i<100&&document.querySelector('#start-btn').disabled;i++)await pause(5);
 if(document.querySelector('#start-btn').disabled)throw Error(document.querySelector('#app-status').textContent);
 const select=s=>document.querySelector(s);
 const click=async selector=>{const el=select(selector);if(el.disabled)throw Error('Button disabled: '+selector);await el.onclick();};
 const submit=()=>select('#chat-form').onsubmit({preventDefault(){}});
 return {select,click,submit,state:()=>vm.runInContext('state',context),
  evaluate:code=>vm.runInContext(code,context),
  loseNextChat:()=>{loseChat=true;},loseNextFinish:()=>{loseFinish=true;}
 };
}
