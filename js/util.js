/* util.js — Fechas, ids, escape, formato (zona horaria configurable) */
window.OR = window.OR || {};
OR.util = (function () {
  let TZ = 'America/Mexico_City';
  const setTZ = tz => { TZ = tz || TZ; };
  const getTZ = () => TZ;
  /* Fecha local en TZ como YYYY-MM-DD */
  function day(d = new Date()) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  }
  function addDays(dateStr, n) {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return day(d);
  }
  function diffDays(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); }
  function weekday(dateStr) { /* 0=domingo */
    return new Date(dateStr + 'T12:00:00').getDay();
  }
  function pretty(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const debouncedSync = debounce(() => OR.sync && OR.sync.flush(), 1500);
  return { setTZ, getTZ, day, addDays, diffDays, weekday, pretty, uid, esc, debounce, debouncedSync };
})();
