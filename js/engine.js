/* ============================================================
   engine.js — Motor de prioridades y modos del día.
   La jerarquía es configurable en Ajustes; el motor RECOMIENDA,
   nunca bloquea. Sin cuotas de horas ni agenda militar.
   ============================================================ */
window.OR = window.OR || {};

OR.engine = (function () {
  const AREA_WEIGHT = { core: 3, rgs: 4, learning: 3, home: 3, free: 0 };
  const PRIO_WEIGHT = { critica: 40, alta: 25, normal: 12, baja: 5 };
  const STATUS_PENALTY = { 'en-curso': 8, bloqueada: -15, pospuesta: 0 };

  /* Puntuación transparente y explicable */
  function score(task, s) {
    let pts = PRIO_WEIGHT[task.priority] ?? 10;
    pts += AREA_WEIGHT[task.area] ?? 1;
    if (task.due) {
      const d = OR.util.diffDays(OR.util.day(), task.due);
      if (d < 0) pts += 30;            // vencida
      else if (d === 0) pts += 20;     // vence hoy
      else if (d === 1) pts += 8;
    }
    pts += STATUS_PENALTY[task.status] ?? 0;
    if (task.status === 'bloqueada') pts = Math.min(pts, 3);
    // La jerarquía del usuario reordena el peso por área
    const hier = s.hierarchy || [];
    const idx = hierArea => hier.indexOf(hierArea);
    const areaKey = { core: 'cuidado', rgs: 'rgs', learning: 'academico', home: 'hogar', free: 'descanso' }[task.area];
    if (areaKey && hier.includes(areaKey)) pts += (hier.length - idx(areaKey)) * 2;
    return pts;
  }

  function recommend(tasks, s) {
    const open = tasks.filter(t => !['completada'].includes(t.status));
    return open.sort((a, b) => score(b, s) - score(a, s));
  }

  /* ---------- Modos del día ---------- */
  const MODES = {
    normal: {
      label: 'Modo normal', icon: 'sun',
      desc: 'Día con margen: rutinas + una misión RGS + un avance académico.',
      maxSuggestions: 4,
      filter: t => true,
    },
    high: {
      label: 'Alta demanda', icon: 'zap',
      desc: 'Obligaciones extensas: solo lo esencial sobrevive al día.',
      maxSuggestions: 2,
      filter: t => ['critica','alta'].includes(t.priority) || t.area === 'core' || t.area === 'home',
    },
    min: {
      label: 'Modo mínimo', icon: 'battery-low',
      desc: 'Día de baja energía: lo imprescindible y descanso sin culpa.',
      maxSuggestions: 1,
      filter: t => t.priority === 'critica' || (t.area === 'core' && ['critica','alta'].includes(t.priority)),
    },
  };

  async function suggestions() {
    const s = await OR.store.settings();
    const mode = MODES[s.mode] || MODES.normal;
    const all = await OR.store.tasks();
    const rec = recommend(all, s).filter(mode.filter).slice(0, mode.maxSuggestions);
    return { mode, rec, total: all.filter(t => t.status !== 'completada').length };
  }

  async function setMode(mode) {
    if (!MODES[mode]) return;
    await OR.store.saveSettings({ mode });
  }

  /* Próximo compromiso: tarea abierta con fecha límite más cercana */
  async function nextCommitment() {
    const all = await OR.store.tasks();
    return all
      .filter(t => t.status !== 'completada' && t.due)
      .sort((a, b) => a.due.localeCompare(b.due))[0] || null;
  }

  return { score, recommend, suggestions, setMode, MODES, nextCommitment };
})();
