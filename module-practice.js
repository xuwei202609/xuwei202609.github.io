'use strict';
(() => {
  const bank = window.BELONG_PRACTICE_DATA;
  const storageKey = 'belong-module-practice-v1';
  const participantKey = 'belong-anonymous-participant-v1';
  const routes = new Map();
  const busy = new Set();
  const uuid = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = bytes[6] & 15 | 64;
    bytes[8] = bytes[8] & 63 | 128;
    const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
  };
  let progress;
  try { progress = JSON.parse(localStorage.getItem(storageKey)); } catch {}
  if (!progress || progress.version !== bank.version || !Array.isArray(progress.modules)) progress = { version: bank.version, modules: [] };

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(progress)); return true; }
    catch { return false; }
  }
  function record(index) {
    let item = progress.modules[index];
    if (!item || !Array.isArray(item.answers) || item.answers.length !== bank.modules[index].questions.length) {
      item = { answers: bank.modules[index].questions.map(() => []), submissionId: uuid(), submitted: false };
      progress.modules[index] = item;
    }
    return item;
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function update(screen, index) {
    const item = record(index), sending = busy.has(index);
    screen.querySelectorAll('input').forEach(input => { input.disabled = item.submitted || sending; });
    screen.querySelector('[data-practice-submit]').disabled = item.submitted || sending || item.answers.some(answer => answer.length === 0);
    screen.querySelector('[data-practice-next]').disabled = !item.submitted || sending;
    screen.querySelector('[data-practice-success]').hidden = !item.submitted;
    screen.querySelector('[data-practice-progress]').style.width = (item.submitted ? 100 : 0) + '%';
  }

  for (const [index, module] of bank.modules.entries()) {
    const route = 'module-' + module.module + '-practice';
    routes.set(route, index);
    const screen = element('section', 'screen node practice-screen');
    Object.assign(screen.dataset, { screen: route, title: 'Practice · Module ' + module.module });
    screen.hidden = true;
    screen.id = 'screen-' + route;
    screen.append(document.querySelector('.screen[data-chapter="' + index + '"][data-view="done"] nav').cloneNode(true));
    const main = element('main', 'practice-content');
    main.append(element('p', 'practice-eyebrow', 'B E L O N G   /   MODULE ' + module.module), element('h1', '', 'Practice'));
    const progress = element('div', 'practice-progress');
    const bar = element('span'); bar.dataset.practiceProgress = '';
    progress.append(bar); main.append(progress);
    const form = element('form', 'practice-form');
    for (const [questionIndex, question] of module.questions.entries()) {
      const fieldset = element('fieldset', 'practice-question');
      fieldset.append(element('legend', '', (questionIndex + 1) + '. ' + question.prompt));
      for (const [optionIndex, option] of question.options.entries()) {
        const label = element('label', 'practice-option');
        const input = element('input');
        input.type = question.multiple ? 'checkbox' : 'radio';
        input.name = 'module-' + module.module + '-question-' + question.id;
        input.value = String(optionIndex + 1);
        input.dataset.question = String(questionIndex);
        label.append(input, element('span', 'practice-letter', String.fromCharCode(65 + optionIndex)), element('span', 'practice-option-text', option));
        fieldset.append(label);
      }
      form.append(fieldset);
    }
    const actions = element('div', 'practice-actions');
    const submit = element('button', 'practice-button', 'Submit'); submit.type = 'submit'; submit.dataset.practiceSubmit = '';
    const next = element('button', 'practice-button', index < 2 ? 'Move to module ' + (module.module + 1) : 'Continue to role play');
    next.type = 'button'; next.disabled = true; next.dataset.practiceNext = '';
    const nextGroup = element('div');
    const success = element('p', 'practice-success', 'Please move to the next module.'); success.dataset.practiceSuccess = ''; success.hidden = true;
    nextGroup.append(next, success); actions.append(submit, nextGroup);
    const status = element('p', 'practice-status'); status.setAttribute('role', 'status');
    form.append(actions, status); main.append(form); screen.append(main); document.body.append(screen);

    screen.addEventListener('change', event => {
      const input = event.target;
      if (!input.matches('input') || busy.has(index) || record(index).submitted) return;
      const question = Number(input.dataset.question);
      record(index).answers[question] = [...screen.querySelectorAll('input[data-question="' + question + '"]:checked')].map(node => Number(node.value)).sort();
      if (!save()) screen.querySelector(".practice-status").textContent = 'Your browser could not save your selections. Keep this page open and retry.';
      update(screen, index);
    });
    screen.addEventListener('click', event => {
      const next = event.target.closest('[data-practice-next]'); if (!next) return;
      if (next.disabled || !record(index).submitted) return;
      document.dispatchEvent(new CustomEvent('belong-practice-next', { detail: { index } }));
    });
    screen.addEventListener('submit', async event => {
      event.preventDefault();
      const item = record(index);
      if (busy.has(index) || item.submitted || item.answers.some(answer => !answer.length)) return;
      if (!save()) { screen.querySelector(".practice-status").textContent = 'Your browser could not save your selections. Please allow browser storage and retry.'; return; }
      busy.add(index); update(screen, index); screen.querySelector(".practice-status").textContent = 'Saving your answers…';
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 30000);
      try {
        let participantId = localStorage.getItem(participantKey);
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(participantId)) {
          participantId = uuid(); localStorage.setItem(participantKey, participantId);
        }
        const base = String(window.BELONG_CONFIG?.reflectionApiBaseUrl || '').replace(/\/$/, '');
        if (!base) throw Error('Practice is not connected. Please try again later.');
        const session = await fetch(base + '/api/reflections/session', { cache: 'no-store', signal: controller.signal });
        if (!session.ok) throw Error('Could not connect. Your selections are retained. Please retry.');
        const { sessionToken } = await session.json();
        const response = await fetch(base + '/api/practice', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Belong-Session': sessionToken },
          body: JSON.stringify({ submissionId: item.submissionId, participantId, module: module.module, version: bank.version, answers: item.answers }), signal: controller.signal
        });
        const receipt = await response.json();
        if (!response.ok || !receipt.saved || receipt.submissionId !== item.submissionId) throw Error(receipt.error || 'Your answers could not be saved. Please retry.');
        item.submitted = true; item.submittedAt = receipt.submittedAt;
        if (!save()) screen.querySelector(".practice-status").textContent = 'Your answers were saved online. Browser storage is unavailable; keep this page open.';
        else screen.querySelector(".practice-status").textContent = '';
      } catch (error) {
        screen.querySelector(".practice-status").textContent = error.name === 'AbortError' || error instanceof TypeError ? 'The connection was interrupted. Your selections are retained. Please click Submit again.' : error.message;
      } finally { clearTimeout(timeout); busy.delete(index); update(screen, index); }
    });
  }

  window.BelongPractice = {
    index: route => routes.get(route),
    route: index => 'module-' + (index + 1) + '-practice',
    prepare(screen, index) {
      const item = record(index);
      screen.querySelectorAll('input').forEach(input => { input.checked = item.answers[Number(input.dataset.question)].includes(Number(input.value)); });
      update(screen, index);
    },
    videoButton(screen, index) {
      const button = screen.querySelector('[data-next-chapter]') || [...screen.querySelectorAll('.action')].find(node => node.textContent.trim() === 'Continue to role play');
      if (!button) return;
      button.removeAttribute('data-next-chapter'); button.dataset.target = this.route(index);
      const label = button.querySelector('p'); if (label) label.textContent = 'Practice'; else button.textContent = 'Practice';
    }
  };
})();
