/* ============================================================
   store.js — Capa de datos pública de OpenRutine.
   Toda la app lee/escribe SOLO aquí (sobre IndexedDB).
   Añadir persistencia a una entidad nueva = función aquí + store.
   ============================================================ */
window.OR = window.OR || {};

OR.store = (function () {
  const U = OR.util;

  /* ---------- Ajustes / perfil ---------- */
  const DEFAULT_SETTINGS = {
    theme: 'dark', accent: '#8B5CF6', motion: 'auto', density: 'comfortable', textSize: 'normal',
    house: 'padre', wakeTime: '06:30', tz: 'America/Mexico_City', mode: 'normal',
    name: '', onboarded: false, demo: false,
    coach: { enabled: false, allowAreas: ['core','rgs','learning'], workerUrl: '' },
    widgets: ['next','mission','habits','rgs','learning','home','activity','streak'],
    hierarchy: ['obligaciones','cuidado','rgs','academico','hogar','opcional','descanso'],
  };
  async function settings() { return { ...DEFAULT_SETTINGS, ...(await OR.db.kvGet('settings', {})) }; }
  async function saveSettings(patch) {
    const s = { ...(await settings()), ...patch };
    await OR.db.kvSet('settings', s);
    OR.util.setTZ(s.tz);
    applyTheme(s);
    OR.util.debouncedSync();
    return s;
  }
  function applyTheme(s) {
    const theme = s.theme === 'system'
      ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : s.theme;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.motion = s.motion === 'reduce' ? 'off' : 'on';
    document.documentElement.dataset.density = s.density;
    document.documentElement.dataset.text = s.textSize;
    document.documentElement.style.setProperty('--accent', s.accent);
  }

  /* ---------- Tareas ---------- */
  const TASK_STATUSES = ['pendiente','en-curso','completada','pospuesta','bloqueada'];
  const PRIORITIES = ['critica','alta','normal','baja'];

  async function tasks() { return (await OR.db.all('tasks')).sort((a, b) => (a.status==='completada') - (b.status==='completada') || b.createdAt.localeCompare(a.createdAt)); }
  async function getTask(id) { return OR.db.get('tasks', id); }

  async function saveTask(t) {
    const now = new Date().toISOString();
    const prev = t.id ? await getTask(t.id) : null;
    const task = {
      subtasks: [], tags: [], status: 'pendiente', priority: 'normal', area: 'core',
      ...prev, ...t,
      id: t.id || U.uid(),
      updatedAt: now,
      createdAt: prev ? prev.createdAt : now,
      completedAt: t.status === 'completada' ? (prev && prev.completedAt || now) : null,
    };
    await OR.db.put('tasks', task);
    OR.util.debouncedSync();
    return task;
  }
  async function deleteTask(id) { await OR.db.del('tasks', id); OR.util.debouncedSync(); }

  async function setStatus(id, status) {
    const t = await getTask(id);
    if (!t) return;
    t.status = status;
    await saveTask(t);
    if (status === 'completada') await OR.gamification.onTaskCompleted(t);
    return t;
  }

  /* ---------- Rutinas ---------- */
  async function routines() { return OR.db.all('routines'); }
  async function saveRoutine(r) {
    const prev = r.id ? await OR.db.get('routines', r.id) : null;
    const routine = { active: true, recurrence: { type: 'daily' }, area: 'core', ...prev, ...r, id: r.id || U.uid(), updatedAt: new Date().toISOString() };
    if (!routine.startDate) routine.startDate = U.day();
    await OR.db.put('routines', routine);
    OR.util.debouncedSync();
    return routine;
  }
  async function deleteRoutine(id) {
    await OR.db.del('routines', id);
    const occs = await OR.db.query('occurrences', o => o.routineId === id);
    for (const o of occs) await OR.db.del('occurrences', o.id);
  }

  /* ---------- Resultados profesionales (RGS Labs) ---------- */
  async function results() { return (await OR.db.all('results')).sort((a,b)=>b.date.localeCompare(a.date)); }
  async function saveResult(r) {
    const res = { date: U.day(), ...r, id: r.id || U.uid() };
    await OR.db.put('results', res);
    await OR.gamification.onResultRegistered(res);
    OR.util.debouncedSync();
    return res;
  }
  async function deleteResult(id) { return OR.db.del('results', id); }

  /* ---------- Académico ---------- */
  async function academic() { return OR.db.all('academic'); }
  async function saveAcademic(a) {
    const rec = { confidence: 'media', status: 'explorando', ...a, id: a.id || U.uid(), updatedAt: new Date().toISOString() };
    await OR.db.put('academic', rec);
    OR.util.debouncedSync();
    return rec;
  }
  async function deleteAcademic(id) { return OR.db.del('academic', id); }

  /* ---------- Logros / XP (persistidos por gamification) ---------- */
  async function kv(k, fb) { return OR.db.kvGet(k, fb); }
  async function kvSet(k, v) { return OR.db.kvSet(k, v); }

  return {
    DEFAULT_SETTINGS, settings, saveSettings, applyTheme,
    tasks, getTask, saveTask, deleteTask, setStatus, TASK_STATUSES, PRIORITIES,
    routines, saveRoutine, deleteRoutine,
    results, saveResult, deleteResult,
    academic, saveAcademic, deleteAcademic,
    kv, kvSet,
  };
})();
