window.ISKO = window.ISKO || {};
ISKO.demoAccounts = [
  { name: 'Iska Dela Cruz', studentId: '2024-01012', course: 'BS Information Technology', email: 'iska.delacruz@example.com' },
  { name: 'Juan Santos', studentId: '2023-02045', course: 'BS Civil Engineering', email: 'juan.santos@example.com' },
  { name: 'Maria Reyes', studentId: '2025-03078', course: 'BS Nursing', email: 'maria.reyes@example.com' }
];
ISKO.catalog = [
  { id: 'cor', short: 'COR', name: 'Certificate of Registration', description: 'Your official record of subjects and enrollment.', price: 50, days: 'Instant', icon: 'registration', color: 'blue', tag: 'INSTANT' },
  { id: 'cog', short: 'COG', name: 'Certificate of Grades', description: 'A summary of your grades for an academic term.', price: 50, days: '2–3 working days', icon: 'chart', color: 'purple' },
  { id: 'moral', short: 'Good Moral', name: 'Certificate of Good Moral', description: 'A certification of your character and conduct.', price: 75, days: '2–3 working days', icon: 'shield-check', color: 'green' },
  { id: 'tor', short: 'TOR', name: 'Transcript of Records', description: 'Your complete academic record, all in one place.', price: 150, days: '5–7 working days', icon: 'graduation', color: 'orange' },
  { id: 'enrollment', short: 'Enrollment', name: 'Certificate of Enrollment', description: 'A certification of your current student status.', price: 50, days: '1–2 working days', icon: 'building', color: 'cyan' },
  { id: 'other', short: 'Other document', name: 'Other Document', description: 'Something else? Tell us what document you need.', price: null, days: 'Subject to assessment', icon: 'file-plus', color: 'slate' }
];
ISKO.steps = ['Student login', 'Choose document', 'Enter details', 'Payment option', 'Preview & print'];
ISKO.purposes = ['Scholarship application', 'Employment requirement', 'Further studies', 'Transfer to another school', 'Personal copy', 'Other'];
ISKO.terms = ['1st Semester', '2nd Semester', 'Summer / Midyear'];
ISKO.payments = [
  { id: 'cash', name: 'Cash at cashier', description: 'Pay in person at the university cashier.', icon: 'wallet' },
  { id: 'gcash', name: 'GCash', description: 'Record a GCash payment for verification.', icon: 'phone' },
  { id: 'paid', name: 'Already paid', description: 'Add your existing receipt or payment reference.', icon: 'circle-check' }
];
ISKO.icons = {
  'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>', 'arrow-left': '<path d="M20 12H4m6-6-6 6 6 6"/>', 'arrow-up-right': '<path d="M6 18 18 6M6 6h12v12"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  folder: '<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="M3 10h18"/>',
  message: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 10 10 0 0 1-4-.9L3 21l1.9-5.5a10 10 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z"/><path d="M8 11h8m-8 4h5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4m0 3h.01"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>', sparkles: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/><path d="m20 2 .5 1.5L22 4l-1.5.5L20 6l-.5-1.5L18 4l1.5-.5Z"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
  'shield-check': '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  documents: '<path d="M8 3h7l5 5v13H8Z"/><path d="M15 3v6h5M4 7v14M11 13h6m-6 4h6"/>',
  receipt: '<path d="M5 3 8 5l4-2 4 2 3-2v18l-3-2-4 2-4-2-3 2Z"/><path d="M8 9h8m-8 4h8m-8 4h4"/>',
  registration: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h3m3 0h2M8 18h3m3 0h2"/>',
  chart: '<path d="M14 3H5v18h14V8Z"/><path d="M14 3v6h5M8 17v-3m4 3v-6m4 6v-4"/>',
  graduation: '<path d="m2 9 10-5 10 5-10 5Z"/><path d="M6 11v6c4 3 8 3 12 0v-6m4-2v7"/>',
  building: '<path d="m3 9 9-6 9 6ZM3 21h18M6 10v8m6-8v8m6-8v8"/>',
  'file-plus': '<path d="M14 3H5v18h14V8Z"/><path d="M14 3v6h5m-7 2v6m-3-3h6"/>',
  check: '<path d="m5 12 4 4L19 6"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  wallet: '<path d="M20 8V5H5a2 2 0 0 0-2 2v12h18V8H5a1 1 0 0 1 0-2"/><path d="M21 11h-6v5h6m-3-2.5h.01"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4m-2 13h.01"/>',
  'circle-check': '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  print: '<path d="M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v7H6Z"/><path d="M17 11h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>', logout: '<path d="M9 3H4v18h5m4-5 4-4-4-4m-5 4h13"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>', trash: '<path d="M4 7h16m-10 4v6m4-6v6M9 7V4h6v3m-9 0 1 13h10l1-13"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>'
};
ISKO.icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ISKO.icons[name] || ISKO.icons.documents}</svg>`;
ISKO.escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
ISKO.money = value => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
