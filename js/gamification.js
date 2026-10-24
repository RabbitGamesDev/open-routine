/* ============================================================
   gamification.js — XP discreto, logros con condiciones reales
   y rachas flexibles (nunca una racha global única).
   Descanso, comida, sueño e higiene NUNCA dependen de puntos.
   ============================================================ */
window.OR = window.OR || {};

OR.gamification = (function () {
  const XP = { small: 5, habit: 8, mission: 25, result: 40, academic: 20 };

  const DEFS = [
    { id: 'first-step',    name: 'Primer paso',            desc: 'Completaste tu primera tarea',                 icon: 'footprints', xp: 10 },
    { id: 'first-mission', name: 'Primera misión',         desc: 'Completaste tu primera misión principal (RGS)', icon: 'target', xp: 30 },
    { id: 'week-one',      name: 'Primera semana',         desc: 'Usaste OpenRutine 7 días',                      icon: 'calendar-check', xp: 50 },
    { id: 'first-result',  name: 'Resultado verificado',   desc: 'Registraste tu primer resultado profesional',   icon: 'badge-check', xp: 40 },
    { id: 'dataforge',     name: 'DataForge mejora',       desc: 'Primera mejora verificable de DataForge CLI',   icon: 'terminal', xp: 40 },
    { id: 'first-career',  name: 'Carrera investigada',    desc: 'Añadiste tu primera carrera al módulo académico', icon: 'graduation-cap', xp: 20 },
    { id: 'comeback',      name: 'De vuelta',              desc: 'Retomaste una rutina tras una interrupción',     icon: 'rotate-ccw', xp: 15 },
    { id: 'backup',        name: 'Respaldo seguro',        desc: 'Exportaste una copia de seguridad',              icon: 'shield-check', xp: 10 },
  ];
  const byId = id => DEFS.find(d => d.id === id);

  async function addXP(amount, reason) {
    const cur = (await OR.store.kv('xp', { total: 0, log: [] })) || { total: 0, log: [] };
    cur.total = (cur.total || 0) + amount;
    cur.log = cur.log || [];
    cur.log.push({ amount, reason, at: new Date().toISOString() });
    await OR.store.kvSet('xp', cur);
    return cur;
  }
  const xp = async () => (await OR.store.kv('xp', { total: 0, log: [] })) || { total: 0, log: [] };

  async function unlock(id) {
    const ach = (await OR.store.kv('achievements', {})) || {};
    if (ach[id]) return null;
    const def = byId(id);
    if (!def) return null;
    ach[id] = { unlockedAt: new Date().toISOString(), seen: false };
    await OR.store.kvSet('achievements', ach);
    await addXP(def.xp, 'Logro: ' + def.name);
    return def;
  }
  const achievements = async () => (await OR.store.kv('achievements', {})) || {};

  /* Rachas por tipo, flexibles: se pausan, no se borran, en modos high/min */
  async function bumpStreak(type) {
    const today = OR.util.day();
    const streaks = (await OR.store.kv('streaks', {})) || {};
    const st = streaks[type] || { count: 0, lastDate: null };
    if (st.lastDate === today) return st;
    st.count = OR.util.diffDays(st.lastDate || today, today) === 1 ? st.count + 1 : 1;
    st.lastDate = today;
    streaks[type] = st;
    await OR.store.kvSet('streaks', streaks);
    // Días de uso del sistema (para logro week-one)
    const days = await usageDays();
    if (days.size >= 7) await unlock('week-one');
    return st;
  }
  async function usageDays() {
    const log = (await OR.store.kv('usage', { days: [] })) || { days: [] };
    log.days = log.days || [];
    const today = OR.util.day();
    if (!log.days.includes(today)) {
      log.days.push(today);
      if (log.days.length > 400) log.days = log.days.slice(-400);
      await OR.store.kvSet('usage', log);
    }
    return new Set(log.days);
  }

  /* --- Handlers disparados por el store --- */
  async function onTaskCompleted(task) {
    const isMission = task.area === 'rgs' && ['critica','alta'].includes(task.priority);
    await addXP(isMission ? XP.mission : XP.small, task.title);
    if (isMission) await unlock('first-mission');
    const tasks = (await OR.store.tasks()) || [];
    if (tasks.some(t => t.completedAt)) await unlock('first-step');
    await bumpStreak('system');
    if (task.area === 'rgs') await bumpStreak('rgs');
    if (task.area === 'learning') await bumpStreak('learning');
  }
  async function onOccurrenceDone(occ) {
    await addXP(XP.habit, 'Hábito cumplido');
    const r = await OR.db.get('routines', occ.routineId);
    if (r && r.streakType) await bumpStreak(r.streakType);
    // ¿venía de una interrupción? → logro comeback
    const hist = (await OR.recurrence.history(occ.routineId, 7)) || [];
    const missed = hist.filter(h => h.status === 'skipped' || h.status === 'postponed').length;
    if (missed >= 1) await unlock('comeback');
  }
  async function onResultRegistered(res) {
    await addXP(XP.result, 'Resultado: ' + res.title);
    await unlock('first-result');
    if ((res.project || '').toLowerCase().includes('dataforge')) await unlock('dataforge');
  }

  async function grantReward(cost, label) {
    const cur = await xp();
    if ((cur.total || 0) < cost) return false;
    cur.total = (cur.total || 0) - cost;
    cur.log = cur.log || [];
    cur.log.push({ amount: -cost, reason: 'Recompensa: ' + label, at: new Date().toISOString() });
    await OR.store.kvSet('xp', cur);
    return true;
  }

  return { XP, DEFS, addXP, xp, unlock, achievements, bumpStreak, usageDays,
    onTaskCompleted, onOccurrenceDone, onResultRegistered, grantReward };
})();