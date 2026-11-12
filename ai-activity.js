'use strict';
(() => {
  const api = String(window.BELONG_CONFIG?.reflectionApiBaseUrl || '').replace(/\/$/, '');
  if (!api) return;
  const participantKey = 'belong-anonymous-participant-v1';
  const queuePrefix = 'belong-ai-activity-v1:';
  const pending = new Map();
  let participantId, session, reply, linking, linkTimer, sending = false, retryTimer;

  function uuid() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
  }

  function participant() {
    if (!participantId) {
      try {
        const saved = localStorage.getItem(participantKey);
        participantId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved) ? saved : uuid();
        localStorage.setItem(participantKey, participantId);
      } catch { participantId ||= uuid(); }
    }
    return participantId;
  }

  function randomId() {
    try { return String(JSON.parse(localStorage.getItem('belong-learning-v5'))?.roleRandomId || '').trim().slice(0, 128); }
    catch { return ''; }
  }

  function enqueue(key, event) {
    const body = JSON.stringify(event);
    pending.set(key, body);
    try { localStorage.setItem(queuePrefix + key, body); } catch {}
    void flush();
  }

  function request(body, keepalive) {
    return fetch(api + '/api/ai-activity', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
      keepalive, signal: keepalive ? undefined : AbortSignal.timeout(15000)
    });
  }

  async function flush() {
    if (sending) return;
    clearTimeout(retryTimer);
    sending = true;
    try {
      while (pending.size) {
        const [key, body] = pending.entries().next().value;
        const response = await request(body, false);
        if (!response.ok) {
          if (response.status !== 400) throw Error('Activity unavailable');
          // A malformed entry cannot be repaired by retrying it.
        }
        if (pending.get(key) === body) {
          pending.delete(key);
          try {
            if (localStorage.getItem(queuePrefix + key) === body) localStorage.removeItem(queuePrefix + key);
          } catch {}
        }
      }
    } catch { retryTimer = setTimeout(flush, 15000); }
    finally { sending = false; }
  }

  function record(current, message) {
    if (!current.closed) current.endedAt = Math.max(Date.now(), current.endedAt);
    const { sessionId, startedAt, endedAt, closed } = current;
    enqueue(sessionId + ':' + (message?.id || 'time'), {
      participantId: participant(), randomId: randomId(), sessionId, startedAt, endedAt, closed, message
    });
  }

  function checkpointReply() {
    if (reply) record(reply.session, { ...reply.message, content: reply.source.content });
  }

  function end() {
    if (!session) return;
    session.endedAt = Math.max(Date.now(), session.endedAt);
    session.closed = true;
    record(session);
    session = null;
  }

  function link() {
    clearTimeout(linkTimer);
    if (linking) enqueue(participant() + ':link', { type: 'link', participantId: participant(), randomId: linking });
    linking = '';
  }

  window.BelongAIActivity = {
    start(threadId, user, assistant) {
      if (!session) {
        const time = Date.now();
        session = { sessionId: uuid(), startedAt: time, endedAt: time, closed: false, users: new Set() };
      }
      if (!session.users.has(user.id)) {
        session.users.add(user.id);
        record(session, { id: uuid(), role: 'user', content: user.content, status: 'complete', threadId, time: Date.now() });
      }
      const current = { session, source: assistant, message: { id: uuid(), role: 'assistant', content: '', status: 'pending', threadId, time: Date.now() } };
      reply = current;
      record(current.session, current.message);
      return () => {
        record(current.session, { ...current.message, content: assistant.content, status: assistant.status });
        if (reply === current) reply = null;
      };
    },
    end
  };

  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(queuePrefix)) pending.set(key.slice(queuePrefix.length), localStorage.getItem(key));
    }
  } catch {}
  void flush();
  window.addEventListener('online', flush);
  document.addEventListener('input', event => {
    if (event.target.id !== 'role-random-id') return;
    linking = event.target.value.trim().slice(0, 128);
    clearTimeout(linkTimer);
    if (linking) linkTimer = setTimeout(link, 750);
  });
  document.addEventListener('change', event => { if (event.target.id === 'role-random-id') link(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { end(); checkpointReply(); link(); }
  });
  window.addEventListener('pagehide', () => {
    end(); checkpointReply(); link();
    let budget = 55000;
    for (const body of pending.values()) {
      const bytes = new TextEncoder().encode(body).length;
      if (bytes > budget) continue;
      budget -= bytes;
      void request(body, true).catch(() => {});
    }
  });
  setInterval(() => {
    if (session && !document.hidden) record(session);
    checkpointReply();
  }, 15000);
})();
