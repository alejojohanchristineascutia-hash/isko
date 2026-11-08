(() => {
  'use strict';
  const K = ISKO.kiosk;
  const $ = id => document.getElementById(id);
  const root = document.documentElement;

  /* ---------- Lockdown: keep the kiosk a kiosk ---------- */
  if (K.lockdown) {
    ['contextmenu', 'dragstart', 'gesturestart', 'gesturechange'].forEach(type => document.addEventListener(type, event => event.preventDefault()));
    document.addEventListener('wheel', event => { if (event.ctrlKey) event.preventDefault(); }, { passive: false });
    document.addEventListener('keydown', event => {
      const key = event.key.toLowerCase();
      const blocked = ['f1', 'f3', 'f5', 'f6', 'f7', 'f12'].includes(key)
        || (event.ctrlKey && ['r', 'p', 's', 'u', 'o', 'n', 't', 'w', 'j', 'h', 'f', 'g', 'l', '+', '-', '=', '0'].includes(key))
        || (event.ctrlKey && event.shiftKey)
        || (event.altKey && ['arrowleft', 'arrowright'].includes(key));
      if (blocked) event.preventDefault();
    });
  }
  if (K.hideCursor) document.body.classList.add('hide-cursor');

  /* ---------- Keep native text inputs from fighting the on-screen keyboard ---------- */
  const textLike = el => el && ((el.tagName === 'INPUT' && ['text', 'search', 'tel', 'email', ''].includes(el.type)) || el.tagName === 'TEXTAREA');
  function prepareFields() {
    document.querySelectorAll('input, textarea').forEach(el => {
      el.setAttribute('autocomplete', 'off');
      el.setAttribute('autocorrect', 'off');
      el.setAttribute('spellcheck', 'false');
      if (K.onScreenKeyboard && textLike(el)) el.setAttribute('inputmode', 'none');
      if (el.type === 'number') el.readOnly = true; // copies use the big − / + buttons
    });
  }
  new MutationObserver(prepareFields).observe(document.body, { childList: true, subtree: true });
  prepareFields();

  /* ---------- On-screen keyboard ---------- */
  let osk, target = null, shift = false, shiftLock = false, repeatTimer, repeatDelay;
  const rows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', { k: 'back', label: '⌫', cls: 'wide' }],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    [{ k: 'shift', label: '⇧', cls: 'wide' }, 'z', 'x', 'c', 'v', 'b', 'n', 'm', '.', '-'],
    [{ k: 'clear', label: 'Clear', cls: 'wide small' }, "'", '@', '_', { k: ' ', label: 'space', cls: 'space' }, ',', { k: 'done', label: 'Done', cls: 'wide accent' }]
  ];
  function buildKeyboard() {
    osk = document.createElement('div');
    osk.id = 'osk'; osk.setAttribute('aria-label', 'On-screen keyboard'); osk.setAttribute('role', 'group');
    osk.innerHTML = rows.map(row => `<div class="osk-row">${row.map(key => {
      const k = typeof key === 'string' ? key : key.k, label = typeof key === 'string' ? key : key.label, cls = typeof key === 'string' ? '' : key.cls;
      return `<button type="button" class="osk-key ${cls}" data-k="${k}" tabindex="-1">${label}</button>`;
    }).join('')}</div>`).join('');
    document.body.appendChild(osk);
    // pointerdown + preventDefault keeps focus in the field while keys are tapped
    osk.addEventListener('pointerdown', event => {
      const button = event.target.closest('.osk-key'); if (!button) return;
      event.preventDefault(); press(button.dataset.k);
      if (button.dataset.k === 'back') { repeatDelay = setTimeout(() => { repeatTimer = setInterval(() => press('back'), 70); }, 400); }
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => osk.addEventListener(type, stopRepeat));
    osk.addEventListener('mousedown', event => event.preventDefault());
  }
  function stopRepeat() { clearTimeout(repeatDelay); clearInterval(repeatTimer); }
  function applyCase() {
    osk.querySelectorAll('.osk-key').forEach(button => {
      if (button.dataset.k.length === 1 && /[a-z]/.test(button.dataset.k)) button.textContent = shift ? button.dataset.k.toUpperCase() : button.dataset.k;
    });
    osk.querySelector('[data-k="shift"]').classList.toggle('active', shift);
  }
  function wantsAutoCap(el) { return !['student-id', 'payment-reference', 'student-email', 'track-ref', 'track-student'].includes(el.id); }
  function syncShift() {
    if (!target) return;
    const before = target.value.slice(0, target.selectionStart ?? target.value.length);
    shift = shiftLock || (wantsAutoCap(target) && (before === '' || /\s$/.test(before)));
    applyCase();
  }
  function insert(text) {
    if (!target) return;
    const start = target.selectionStart ?? target.value.length, end = target.selectionEnd ?? start;
    if (target.maxLength > 0 && target.value.length - (end - start) + text.length > target.maxLength) return;
    target.setRangeText(text, start, end, 'end');
    target.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function press(k) {
    if (!target) return;
    if (k === 'done') { target.blur(); return; }
    if (k === 'shift') { if (shift && !shiftLock) shiftLock = true; else if (shiftLock) { shiftLock = false; shift = false; } else shift = true; applyCase(); return; }
    if (k === 'clear') { target.value = ''; target.dispatchEvent(new Event('input', { bubbles: true })); syncShift(); return; }
    if (k === 'back') {
      const start = target.selectionStart ?? target.value.length, end = target.selectionEnd ?? start;
      if (start !== end) target.setRangeText('', start, end, 'end');
      else if (start > 0) target.setRangeText('', start - 1, start, 'end');
      target.dispatchEvent(new Event('input', { bubbles: true })); syncShift(); return;
    }
    insert(k.length === 1 && shift ? k.toUpperCase() : k);
    if (shift && !shiftLock) shift = false;
    syncShift();
  }
  function openKeyboard(el) {
    if (!osk) buildKeyboard();
    target = el; shiftLock = el.dataset.caps === 'true'; syncShift();
    osk.classList.add('open'); document.body.classList.add('osk-open');
    root.style.setProperty('--kb-h', `${osk.offsetHeight}px`);
    setTimeout(() => { if (target === el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 220);
  }
  function closeKeyboard() {
    target = null; stopRepeat();
    if (!osk) return;
    osk.classList.remove('open'); document.body.classList.remove('osk-open'); root.style.setProperty('--kb-h', '0px');
  }
  if (K.onScreenKeyboard) {
    document.addEventListener('focusin', event => { if (textLike(event.target)) openKeyboard(event.target); });
    document.addEventListener('focusout', () => setTimeout(() => { if (!textLike(document.activeElement)) closeKeyboard(); }, 60));
    document.addEventListener('pointerdown', event => {
      if (target && !event.target.closest('#osk') && !textLike(event.target) && !event.target.closest('label')) target.blur();
    }, true);
    window.addEventListener('resize', () => { if (osk && osk.classList.contains('open')) root.style.setProperty('--kb-h', `${osk.offsetHeight}px`); });
  }

  /* ---------- Big tap-friendly picker instead of tiny native dropdowns ---------- */
  let picker;
  function closePicker() { if (picker) { picker.remove(); picker = null; } }
  function openPicker(select) {
    closePicker();
    const label = document.querySelector(`label[for="${select.id}"]`);
    const title = label ? label.textContent.replace('*', '').trim() : 'Choose an option';
    picker = document.createElement('div'); picker.className = 'picker-backdrop';
    picker.innerHTML = `<div class="picker-sheet" role="dialog" aria-modal="true" aria-label="${title}"><h3>${title}</h3><div class="picker-list"></div><button type="button" class="button secondary picker-cancel">Cancel</button></div>`;
    const list = picker.querySelector('.picker-list');
    [...select.options].forEach(option => {
      if (option.value === '' && option.textContent.startsWith('Choose')) return;
      const button = document.createElement('button');
      button.type = 'button'; button.className = `picker-option${option.value === select.value ? ' selected' : ''}`;
      button.innerHTML = `<span></span><b>${option.value === select.value ? '✓' : ''}</b>`;
      button.firstChild.textContent = option.textContent;
      button.addEventListener('click', () => {
        select.value = option.value; closePicker();
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      list.appendChild(button);
    });
    picker.addEventListener('click', event => { if (event.target === picker || event.target.closest('.picker-cancel')) closePicker(); });
    document.body.appendChild(picker);
    const selected = list.querySelector('.selected'); if (selected) selected.scrollIntoView({ block: 'center' });
  }
  ['pointerdown', 'mousedown'].forEach(type => document.addEventListener(type, event => { if (event.target.closest('select')) event.preventDefault(); }, true));
  document.addEventListener('click', event => { const select = event.target.closest('select'); if (select) { event.preventDefault(); select.blur(); openPicker(select); } }, true);
  document.addEventListener('keydown', event => { if (event.target.tagName === 'SELECT' && [' ', 'Enter'].includes(event.key)) { event.preventDefault(); openPicker(event.target); } });

  /* ---------- Idle protection: never leave a student's session on a public screen ---------- */
  const idleDialog = document.createElement('dialog');
  idleDialog.id = 'idle-dialog';
  idleDialog.innerHTML = `<div class="dialog-title-icon" data-icon="clock"></div><h2>Are you still there?</h2><p>For your privacy, this session ends in <b id="idle-count"></b> seconds.</p><div class="idle-actions"><button class="button primary" data-idle="stay">I’m still here</button><button class="button secondary" data-idle="leave">Sign out now</button></div>`;
  document.body.appendChild(idleDialog);
  idleDialog.querySelector('[data-icon]').innerHTML = ISKO.icon('clock');
  idleDialog.addEventListener('cancel', event => event.preventDefault());
  let lastActivity = Date.now(), warningEndsAt = 0;
  const resetActivity = () => { if (!warningEndsAt) lastActivity = Date.now(); };
  ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'].forEach(type => document.addEventListener(type, resetActivity, { capture: true, passive: true }));
  function endWarning() { warningEndsAt = 0; lastActivity = Date.now(); if (idleDialog.open) idleDialog.close(); }
  function resetKiosk() {
    endWarning(); closePicker(); closeKeyboard(); if (ISKO.closeOverlays) ISKO.closeOverlays();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (ISKO.isSignedIn()) ISKO.signOut();
  }
  idleDialog.addEventListener('click', event => {
    const choice = event.target.closest('[data-idle]'); if (!choice) return;
    if (choice.dataset.idle === 'stay') endWarning(); else resetKiosk();
  });
  setInterval(() => {
    const now = Date.now();
    if (ISKO.isSignedIn()) {
      if (warningEndsAt) {
        const left = Math.ceil((warningEndsAt - now) / 1000);
        if (left <= 0) { resetKiosk(); return; }
        $('idle-count').textContent = left;
      } else if (now - lastActivity >= K.idleWarnSeconds * 1000) {
        warningEndsAt = now + K.idleCountdownSeconds * 1000;
        $('idle-count').textContent = K.idleCountdownSeconds;
        closePicker(); closeKeyboard();
        idleDialog.showModal();
      }
    } else if (now - lastActivity >= K.loginIdleSeconds * 1000) {
      const form = $('login-form');
      if ([...form.elements].some(field => field.value && field.type !== 'submit')) { form.reset(); closeKeyboard(); }
      if (ISKO.closeOverlays) ISKO.closeOverlays();
      lastActivity = now;
    }
  }, 1000);
})();
