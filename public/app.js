const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const state = {
  sessionId: null,
  scenario: null,
  round: 1,
  histories: {1: [], 2: []},
  counts: {1: 0, 2: 0},
  maxMessages: 4,
  chatTimeoutMs: 40000,
  busy: false,
  pending: null,
  eventIds: {},
  cfg: null
};

function show(id) {
  $$('.screen').forEach(x => x.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({top:0, behavior:'smooth'});
}

function status(message = '', error = false) {
  const el = $('#app-status');
  el.textContent = message;
  el.classList.toggle('error', error);
}

async function request(path, body, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(path, body === undefined
      ? { signal: controller.signal }
      : {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body), signal:controller.signal});
    const data = await r.json();
    if (!r.ok) {
      const err = new Error(data.error || 'Não foi possível concluir o envio.');
      err.definitive = true;
      err.code = data.code;
      throw err;
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('O envio excedeu o prazo de espera. O texto foi preservado. Tente novamente; se o servidor ainda estiver ocupado, aguarde antes de repetir.');
    if (err instanceof TypeError || err instanceof SyntaxError) throw new Error('Não foi possível comunicar com o servidor. Confira a conexão e tente novamente. Se ele foi reiniciado, será necessário começar uma nova sessão.');
    throw err;
  } finally { clearTimeout(timer); }
}

const api = (path, body) => request(path, body, path === '/api/chat' ? state.chatTimeoutMs : 15000);

// A repeated survey submission uses the same ID, including after a lost response.
function recordEvent(eventName, data, round = null) {
  const key = `${eventName}_${round}`;
  state.eventIds[key] ||= crypto.randomUUID();
  return api('/api/event', {sessionId:state.sessionId, eventId:state.eventIds[key], eventName, round, data});
}

function action(selector, handler) {
  const button = $(selector);
  button.onclick = async () => {
    if (button.disabled) return;
    button.disabled = true;
    status();
    try { await handler(); }
    catch (err) { status(err.message, true); }
    finally { button.disabled = false; }
  };
}

function companionLabel(round) { return round === 1 ? 'Companheiro A' : 'Companheiro B'; }

async function init() {
  const cfg = await request('/api/config');
  state.cfg = cfg;
  state.maxMessages = cfg.maxMessages;
  state.chatTimeoutMs = cfg.chatTimeoutMs;
  $('#max-msg-count').textContent = cfg.maxMessages;
  const select = $('#scenario-select');
  cfg.scenarios.forEach(s => {
    const o = document.createElement('option'); o.value=s.id; o.textContent=s.title; select.appendChild(o);
  });
  $('#mode-note').textContent = cfg.mockMode ? 'Modo MOCK ativo: as respostas são pré-programadas e não utilizam uma LLM.' : `Modelo ativo: ${cfg.model} (${cfg.provider}).`;
  $('#chat-mode').textContent = cfg.mockMode ? 'MOCK · respostas pré-programadas; avaliação de usabilidade.' : `LLM · ${cfg.model} (${cfg.provider}); mensagens enviadas ao provedor.`;
  if (cfg.mockReason === 'missing_key') $('#mode-note').textContent += ' Não foi encontrada uma chave para o provedor configurado.';
  const privacyNote = $('#privacy-note');
  if (!cfg.mockMode && cfg.provider === 'gemini') {
    privacyNote.textContent = 'As mensagens são enviadas à API Gemini do Google para gerar respostas. No nível gratuito, o Google informa que pode usar o conteúdo enviado para melhorar seus produtos. As conversas, avaliações e textos livres também são gravados localmente no computador que hospeda o protótipo. Não escreva nomes reais, dados pessoais ou relatos de conflitos seus. A participação é voluntária; você pode interromper a atividade fechando a página.';
  } else if (!cfg.mockMode && cfg.provider === 'openai') {
    privacyNote.textContent = 'As mensagens são enviadas à API da OpenAI para gerar respostas. As conversas, avaliações e textos livres também são gravados localmente no computador que hospeda o protótipo. Não escreva nomes reais, dados pessoais ou relatos de conflitos seus. A participação é voluntária; você pode interromper a atividade fechando a página.';
  }
  $('#start-btn').disabled = false;
}

action('#start-btn', async () => {
  const participantCode = $('#participant-code').value.trim();
  if (!$('#consent').checked) return status('Leia o aviso e marque a caixa de participação para continuar.', true);
  if (!participantCode) return status('Informe um código de participante.', true);
  const data = await api('/api/start', {participantCode, scenarioId:$('#scenario-select').value, consent: true});
  state.sessionId=data.sessionId; state.scenario=data.scenario;
  $('#scenario-pre').textContent = state.scenario.text;
  $('#scenario-chat').textContent = state.scenario.text;
  show('#screen-pre');
});

[['#pre-confidence','#pre-confidence-v'], ['#pre-clarity','#pre-clarity-v']].forEach(([r,v]) => {
  $(r).oninput = e => $(v).textContent = e.target.value;
});

action('#pre-btn', async () => {
  const interpretation = $('#pre-interpretation').value.trim();
  if (!interpretation) return status('Escreva brevemente sua interpretação inicial.', true);
  await recordEvent('pre_survey', {
    interpretation,
    confidence:Number($('#pre-confidence').value),
    clarity:Number($('#pre-clarity').value)
  });
  startRound(1);
});

function startRound(round) {
  state.round=round;
  state.pending=null;
  status();
  $('#round-label').textContent=`Rodada ${round} de 2`;
  $('#companion-name').textContent=companionLabel(round);
  $('#chat-log').innerHTML='';
  $('#chat-input').value='';
  $('#msg-count').textContent=state.counts[round];
  updateChatControls();
  show('#screen-chat');
}

function addMsg(role, content) {
  const div=document.createElement('div');
  div.className=`msg ${role}`; div.textContent=content;
  $('#chat-log').appendChild(div); $('#chat-log').scrollTop=$('#chat-log').scrollHeight;
}

function updateChatControls() {
  const full = state.counts[state.round] >= state.maxMessages;
  $('#chat-input').disabled = state.busy || full || Boolean(state.pending?.uncertain);
  const btn = $('#chat-form button');
  btn.disabled = state.busy || full;
  btn.textContent = state.busy ? 'Pensando...' : full ? 'Limite atingido' : state.pending ? 'Tentar novamente' : 'Enviar';
  $('#end-round-btn').disabled = state.busy || Boolean(state.pending?.uncertain) || state.counts[state.round] < 2;
  $('#chat-form').setAttribute('aria-busy', String(state.busy));
}

$('#chat-form').onsubmit = async e => {
  e.preventDefault();
  if (state.busy || state.counts[state.round] >= state.maxMessages) return;
  const input = $('#chat-input');
  const message = input.value.trim();
  if (!message) return status('Escreva uma mensagem sobre o cenário fictício.', true);
  const round = state.round;
  if (!state.pending || state.pending.message !== message || state.pending.round !== round) {
    state.pending = { requestId: crypto.randomUUID(), message, round };
  }
  const pending = state.pending;
  state.busy = true;
  updateChatControls();
  status(`Aguardando resposta. O prazo de espera do provedor é de até ${Math.round((state.chatTimeoutMs - 10000) / 1000)} segundos.`);
  try {
    const data = await api('/api/chat', {sessionId:state.sessionId, ...pending});
    const expectedProvider = state.cfg.mockMode ? 'mock' : state.cfg.provider;
    if (data.provider !== expectedProvider || data.model !== state.cfg.model || data.requestId !== pending.requestId) {
      throw new Error('A origem da resposta mudou. Interrompa esta sessão e avise o responsável; não misture MOCK e LLM.');
    }
    // Only complete exchanges enter the visible log, history and counter.
    state.histories[round].push({role:'user',content:message},{role:'assistant',content:data.reply});
    addMsg('user', message);
    addMsg('assistant', data.reply);
    state.counts[round] = data.count;
    $('#msg-count').textContent = data.count;
    input.value = '';
    state.pending = null;
    status(data.count >= state.maxMessages ? 'Você concluiu as quatro mensagens. Encerre esta conversa para continuar.' : 'Resposta recebida. Você pode continuar a conversa.');
  } catch (err) {
    // A disconnected client cannot know whether the server already committed
    // the turn. Resolve that same ID before allowing edits or round changes.
    pending.uncertain ||= !err.definitive;
    status(err.message + (pending.uncertain ? ' Para recuperar este envio sem duplicá-lo, clique em Tentar novamente antes de alterar o texto.' : ''), true);
  } finally {
    state.busy = false;
    updateChatControls();
    if (!input.disabled) input.focus();
  }
};

$('#end-round-btn').onclick = () => {
  if (state.busy || state.pending?.uncertain || state.counts[state.round] < 2) return;
  status();
  $$('.post-scale').forEach(x => { x.value = '4'; x.nextElementSibling.textContent = '4/7'; });
  $('#post-title').textContent=`Avalie sua experiência com ${companionLabel(state.round)}.`;
  $('#post-interpretation').value='';
  $$('input[name="seeking"]').forEach(x=>x.checked=false);
  show('#screen-post');
};

$$('.post-scale').forEach(input => {
  input.oninput=()=> input.nextElementSibling.textContent=`${input.value}/7`;
});

action('#post-btn', async () => {
  const interpretation=$('#post-interpretation').value.trim();
  if (!interpretation) return status('Registre sua interpretação após a conversa.', true);
  const seeking=$('input[name="seeking"]:checked')?.value || 'nao_respondeu';
  const scales={}; $$('.post-scale').forEach(x=>scales[x.dataset.key]=Number(x.value));
  await recordEvent('post_round', {interpretation,seeking,...scales}, state.round);
  if (state.round===1) {
    $('#chat-input').disabled=false; $('#chat-form button').disabled=false; $('#chat-form button').textContent='Enviar';
    startRound(2);
  } else show('#screen-final');
});

action('#finish-btn', async () => {
  await recordEvent('final_comparison', {
    preferred:$('#preferred').value,
    reflective:$('#reflective').value,
    comment:$('#final-comment').value.trim()
  });
  await api('/api/finish',{sessionId:state.sessionId});
  show('#screen-done');
});

init().catch(err => status(`${err.message} Recarregue a página para tentar carregar a configuração.`, true));
