'use strict';
(() => {
  const participantKey = 'belong-anonymous-participant-v1';
  const submissionKey = 'belong-role-submission-v1';
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  function uuid() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
  }

  function submissionFor(answer, randomId) {
    let participantId = localStorage.getItem(participantKey);
    if (!uuidPattern.test(participantId)) {
      participantId = uuid();
      localStorage.setItem(participantKey, participantId);
    }
    let previous;
    try { previous = JSON.parse(localStorage.getItem(submissionKey)); } catch {}
    if (previous?.participantId === participantId && previous.answer === answer && (previous.randomId === randomId || previous.randomId === undefined) && uuidPattern.test(previous.submissionId)) return { ...previous, randomId };
    const submission = { participantId, submissionId: uuid(), answer, randomId };
    localStorage.setItem(submissionKey, JSON.stringify(submission));
    return submission;
  }

  window.BelongReflections = {
    async submit(answer, randomId) {
      const value = answer.trim(); randomId = randomId.trim(); if (!randomId || randomId.length > 128) throw Error('Please enter your participant code (up to 128 characters).');
      if (!value || value.length > 20000) throw Error('Please enter an answer of up to 20,000 characters.');
      let submission;
      try { submission = submissionFor(value, randomId); }
      catch { throw Error('Your browser could not save this submission. Please allow browser storage and retry. Your answer is still in the text box.'); }
      const base = String(window.BELONG_CONFIG?.reflectionApiBaseUrl || '').replace(/\/$/, '');
      if (!base) throw Error('Answer collection is not connected yet. Please try again later.');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      try {
        const sessionResponse = await fetch(base + '/api/reflections/session', { cache: 'no-store', signal: controller.signal });
        if (!sessionResponse.ok) throw Error('Could not connect to answer collection. Please retry.');
        const session = await sessionResponse.json();
        const response = await fetch(base + '/api/reflections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Belong-Session': session.sessionToken },
          body: JSON.stringify(submission),
          signal: controller.signal
        });
        const receipt = await response.json();
        if (!response.ok) throw Error(receipt.error || 'Your answer could not be saved. Please retry.');
        if (!receipt.saved || receipt.submissionId !== submission.submissionId || receipt.participantId !== submission.participantId || receipt.randomId !== randomId) throw Error('The server did not confirm your answer. Please retry.');
        return receipt;
      } catch (error) {
        if (error.name === 'AbortError' || error instanceof TypeError) throw Error('The connection was interrupted. Your answer is retained. Please retry Submit your answer.');
        throw error;
      } finally { clearTimeout(timer); }
    }
  };
})();
