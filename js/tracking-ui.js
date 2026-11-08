(() => {
  'use strict';
  const K = ISKO.kiosk, e = ISKO.escape, icon = ISKO.icon, $ = id => document.getElementById(id);
  const statusIndex = id => ISKO.statuses.findIndex(status => status.id === id);

  /* ---------- Shared markup ---------- */
  function aheadLine(rec) {
    if (rec.status === 'pending') return 'Waiting for payment verification.';
    if (rec.status === 'queued') { const ahead = ISKO.queueAhead(rec); return ahead === 0 ? 'You are next!' : `${ahead} request${ahead === 1 ? '' : 's'} ahead of you.`; }
    if (rec.status === 'ready') return 'Ready for pickup. Bring your student ID.';
    return 'All done.';
  }
  ISKO.trackerMarkup = rec => {
    const current = statusIndex(rec.status), meta = ISKO.statuses[current];
    const steps = ISKO.statuses.map((status, index) => `<li class="${index < current || rec.status === 'completed' ? 'done' : index === current ? 'current' : ''}"><span class="track-dot">${index < current || rec.status === 'completed' ? icon('check') : index + 1}</span><b>${status.label}</b></li>`).join('');
    return `<div class="track-card"><div class="track-top">${rec.queueNo ? `<div class="queue-no"><span>QUEUE NUMBER</span><b>${e(rec.queueNo)}</b></div>` : ''}<div class="track-state">${ISKO.statusBadge(rec)}<p class="track-line">${aheadLine(rec)}</p><p>${meta.note}</p></div></div><ol class="tracker" aria-label="Request progress">${steps}</ol></div>`;
  };
  ISKO.timelineMarkup = rec => `<ul class="timeline">${rec.events.slice().reverse().map(event => `<li><span class="status-badge status-${event.status}">${ISKO.statuses[statusIndex(event.status)].label}</span><span>${e(ISKO.stamp(event.at))}</span><small>${event.by === 'Student' ? 'Request submitted' : 'Updated by the office'}</small></li>`).join('')}</ul>`;
  ISKO.queueBannerMarkup = rec => `<div class="preview-track">${ISKO.trackerMarkup(rec)}<p class="track-email">${icon('message')}${rec.email ? `Status updates will be emailed to <b>${e(rec.email)}</b>. You can also check anytime in <b>My requests</b>.` : 'You can check this request anytime in <b>My requests</b>.'}</p></div>`;

  /* ---------- Overlays (plain divs, so the on-screen keyboard can sit above them) ---------- */
  function closeOverlays() { document.querySelectorAll('.overlay').forEach(node => node.remove()); }
  ISKO.closeOverlays = closeOverlays;
  function openOverlay(id, html) {
    closeOverlays();
    if ($('toast')) $('toast').hidden = true;
    const node = document.createElement('div');
    node.className = 'overlay'; node.id = id; node.innerHTML = html;
    document.body.appendChild(node); return node;
  }

  /* ---------- Student: track from My requests ---------- */
  function showTrackDialog(rec) {
    const dialog = $('info-dialog');
    dialog.classList.add('wide');
    dialog.addEventListener('close', () => dialog.classList.remove('wide'), { once: true });
    $('dialog-content').innerHTML = `<div class="dialog-title-icon">${icon('clock')}</div><h2>Where is my request?</h2><p>${e(ISKO.docName(rec))} · ${e(rec.id)}</p>${ISKO.trackerMarkup(rec)}<h3 class="timeline-title">History</h3>${ISKO.timelineMarkup(rec)}${rec.email ? `<p class="track-email">${icon('message')}Updates are emailed to <b>${e(rec.email)}</b>.</p>` : ''}<button class="button primary" data-action="close-dialog">Close ${icon('check')}</button>`;
    dialog.showModal();
  }
  function showNotifications() {
    const mails = ISKO.mail.outbox();
    const rows = mails.map(mail => `<article class="mail-row"><div><b>${e(mail.subject)}</b><small>${e(mail.to)} · ${e(ISKO.stamp(mail.at))}</small></div><pre>${e(mail.body)}</pre></article>`).join('') || '<div class="empty-state"><h2>No notifications yet.</h2><p>Status updates will appear here when your request changes.</p></div>';
    openOverlay('notifications-view', `<div class="overlay-panel wide"><header class="overlay-head"><h2>Email notifications</h2><button class="button secondary" data-action="overlay-close">${icon('arrow-left')} Back</button></header><div class="overlay-body"><p class="staff-note"><b>Prototype inbox:</b> these messages demonstrate the emails the system would send for account activity and document status changes.</p>${rows}</div></div>`);
  }

  /* ---------- Student: track from the login screen ---------- */
  function openTrack() {
    const node = openOverlay('track-view', `<div class="overlay-panel"><header class="overlay-head"><h2>Track your request</h2><button class="button secondary" data-action="overlay-close">${icon('arrow-left')} Back</button></header><div class="overlay-body"><p class="muted-lg">Enter the request number printed on your claim stub and your student number.</p><label for="track-ref">Request number</label><input id="track-ref" data-caps="true" placeholder="e.g. ISK-2026-ABC123" maxlength="30" autocomplete="off"><label for="track-student">Student number</label><input id="track-student" placeholder="e.g. 2024-01012" maxlength="30" autocomplete="off"><button class="button primary track-go" data-action="track-lookup">${icon('clock')} Check status</button><div id="track-result" aria-live="polite"></div></div></div>`);
    node.querySelector('#track-ref').focus();
  }
  function lookup() {
    const ref = $('track-ref').value, sid = $('track-student').value, out = $('track-result');
    if (!ref.trim() || !sid.trim()) { out.innerHTML = '<p class="track-error">Please fill in both fields.</p>'; return; }
    const rec = ISKO.lookup(ref, sid);
    if (!rec) { out.innerHTML = '<p class="track-error">We could not find that request. Check the request number on your claim stub and your student number.</p>'; return; }
    document.activeElement && document.activeElement.blur();
    out.innerHTML = `<h3 class="track-doc">${e(ISKO.docName(rec))} <small>${e(rec.id)}</small></h3>${ISKO.trackerMarkup(rec)}<h3 class="timeline-title">History</h3>${ISKO.timelineMarkup(rec)}${rec.email ? `<p class="track-email">${icon('message')}Updates are emailed to ${e(ISKO.maskEmail(rec.email))}.</p>` : ''}`;
    setTimeout(() => out.scrollIntoView({ block: 'start', behavior: 'smooth' }), 250);
  }

  /* ---------- Staff: PIN pad ---------- */
  let pin = '', failures = 0, lockedUntil = 0;
  function pinMarkup(message = '') {
    const length = String(K.staffPin).length;
    return `<div class="overlay-panel pin-panel"><div class="dialog-title-icon">${icon('lock')}</div><h2>Registrar access</h2><div class="pin-dots" aria-label="PIN entry">${Array.from({ length }, (_, index) => `<i class="${index < pin.length ? 'on' : ''}"></i>`).join('')}</div><p class="pin-msg" role="alert">${message}</p><div class="pin-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-action="pin-key" data-key="${n}">${n}</button>`).join('')}<button data-action="pin-key" data-key="cancel" class="pin-small">Cancel</button><button data-action="pin-key" data-key="0">0</button><button data-action="pin-key" data-key="back" class="pin-small">⌫</button></div></div>`;
  }
  function openPin() { pin = ''; openOverlay('pin-view', pinMarkup()); }
  function pinKey(key) {
    if (key === 'cancel') { closeOverlays(); return; }
    if (Date.now() < lockedUntil) { $('pin-view').innerHTML = pinMarkup('Too many tries. Please wait a moment.'); return; }
    if (key === 'back') pin = pin.slice(0, -1); else if (pin.length < String(K.staffPin).length) pin += key;
    if (pin.length === String(K.staffPin).length) {
      if (pin === String(K.staffPin)) { failures = 0; pin = ''; openStaff(); return; }
      failures += 1; pin = '';
      if (failures >= 5) { lockedUntil = Date.now() + 30000; failures = 0; $('pin-view').innerHTML = pinMarkup('Too many tries. Locked for 30 seconds.'); return; }
      $('pin-view').innerHTML = pinMarkup('Incorrect PIN. Try again.'); return;
    }
    $('pin-view').innerHTML = pinMarkup();
  }

  /* ---------- Staff: Registrar console ---------- */
  const staff = { tab: 'requests', filter: 'active' };
  const nextAction = { pending: ['queued', 'Confirm payment · Queue it'], queued: ['ready', 'Mark ready'], ready: ['completed', 'Mark completed'] };
  function staffMarkup() {
    const all = ISKO.requests.all();
    const counts = Object.fromEntries(ISKO.statuses.map(status => [status.id, all.filter(rec => rec.status === status.id).length]));
    const shown = all.filter(rec => staff.filter === 'all' ? true : staff.filter === 'active' ? rec.status !== 'completed' : rec.status === staff.filter)
      .sort((a, b) => (a.status === 'completed') - (b.status === 'completed') || (a.status === 'completed' ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)));
    const chips = [['active', 'Active'], ...ISKO.statuses.map(status => [status.id, `${status.label} (${counts[status.id]})`]), ['all', 'All']]
      .map(([id, text]) => `<button class="staff-chip${staff.filter === id ? ' on' : ''}" data-action="staff-filter" data-filter="${id}">${text}</button>`).join('');
    const rows = shown.map(rec => {
      const step = nextAction[rec.status], payment = (ISKO.payments.find(item => item.id === rec.payment) || {}).name;
      const ahead = ISKO.queueAhead(rec);
      return `<article class="staff-row"><div class="staff-q"><b>${e(rec.queueNo || '—')}</b><small>${e(rec.id)}</small></div><div class="staff-main"><h3>${e(ISKO.docName(rec))} · ${rec.copies} ${rec.copies === 1 ? 'copy' : 'copies'}</h3><p>${e(rec.student.name)} · ${e(rec.student.studentId)} · ${e(payment || '')}${rec.reference ? ` · Ref ${e(rec.reference)}` : ''}</p><p class="staff-sub">${e(ISKO.stamp(rec.createdAt))}${ahead !== null ? ` · ${ahead} ahead` : ''}${rec.email ? ` · ${e(rec.email)}` : ' · no email'}</p></div>${ISKO.statusBadge(rec)}<div class="staff-actions">${step ? `<button class="button primary" data-action="staff-set" data-id="${e(rec.id)}" data-status="${step[0]}">${step[1]}</button>` : ''}${rec.status !== 'pending' ? `<button class="button secondary staff-back" data-action="staff-set" data-id="${e(rec.id)}" data-status="${ISKO.statuses[statusIndex(rec.status) - 1].id}" aria-label="Move back one step">↩</button>` : ''}</div></article>`;
    }).join('') || '<div class="empty-state staff-empty"><h2>Nothing here yet.</h2><p>New requests from students will appear in this list.</p></div>';
    const box = ISKO.mail.outbox();
    const mailRows = box.map(mail => `<article class="mail-row"><div><b>${e(mail.subject)}</b><small>To ${e(mail.to)} · ${e(ISKO.stamp(mail.at))} · ${e(mail.kind)}</small></div><pre>${e(mail.body)}</pre></article>`).join('') || '<div class="empty-state staff-empty"><h2>No emails yet.</h2><p>Emails appear here when students sign in or their requests change.</p></div>';
    const notice = K.emailWebhook ? 'Each email below is also sent to the configured webhook.' : '<b>Demo mode:</b> emails are recorded here but not delivered. Set <code>emailWebhook</code> in <code>js/kiosk-config.js</code> to send them for real.';
    return `<div class="overlay-panel wide"><header class="overlay-head"><h2>Registrar console</h2><div class="staff-tabs"><button class="staff-chip${staff.tab === 'requests' ? ' on' : ''}" data-action="staff-tab" data-tab="requests">Requests (${all.length})</button><button class="staff-chip${staff.tab === 'mail' ? ' on' : ''}" data-action="staff-tab" data-tab="mail">Email outbox (${box.length})</button></div><button class="button secondary" data-action="overlay-close">${icon('logout')} Lock &amp; close</button></header><div class="overlay-body">${staff.tab === 'requests' ? `<div class="staff-chips">${chips}</div>${rows}` : `<p class="staff-note">${notice}</p>${mailRows}`}</div></div>`;
  }
  function openStaff() { openOverlay('staff-view', staffMarkup()); }
  function refreshStaff() { const node = $('staff-view'); if (node) { const scroller = node.querySelector('.overlay-body'), top = scroller ? scroller.scrollTop : 0; node.innerHTML = staffMarkup(); node.querySelector('.overlay-body').scrollTop = top; } }

  /* ---------- Events ---------- */
  document.addEventListener('click', event => {
    const brand = event.target.closest('.brand');
    if (brand) { // five quick taps on the ISKO logo open the Registrar PIN pad
      if (brand.closest('.login-story')) event.preventDefault();
      const now = Date.now(); taps = taps.filter(time => now - time < 4000); taps.push(now);
      if (taps.length >= 5) { taps = []; openPin(); }
    }
    const target = event.target.closest('[data-action]'); if (!target) return;
    const action = target.dataset.action;
    if (action === 'track-open') openTrack();
    else if (action === 'notifications') showNotifications();
    else if (action === 'track-lookup') lookup();
    else if (action === 'track-request') { const rec = ISKO.requests.get(target.dataset.id); if (rec) showTrackDialog(rec); }
    else if (action === 'overlay-close') closeOverlays();
    else if (action === 'pin-key') pinKey(target.dataset.key);
    else if (action === 'staff-tab') { staff.tab = target.dataset.tab; refreshStaff(); }
    else if (action === 'staff-filter') { staff.filter = target.dataset.filter; refreshStaff(); }
    else if (action === 'staff-set') { ISKO.setStatus(target.dataset.id, target.dataset.status); refreshStaff(); }
  });
  let taps = [];
  window.addEventListener('isko:requests-changed', refreshStaff);
  document.addEventListener('keydown', event => { if (event.key === 'Enter' && event.target.closest && event.target.closest('#track-view') && event.target.tagName === 'INPUT') lookup(); });
})();
