(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const e = ISKO.escape, icon = ISKO.icon;
  const K = ISKO.kiosk;
  const where = K.keepHistory ? 'on this device' : 'for this session';
  let student = K.persistLogin ? ISKO.store.get('student') : null;
  let draft = ISKO.defaultRequest();
  let step = 1;
  let generated = null;
  let historyDetail = false;
  let toastTimer;
  const initials = name => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  // "Other document" requests skip payment and preview: the student is sent to the Registrar instead.
  // (Older saved "Other" requests opened from My requests still show their claim stub.)
  const registrarFlow = () => draft.docId === 'other' && !generated;
  const flowSteps = () => registrarFlow() ? ['Student login', 'Choose document', 'Enter details', 'Registrar'] : ISKO.steps;
  const doc = () => ISKO.catalog.find(item => item.id === draft.docId);
  const requestHistory = () => ISKO.requests.all().filter(item => item.student.studentId.toLowerCase() === student.studentId.toLowerCase());
  const heading = (title, text, number) => `<div class="section-heading"><div><h2>${title}</h2><p>${text}</p></div><span class="section-step">STEP ${number} OF ${registrarFlow() ? 3 : 4}</span></div>`;
  const options = (values, selected) => values.map(value => `<option${value === selected ? ' selected' : ''}>${e(value)}</option>`).join('');
  const required = '<span class="required-mark">*</span>';
  function toast(message, error = false) {
    clearTimeout(toastTimer); $('toast').textContent = message; $('toast').classList.toggle('error', error); $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 5000);
  }
  function hydrateIcons(root = document) { root.querySelectorAll('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); }); }
  function renderDemoAccounts() {
    $('demo-accounts-list').innerHTML = ISKO.demoAccounts.map(account => `<li><button type="button" class="demo-account" data-action="demo-login" data-account="${e(account.studentId)}" aria-label="Sign in as ${e(account.name)}"><span class="avatar">${e(initials(account.name))}</span><span class="demo-account-details"><b>${e(account.name)}</b><span>${e(account.studentId)}</span><small>${e(account.course)}</small></span><span class="demo-account-signin">Sign in ${icon('arrow-right')}</span></button></li>`).join('');
  }
  function setStudent(profile) {
    student = profile;
    if (K.persistLogin) ISKO.store.set('student', profile);
    draft = ISKO.store.get(`draft.${student.studentId}`, ISKO.defaultRequest());
    // Merge newly introduced fields into drafts saved by an earlier version.
    draft = { ...ISKO.defaultRequest(), ...draft };
    step = 1; generated = null;
    $('login-view').hidden = true; $('app-view').hidden = false;
    $('profile-name').textContent = profile.name; $('summary-name').textContent = profile.name;
    $('summary-id').textContent = profile.studentId;
    $('avatar').textContent = initials(profile.name); $('summary-avatar').textContent = initials(profile.name);
    $('summary-note-text').textContent = K.keepHistory ? 'Your information stays on this device. Preview documents are clearly marked as samples.' : 'Your information is cleared when you sign out. Preview documents are clearly marked as samples.';
    $('welcome-name').textContent = `Hi, ${profile.name.trim().split(/\s+/)[0]}! Ready for your next step?`;
    navigate('request');
  }
  function saveDraft() { generated = null; ISKO.store.set(`draft.${student.studentId}`, draft); }
  function updateHistoryCount() { $('history-count').textContent = requestHistory().length; }
  function navigate(view) {
    $('request-view').hidden = view !== 'request'; $('history-view').hidden = view !== 'history';
    document.querySelector('[data-action="nav-request"]').classList.toggle('active', view === 'request');
    document.querySelector('[data-action="nav-history"]').classList.toggle('active', view === 'history');
    updateHistoryCount();
    if (view === 'history') renderHistory(); else render();
  }
  function renderStepper() {
    $('stepper').innerHTML = flowSteps().slice(1).map((label, visibleIndex) => { const index = visibleIndex + 1; return `<li class="${index < step ? 'complete' : index === step ? 'current' : ''}"${index === step ? ' aria-current="step"' : ''}><button data-action="goto-step" data-step="${index}" ${index > step ? 'disabled' : ''}><span class="step-number">${index < step ? icon('check') : visibleIndex + 1}</span><span>${label}</span></button></li>`; }).join('');
  }
  function renderSummary() {
    const item = doc();
    const row = (label, value) => `<div class="summary-row"><span>${label}</span><span${value ? '' : ' class="placeholder"'}>${e(value || 'Not set yet')}</span></div>`;
    const instant = draft.docId === 'cor';
    $('summary-content').innerHTML = `<div class="summary-document"><span class="doc-icon ${item.color}">${icon(item.icon)}</span><div><b>${e(draft.docId === 'other' && draft.otherDocument ? draft.otherDocument : item.short)}</b><small>${e(item.name)}</small></div></div>${row('Academic year', draft.year)}${row('Semester', draft.term)}${row('Purpose', draft.purpose === 'Other' ? draft.customPurpose : draft.purpose)}${row('No. of copies', `${draft.copies} ${draft.copies === 1 ? 'copy' : 'copies'}`)}${registrarFlow() ? '' : row('Payment', step >= 3 ? ISKO.payments.find(payment => payment.id === draft.payment).name : '')}<div class="summary-total"><span>Estimated total</span><b class="${item.price === null ? 'assessment' : ''}">${item.price === null ? 'For assessment' : ISKO.money(item.price * draft.copies)}</b></div><div class="fee-note">${item.price === null ? 'Final fee confirmed by the issuing office' : `${ISKO.money(item.price)} per copy · Illustrative demo fee`}</div><div class="processing-note">${icon(instant ? 'check' : 'clock')}<div><b>${e(item.days)}</b><p>${instant ? 'Your Certificate of Registration is available immediately after your request.' : registrarFlow() ? 'Fee and processing time are assessed by the Registrar.' : 'Estimated processing after payment verification. Subject to office assessment.'}</p></div></div>`;
  }
  function renderDocuments() {
    return `${heading('What document do you need?', 'Select a document to get started with your request.', 1)}<div class="document-grid">${ISKO.catalog.map(item => `<label class="document-choice${draft.docId === item.id ? ' selected' : ''}"><input type="radio" name="document" value="${item.id}"${draft.docId === item.id ? ' checked' : ''} aria-label="${e(item.name)}"><span class="doc-icon ${item.color}">${icon(item.icon)}</span><h3>${item.short}</h3><span class="full-doc-name">${item.name}</span><p>${item.description}</p><div class="document-card-bottom"><b>${item.price === null ? 'For assessment' : ISKO.money(item.price)}</b>${item.tag ? `<small>${item.tag}</small>` : `<span class="doc-time">${icon('clock')} ${item.days}</span>`}</div></label>`).join('')}</div><div class="info-bar">${icon('info')}<span>One document type per request. Fees and processing times shown are sample estimates.</span></div>`;
  }
  function renderDetails() {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 8 }, (_, index) => `${currentYear - index}–${currentYear - index + 1}`);
    if (!years.includes(draft.year)) years.unshift(draft.year);
    return `${heading('A few details, and you’re on your way.', 'Tell us what you need the document for.', 2)}<form id="details-form" class="form-body">${draft.docId === 'other' ? `<label for="other-document">Document name${required}</label><input id="other-document" name="otherDocument" value="${e(draft.otherDocument)}" placeholder="Name of the document you need" required maxlength="120">` : ''}<label for="purpose">Purpose of request${required}</label><select id="purpose" name="purpose" required><option value="">Choose a purpose</option>${options(ISKO.purposes, draft.purpose)}</select><div id="custom-purpose-wrap"${draft.purpose === 'Other' ? '' : ' hidden'}><label for="custom-purpose">Please specify${required}</label><input id="custom-purpose" name="customPurpose" value="${e(draft.customPurpose)}" placeholder="Tell us what the document is for" maxlength="200"${draft.purpose === 'Other' ? ' required' : ''}></div><div class="field-row"><div><label for="academic-year">Academic year${required}</label><select id="academic-year" name="year">${options(years, draft.year)}</select></div><div><label for="academic-term">Academic term${required}</label><select id="academic-term" name="term">${options(ISKO.terms, draft.term)}</select></div></div><label for="copies">Number of copies${required}</label><div class="copy-control"><button type="button" data-action="decrease-copies" aria-label="Fewer copies">−</button><input type="number" id="copies" name="copies" min="1" max="10" value="${draft.copies}" required><button type="button" data-action="increase-copies" aria-label="More copies">+</button></div><span class="input-hint">Up to 10 copies per request. The estimate updates automatically.</span><label for="notes">Additional notes <span class="muted">(optional)</span></label><textarea id="notes" name="notes" placeholder="Anything the issuing office should know?" maxlength="500">${e(draft.notes)}</textarea></form><div class="info-bar">${icon('info')}<span>Double-check your details. Your request will use the name and student number from your student account.</span></div>`;
  }
  function paymentDetails() {
    if (draft.payment === 'cash') return '<h3>Pay when you visit the cashier.</h3><p>Print your payment / claim stub and present it at the cashier. Keep the official receipt and bring your student ID when collecting your documents.</p>';
    return `<h3>${draft.payment === 'gcash' ? 'Keep your GCash payment reference handy.' : 'Let’s match your existing payment.'}</h3><p>${draft.payment === 'gcash' ? 'This app does not collect payments. Use only payment instructions independently confirmed by the university cashier. Enter your completed transaction reference below; it will be marked for verification.' : 'Enter the receipt or transaction reference shown on your payment confirmation. Your payment remains subject to verification by the authorized office.'}</p><label for="payment-reference">${draft.payment === 'gcash' ? 'GCash transaction reference' : 'Receipt / payment reference'}${required}</label><input id="payment-reference" name="reference" value="${e(draft.reference)}" placeholder="Enter your payment reference" required minlength="4" maxlength="80"><span class="input-hint">Demo only. No payment is processed or verified in this app.</span>`;
  }
  function renderPayments() {
    return `${heading('How would you like to pay?', 'Choose the option that works for you.', 3)}<div class="payment-options">${ISKO.payments.map(payment => `<label class="payment-choice${draft.payment === payment.id ? ' selected' : ''}"><span class="doc-icon ${payment.id === 'cash' ? 'orange' : payment.id === 'gcash' ? 'blue' : 'green'}">${icon(payment.icon)}</span><div><b>${payment.name}</b><p>${payment.description}</p></div><input type="radio" name="payment" value="${payment.id}"${draft.payment === payment.id ? ' checked' : ''} aria-label="${payment.name}"></label>`).join('')}</div><form id="payment-form" class="payment-details">${paymentDetails()}${draft.payment === 'gcash' ? '<div class="gcash-qr"><a href="#" data-action="qr-open" aria-label="Open GCash QR code"><img src="assets/507cf655-5dac-4edb-8825-b17f17fda89e.jpg" alt="GCash payment QR code"></a><span>Scan to pay with GCash · Click to enlarge</span></div>' : ''}</form><div class="info-bar">${icon('shield')}<span>Sample fees only. Payment selection does not confirm payment or submit a request to the university.</span></div>`;
  }
  function renderReferral() {
    const fact = (label, value) => `<div class="referral-fact"><span>${label}</span><b>${e(value)}</b></div>`;
    const purpose = draft.purpose === 'Other' ? draft.customPurpose : draft.purpose;
    return `${heading('Please visit the Registrar.', 'Other documents are handled in person. The Registrar will guide you from here.', 3)}<div class="referral"><div class="referral-card"><h3>What you told us</h3><div class="referral-facts">${fact('DOCUMENT NEEDED', draft.otherDocument)}${fact('PURPOSE', purpose)}${draft.notes.trim() ? fact('NOTES', draft.notes.trim()) : ''}</div></div><div class="referral-card"><h3>What to do next</h3><ol class="referral-steps"><li>Go to the Office of the University Registrar.</li><li>Tell the staff which document you need and what it is for.</li><li>Bring your student ID.</li><li>The Registrar will confirm the requirements, fee, and processing time.</li></ol></div></div><div class="info-bar">${icon('info')}<span>Nothing is printed for this request. Fees and processing time for other documents are assessed by the Registrar.</span></div>`;
  }
  function renderPreview() {
    const stubOnly = generated.docId === 'other';
    return `${heading('One last look. All set for your next step.', stubOnly ? 'Review your payment / claim stub before printing.' : 'Review your sample document and claim stub before printing.', 4)}${generated.queueNo ? ISKO.queueBannerMarkup(ISKO.requests.get(generated.id) || generated) : ''}<div class="preview-toolbar"><span>${icon('circle-check')} Saved ${where} · ${stubOnly ? 'Claim stub' : 'Document + claim stub'}</span><span class="preview-reference">${e(generated.id)}</span></div><div class="document-preview" tabindex="0" aria-label="Document and claim stub preview">${ISKO.documentMarkup(generated)}</div><div class="info-bar">${icon('print')}<span>${K.directPrint ? (stubOnly ? 'Tap Print to send your claim stub to the printer. Present it at the issuing office or cashier.' : 'Tap Print to send the document and claim stub to the printer. Take every page with you when you leave.') : 'Print includes the document and stub together. Choose “Save as PDF” in the print dialog to keep a digital copy. Print one packet per requested copy if needed.'}</span></div>`;
  }
  function renderFooter() {
    const previous = step > 1 ? `<button class="button ghost" data-action="back">${icon('arrow-left')} Back</button>` : `<span class="footer-hint">${icon('lock')} Simple. Local. Student-first.</span>`;
    const next = step === 4 && registrarFlow() ? `<button class="button primary" data-action="nav-history">${icon('logout')} Finish</button>` : step === 4 ? `<div class="preview-actions"><button class="button secondary" data-action="finish-request">${icon('logout')} Finish</button><button class="button primary" data-action="print">${icon('print')} ${draft.docId === 'other' ? 'Print claim stub' : 'Print document & stub'}</button></div>` : `<button class="button primary" data-action="next">${step === 1 ? 'Continue to details' : step === 2 ? (registrarFlow() ? 'Continue' : 'Continue to payment') : 'Generate preview'} ${icon(step === 3 ? 'eye' : 'arrow-right')}</button>`;
    $('step-footer').innerHTML = previous + next;
  }
  function render() {
    renderStepper(); renderSummary();
    $('step-content').innerHTML = step === 1 ? renderDocuments() : step === 2 ? renderDetails() : step === 3 ? renderPayments() : registrarFlow() ? renderReferral() : renderPreview();
    renderFooter();
    if (step === 4 && !registrarFlow()) $('print-area').innerHTML = ISKO.documentMarkup(generated);
  }
  function validateDetails() {
    const form = $('details-form');
    if (!form) return true;
    if (!form.reportValidity()) return false;
    if (draft.purpose === 'Other' && !draft.customPurpose.trim()) { toast('Please describe the purpose of your request.', true); $('custom-purpose').focus(); return false; }
    if (draft.docId === 'other' && !draft.otherDocument.trim()) { toast('Please enter the document name.', true); $('other-document').focus(); return false; }
    return true;
  }
  function generate() {
    if (generated) return;
    const result = ISKO.createRequest({ ...draft, student: { ...student }, id: ISKO.requestId(), createdAt: new Date().toISOString() });
    generated = result.record;
    const persisted = result.persisted;
    updateHistoryCount();
    toast(persisted ? (generated.docId === 'cor' ? `Your Certificate of Registration is ready instantly.` : `Your request is saved ${where}. Your queue number is ${generated.queueNo}.`) : 'Browser storage is unavailable. Print now to keep your request.', !persisted);
  }
  function next() {
    if (step === 2 && !validateDetails()) return;
    if (step === 2 && registrarFlow()) { step = 4; render(); $('step-content').scrollTop = 0; return; }
    if (step === 3) {
      if (!$('payment-form').reportValidity()) return;
      if (draft.payment !== 'cash' && draft.reference.trim().length < 4) { toast('Enter a payment reference with at least 4 characters.', true); return; }
      generate();
    }
    step = Math.min(4, step + 1); render();
    $('step-content').scrollTop = 0;
  }
  function renderHistory() {
    if (historyDetail && generated) {
      const item = doc();
      $('history-content').innerHTML = `<div class="history-detail"><div class="history-detail-header"><div><span class="eyebrow">REQUEST DETAILS</span><h2>${e(generated.docId === 'other' ? generated.otherDocument : item.name)}</h2><p>${e(generated.id)} · ${new Date(generated.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p></div><button class="button secondary" data-action="nav-history">${icon('arrow-left')} Back to My requests</button></div><div class="history-detail-preview">${ISKO.documentMarkup(generated)}</div><div class="history-detail-actions"><button class="button secondary" data-action="nav-history">${icon('arrow-left')} Back to My requests</button><button class="button primary" data-action="print">${icon('print')} Print document & stub</button></div></div>`;
      return;
    }
    const records = requestHistory();
    if (!records.length) { $('history-content').innerHTML = `<div class="empty-state"><span class="doc-icon blue">${icon('folder')}</span><h2>Your next step starts here.</h2><p>Your saved requests will appear here once you generate a preview.</p><button class="button primary" data-action="nav-request">Request a document ${icon('arrow-right')}</button></div>`; return; }
    $('history-content').innerHTML = `<div class="history-card"><div class="history-toolbar"><h2>Saved ${where}</h2><span>${records.length} ${records.length === 1 ? 'request' : 'requests'}</span><button class="button secondary" data-action="notifications">${icon('message')} Email notifications</button></div>${records.map(record => { const item = ISKO.catalog.find(document => document.id === record.docId); return `<article class="request-record"><span class="doc-icon ${item.color}">${icon(item.icon)}</span><div class="record-main"><h3>${e(record.docId === 'other' ? record.otherDocument : item.name)} ${ISKO.statusBadge(record)}</h3><p>${e(record.id)} · ${new Date(record.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} · ${record.copies} ${record.copies === 1 ? 'copy' : 'copies'}${record.queueNo ? ` · Queue ${e(record.queueNo)}` : ''}</p></div><span class="record-price">${item.price === null ? 'For assessment' : ISKO.money(item.price * record.copies)}</span><button class="button primary" data-action="track-request" data-id="${e(record.id)}">${icon('clock')} Track</button><button class="button secondary" data-action="open-request" data-id="${e(record.id)}">${icon('eye')} View & print</button><button class="button danger" data-action="delete-request" data-id="${e(record.id)}">Delete</button></article>`; }).join('')}</div>`;
  }
  window.addEventListener('isko:requests-changed', () => {
    if (!student) return;
    updateHistoryCount();
    if (!$('history-view').hidden) renderHistory();
    else if (step === 4 && generated && !registrarFlow()) render();
  });
  function signOut() {
    if (student) {
      ISKO.store.remove(`draft.${student.studentId}`);
      if (!K.keepHistory) {
        const id = student.studentId.toLowerCase();
        ISKO.store.set('requests', ISKO.store.get('requests', []).filter(item => item.student.studentId.toLowerCase() !== id));
      }
    }
    ISKO.store.remove('student'); student = null; generated = null; draft = ISKO.defaultRequest(); step = 1;
    $('print-area').innerHTML = ''; $('step-content').innerHTML = ''; $('summary-content').innerHTML = '';
    if ($('info-dialog').open) $('info-dialog').close();
    $('app-view').hidden = true; $('login-view').hidden = false; $('login-form').reset(); window.scrollTo(0, 0);
  }
  ISKO.signOut = signOut; ISKO.isSignedIn = () => !!student;
  function showDialog(content) { $('dialog-content').innerHTML = content; $('info-dialog').showModal(); }
  document.addEventListener('click', event => {
    const actionElement = event.target.closest('[data-action]'); if (!actionElement) return;
    const action = actionElement.dataset.action;
    if (action === 'demo-login') {
      const account = ISKO.demoAccounts.find(profile => profile.studentId === actionElement.dataset.account);
      if (account) { setStudent({ ...account }); ISKO.notifySignIn(account); }
      return;
    }
    if (action === 'close-dialog') { $('info-dialog').close(); return; }
    if (action === 'qr-open') { event.preventDefault(); $('qr-dialog').showModal(); return; }
    if (action === 'qr-close') { $('qr-dialog').close(); return; }
    if (action === 'help') { showDialog(`<div class="dialog-title-icon">${icon('message')}</div><h2>A little guidance, a smoother day.</h2><p>Here’s how to use your ISKO workspace.</p><ol><li>Sign in using your name, student number, and degree program.</li><li>Choose a document, add the purpose and academic term, and select your payment option.</li><li>Generate a sample preview, then print the document and claim stub together.</li><li>Find saved previews in <strong>My requests</strong> whenever you need them.</li></ol><p>This offline demo has no connection to Bicol University. Fees are illustrative; payments, records, and university authentication are not processed. Contact the relevant university office for an official document.</p><button class="button primary" data-action="close-dialog">Got it ${icon('check')}</button>`); return; }
    if (!student) return;
    if (action === 'next') next();
    if (action === 'back') { step = step === 4 && registrarFlow() ? 2 : Math.max(1, step - 1); render(); }
    if (action === 'goto-step') { const target = Number(actionElement.dataset.step); if (target > 0 && target < step) { step = target; render(); } if (target === 0) document.querySelector('[data-action="profile"]').click(); }
    if (action === 'nav-request') { draft = ISKO.defaultRequest(); generated = null; step = 1; saveDraft(); navigate('request'); }
    if (action === 'nav-history') { historyDetail = false; navigate('history'); }
    if (action === 'finish-request') { if (generated?.docId === 'cor' && generated.status !== 'completed') ISKO.setStatus(generated.id, 'completed', 'System'); historyDetail = false; navigate('history'); }
    if (action === 'new-request') { historyDetail = false; draft = ISKO.defaultRequest(); step = 1; saveDraft(); navigate('request'); }
    if (action === 'increase-copies' || action === 'decrease-copies') { draft.copies = Math.max(1, Math.min(10, (Number(draft.copies) || 1) + (action === 'increase-copies' ? 1 : -1))); $('copies').value = draft.copies; saveDraft(); renderSummary(); }
    if (action === 'print') { $('print-area').innerHTML = ISKO.documentMarkup(generated); window.print(); if (K.directPrint) toast('Sent to the printer. Please collect your ' + (generated.docId === 'other' ? 'claim stub.' : 'document and claim stub.')); }
    if (action === 'open-request') { generated = requestHistory().find(record => record.id === actionElement.dataset.id); if (!generated) return; draft = { ...generated }; historyDetail = true; navigate('history'); }
    if (action === 'delete-request') { const record = requestHistory().find(item => item.id === actionElement.dataset.id); if (!record) return; if (window.confirm(`Delete ${record.id} from My requests?`)) { ISKO.requests.remove(record.id); if (generated?.id === record.id) generated = null; renderHistory(); updateHistoryCount(); } }
    if (action === 'profile') { showDialog(`<div class="dialog-title-icon">${icon('user')}</div><h2>Your student workspace.</h2><div class="profile-detail"><span>FULL NAME</span><b>${e(student.name)}</b></div><div class="profile-detail"><span>STUDENT NUMBER</span><b>${e(student.studentId)}</b></div><div class="profile-detail"><span>DEGREE PROGRAM</span><b>${e(student.course)}</b></div><p>${K.keepHistory ? 'Demo profile. Your requests remain on this device after signing out.' : 'Demo profile. Your requests and answers are cleared when you sign out.'}</p><button class="button secondary" data-action="sign-out">${icon('logout')} Sign out</button>`); }
    if (action === 'sign-out') signOut();
  });
  document.addEventListener('input', event => {
    if (!student) return;
    const target = event.target;
    if (target.closest('#details-form') || target.closest('#payment-form')) {
      if (target.name === 'copies') { draft.copies = Number(target.value); } else if (target.name) draft[target.name] = target.value;
      saveDraft(); renderSummary();
      if (target.name === 'purpose') { $('custom-purpose-wrap').hidden = target.value !== 'Other'; $('custom-purpose').required = target.value === 'Other'; }
    }
  });
  document.addEventListener('change', event => {
    if (!student) return;
    if (event.target.name === 'document') { draft.docId = event.target.value; saveDraft(); render(); }
    if (event.target.name === 'payment') { draft.payment = event.target.value; draft.reference = ''; saveDraft(); render(); }
    if (event.target.name === 'copies' && event.target.validity.valid) { draft.copies = Math.max(1, Math.min(10, Number(event.target.value))); saveDraft(); renderSummary(); }
  });
  document.addEventListener('submit', event => {
    event.preventDefault();
    if (event.target.id === 'login-form') {
      const form = new FormData(event.target);
      const profile = { name: form.get('name').trim(), studentId: form.get('studentId').trim(), course: form.get('course').trim(), email: form.get('email').trim() };
      if (!profile.name || !profile.course) { toast('Please enter your name and degree program.', true); return; }
      setStudent(profile); ISKO.notifySignIn(profile);
    } else if (event.target.id === 'details-form' || event.target.id === 'payment-form') next();
  });
  $('info-dialog').addEventListener('click', event => { if (event.target === $('info-dialog')) { const bounds = event.target.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.target.close(); } });
  $('qr-dialog').addEventListener('click', event => { if (event.target === $('qr-dialog')) $('qr-dialog').close(); });
  document.querySelector('.kiosk-bar .brand').addEventListener('click', event => { event.preventDefault(); if (student) navigate('request'); });
  $('year').textContent = new Date().getFullYear();
  renderDemoAccounts();
  hydrateIcons();
  if (student?.name && student?.studentId && student?.course) setStudent(student);
})();
