(() => {
  const memory = {};
  let persistent = true;
  ISKO.store = {
    get(key, fallback = null) {
      try { return JSON.parse(localStorage.getItem(`isko.${key}`) || 'null') ?? fallback; }
      catch { persistent = false; return memory[key] ?? fallback; }
    },
    set(key, value) {
      memory[key] = value;
      try { localStorage.setItem(`isko.${key}`, JSON.stringify(value)); return true; }
      catch { persistent = false; return false; }
    },
    remove(key) { delete memory[key]; try { localStorage.removeItem(`isko.${key}`); } catch { persistent = false; } },
    get persistent() { return persistent; }
  };
  ISKO.defaultRequest = () => ({ docId: 'cor', purpose: '', customPurpose: '', year: '2026–2027', term: '1st Semester', copies: 1, otherDocument: '', payment: 'cash', reference: '', notes: '' });
  ISKO.requestId = () => `ISK-${new Date().getFullYear()}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 6).toUpperCase()}`;
})();
