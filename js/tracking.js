// Request tracking, queue numbers and email notifications (all stored in this browser).
(() => {
  'use strict';
  const K = ISKO.kiosk;

  ISKO.statuses = [
    { id: 'pending', label: 'Pending', note: 'We received your request. The office will verify your payment first.' },
    { id: 'queued', label: 'Queued', note: 'Your payment is confirmed and your request is in line.' },
    { id: 'ready', label: 'Ready', note: 'Your document is ready. Bring your student ID.' },
    { id: 'completed', label: 'Completed', note: 'This request is complete. Thank you!' }
  ];
  const rank = id => ISKO.statuses.findIndex(status => status.id === id);
  const label = id => ISKO.statuses[rank(id)].label;
  const dayKey = () => new Date().toLocaleDateString('en-CA');
  const stamp = iso => new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
  const firstName = student => (student.name || 'there').trim().split(/\s+/)[0];
  const docName = rec => rec.docId === 'other' ? rec.otherDocument : (ISKO.catalog.find(item => item.id === rec.docId) || {}).name;

  function normalize(rec) {
    if (!rec.status) rec.status = 'pending';
    if (!rec.events) rec.events = [{ status: rec.status, at: rec.createdAt, by: 'Student' }];
    return rec;
  }
  const load = () => ISKO.store.get('requests', []).map(normalize);
  const save = list => ISKO.store.set('requests', list);

  ISKO.requests = {
    all: load,
    get: id => load().find(rec => rec.id === id) || null,
    update(id, change) {
      const list = load(), rec = list.find(item => item.id === id);
      if (!rec) return null;
      change(rec); save(list); return rec;
    },
    remove(id) {
      const list = load();
      const next = list.filter(rec => rec.id !== id);
      if (next.length === list.length) return false;
      save(next); return true;
    }
  };
  ISKO.statusBadge = rec => `<span class="status-badge status-${rec.status}">${label(rec.status)}</span>`;

  /* ---------- Queue numbers (reset every day) ---------- */
  function nextQueue() {
    const date = dayKey(), saved = ISKO.store.get('queue', null);
    const seq = saved && saved.date === date ? saved.last + 1 : 1;
    ISKO.store.set('queue', { date, last: seq });
    return { date, seq, no: `Q-${String(seq).padStart(3, '0')}` };
  }
  // How many queued requests are in front of this one (null unless it is Queued).
  ISKO.queueAhead = (rec, list = load()) => rec.status !== 'queued' ? null
    : list.filter(other => other.status === 'queued' && other.queueDate === rec.queueDate && other.queueSeq < rec.queueSeq).length;

  /* ---------- Email outbox ---------- */
  const compose = (kind, rec, extra) => {
    const hi = `Hi ${firstName(rec.student)},\n\n`;
    const ref = `Request number: ${rec.id}\nQueue number: ${rec.queueNo}\nDocument: ${docName(rec)}`;
    const bye = '\n\n— ISKO Student Document Services';
    switch (kind) {
      case 'received': return { subject: `We received your request ${rec.id} · Queue ${rec.queueNo}`, body: `${hi}We received your document request.\n\n${ref}\n\n${rec.payment === 'cash' ? 'Please pay at the cashier and show your claim stub.' : 'The office will verify your payment reference.'} We will email you when your request is queued, when your turn is near, and when it is ready.${bye}` };
      case 'queued': return { subject: `Your request is in the queue · ${rec.queueNo}`, body: `${hi}Your payment was confirmed and your request is now in the queue.\n\n${ref}\n${extra === 0 ? 'You are next in line.' : `Requests ahead of you: ${extra}`}${bye}` };
      case 'approaching': return { subject: `Your turn is approaching · ${rec.queueNo}`, body: `${hi}${extra === 0 ? 'You are next in line.' : `Only ${extra} request${extra === 1 ? ' is' : 's are'} ahead of you.`} Please stay nearby and keep your student ID ready.\n\n${ref}${bye}` };
      case 'ready': return { subject: `Your document is ready · ${rec.queueNo}`, body: `${hi}Your document is ready to be claimed. Please bring your student ID and show queue number ${rec.queueNo}.\n\n${ref}${bye}` };
      case 'completed': return { subject: `Request completed · ${rec.id}`, body: `${hi}Your request was marked completed.\n\n${ref}\n\nIf you did not claim this document, please tell the Registrar's office right away.${bye}` };
      default: return null;
    }
  };
  ISKO.mail = {
    outbox: () => ISKO.store.get('outbox', []),
    send(message) {
      if (!message.to) return null;
      const entry = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), at: new Date().toISOString(), delivery: K.emailWebhook ? 'webhook' : 'demo', ...message };
      ISKO.store.set('outbox', [entry, ...ISKO.mail.outbox()].slice(0, 300));
      if (K.emailWebhook) {
        fetch(K.emailWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: entry.to, subject: entry.subject, body: entry.body, kind: entry.kind }) }).catch(() => {});
      }
      return entry;
    }
  };
  const notify = (kind, rec, extra) => { const mail = compose(kind, rec, extra); if (mail) ISKO.mail.send({ to: rec.email, kind, requestId: rec.id, ...mail }); };
  ISKO.notifySignIn = student => ISKO.mail.send({
    to: student.email, kind: 'signin',
    subject: 'New sign-in to your ISKO account',
    body: `Hi ${firstName(student)},\n\nYour ISKO account (${student.studentId}) was used to sign in at the campus kiosk on ${stamp(new Date().toISOString())}.\n\nIf this was not you, please tell the Registrar's office right away.\n\n— ISKO Student Document Services`
  });
  ISKO.maskEmail = email => { const [user = '', host = ''] = String(email || '').split('@'); return host ? `${user.slice(0, 1)}${'•'.repeat(Math.max(2, user.length - 1))}@${host}` : ''; };

  /* ---------- Creating requests and moving them through the queue ---------- */
  ISKO.createRequest = base => {
    const instant = base.docId === 'cor';
    const queue = instant ? null : nextQueue();
    const rec = { ...base, email: (base.student && base.student.email) || '', status: instant ? 'ready' : 'pending', ...(queue ? { queueNo: queue.no, queueSeq: queue.seq, queueDate: queue.date } : {}), turnNoticeSent: false, events: [{ status: instant ? 'ready' : 'pending', at: base.createdAt, by: 'Student' }] };
    const list = load(); list.unshift(rec);
    const persisted = save(list);
    if (!instant) notify('received', rec);
    return { record: rec, persisted };
  };

  ISKO.setStatus = (id, status, by = 'Registrar') => {
    let before;
    let rec = ISKO.requests.update(id, item => {
      before = item.status;
      if (before === status) return;
      item.status = status; item.events.push({ status, at: new Date().toISOString(), by });
      if (status === 'pending') item.turnNoticeSent = false;
    });
    if (!rec || before === status) return rec;
    const forward = rank(status) > rank(before);
    if (status === 'queued') {
      const ahead = ISKO.queueAhead(rec);
      rec = ISKO.requests.update(id, item => { item.turnNoticeSent = ahead <= K.turnApproachingAhead; });
      if (forward) notify('queued', rec, ahead);
    } else if (forward && (status === 'ready' || status === 'completed')) {
      notify(status, rec);
    }
    ISKO.recheckTurns();
    window.dispatchEvent(new Event('isko:requests-changed'));
    return ISKO.requests.get(id);
  };

  // Email each queued student once, when only a few requests remain in front of them.
  ISKO.recheckTurns = () => {
    const list = load();
    list.filter(rec => rec.status === 'queued' && !rec.turnNoticeSent).forEach(rec => {
      const ahead = ISKO.queueAhead(rec, list);
      if (ahead <= K.turnApproachingAhead) {
        ISKO.requests.update(rec.id, item => { item.turnNoticeSent = true; });
        notify('approaching', rec, ahead);
      }
    });
  };

  ISKO.lookup = (reference, studentId) => load().find(rec =>
    rec.id.toUpperCase() === String(reference).trim().toUpperCase() && rec.student.studentId.toLowerCase() === String(studentId).trim().toLowerCase()) || null;
  ISKO.docName = docName;
  ISKO.stamp = stamp;
})();
