/* ============================================================
   recurrence.js — Motor de recurrencia de rutinas.
   Reglas: daily | weekdays (días concretos) | interval (cada N días).
   Reglas independientes por casa. Posponer ≠ editar plantilla.
   Sin generación masiva de ocurrencias futuras: se crean bajo demanda.
   ============================================================ */
window.OR = window.OR || {};

OR.recurrence = (function () {
  /* ¿debe ocurrir la rutina `r` en la fecha `dateStr`? */
  function dueOn(r, dateStr) {
    if (!r.active) return false;
    if (r.pausedUntil && dateStr <= r.pausedUntil) return false;
    const start = r.startDate || dateStr;
    if (dateStr < start) return false;
    const rec = r.recurrence || { type: 'daily' };
    switch (rec.type) {
      case 'daily': return true;
      case 'weekdays': return (rec.days || []).includes(OR.util.weekday(dateStr));
      case 'interval': {
        const n = Math.max(1, rec.everyN || 2);
        return OR.util.diffDays(start, dateStr) % n === 0;
      }
      default: return false;
    }
  }

  /* Crea la ocurrencia del día si la rutina es debida y no existe (anti-duplicados). */
  async function ensure(r, dateStr) {
    if (!dueOn(r, dateStr)) return null;
    const id = r.id + ':' + dateStr;
    const existing = await OR.db.get('occurrences', id);
    if (existing) return existing;
    const occ = { id, routineId: r.id, date: dateStr, status: 'pending', createdAt: new Date().toISOString() };
    try { return await OR.db.put('occurrences', occ); }
    catch (e) { return await OR.db.get('occurrences', id); } // race entre pestañas: reusar
  }

  /* Ocurrencias de un día (para el dashboard/rutinas) */
  async function forDate(dateStr) {
    const routines = await OR.db.all('routines');
    const out = [];
    for (const r of routines) {
      const occ = await ensure(r, dateStr);
      if (occ) out.push({ ...occ, routine: r });
    }
    return out;
  }

  /* Marcar o desmarcar una rutina (Toggle) */
  async function complete(id) {
    const occ = await OR.db.get('occurrences', id);
    if (!occ) return occ;
    
    if (occ.status === 'done') {
      // Si ya estaba hecha, la regresamos a pendiente
      occ.status = 'pending';
      occ.doneAt = null;
    } else {
      // Si estaba pendiente, la marcamos como hecha y otorgamos XP
      occ.status = 'done';
      occ.doneAt = new Date().toISOString();
      await OR.gamification.onOccurrenceDone(occ);
    }
    
    await OR.db.put('occurrences', occ);
    return occ;
  }

  /* Posponer: mueve esta ocurrencia al día siguiente sin tocar la plantilla */
  async function postpone(id) {
    const occ = await OR.db.get('occurrences', id);
    if (!occ) return;
    occ.status = 'postponed';
    await OR.db.put('occurrences', occ);
    const nextDay = OR.util.addDays(occ.date, 1);
    const r = await OR.db.get('routines', occ.routineId);
    if (r) await ensure(r, nextDay); // la del mañana surge sola si toca
  }

  async function skip(id, reason) {
    const occ = await OR.db.get('occurrences', id);
    if (!occ) return;
    occ.status = 'skipped'; occ.skipReason = reason || '';
    await OR.db.put('occurrences', occ);
  }

  /* Historial de cumplimiento de una rutina (últimos N días) */
  async function history(routineId, days) {
    const today = OR.util.day();
    const from = OR.util.addDays(today, -(days - 1));
    const all = await OR.db.query('occurrences', o => o.routineId === routineId && o.date >= from);
    const map = Object.fromEntries(all.map(o => [o.date, o.status]));
    const out = [];
    for (let d = from; d <= today; d = OR.util.addDays(d, 1)) out.push({ date: d, status: map[d] || (dueOn(await OR.db.get('routines', routineId), d) ? 'pending' : 'off') });
    return out;
  }

  return { dueOn, ensure, forDate, complete, postpone, skip, history };
})();