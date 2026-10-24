/* coach.js — Cliente del Coach IA. La API key NUNCA esta aqui:
   solo habla con tu Cloudflare Worker. El modelo propone acciones;
   el usuario confirma cada una. */
window.OR = window.OR || {};
OR.coach = (function () {
  async function ask(message) {
    const s = await OR.store.settings();
    const url = (s.coach && s.coach.workerUrl || '').replace(/\/$/, '');
    if (!url) throw new Error('CoachError: Worker URL no configurada');
    const tasks = await OR.store.tasks();
    const ctx = {
      areas: s.coach.allowAreas || [],
      pendientes: tasks.filter(t => t.status !== 'completada' && (s.coach.allowAreas || []).includes(t.area))
        .slice(0, 15).map(t => ({ title: t.title, area: t.area, priority: t.priority, status: t.status, id: t.id })),
      completadasHoy: tasks.filter(t => t.completedAt && t.completedAt.slice(0, 10) === OR.util.day()).length,
      modo: s.mode, casa: s.house,
    };
    const res = await fetch(url + '/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message.slice(0, 2000), context: ctx }),
    });
    if (!res.ok) throw new Error('Worker HTTP ' + res.status + ': ' + (await res.text()).slice(0, 200));
    const data = await res.json();
    const NL = String.fromCharCode(10);
    const html = String(data.reply || '').replace(new RegExp('```json[\\s\\S]*?```', 'g'), '').trim();
    let actions = [];
    try {
      const m = String(data.reply).match(/```json\s*([\s\S]*?)```/);
      if (m) actions = (JSON.parse(m[1]).actions || []).slice(0, 5)
        .filter(a => ['create-task', 'set-mode', 'postpone-task', 'complete-task'].includes(a.type));
    } catch (e) { /* sin acciones validas: solo texto */ }
    const label = { 'create-task': '+ Crear tarea: ', 'set-mode': 'Cambiar modo a ', 'postpone-task': 'Posponer: ', 'complete-task': 'Completar: ' };
    actions.forEach(a => a.label = (label[a.type] || a.type) + (a.title || a.mode || a.id || ''));
    const withBreaks = OR.util.esc(html).split(NL).join('<br/>');
    return { html: withBreaks, actions };
  }

  async function applyAction(a) {
    if (a.type === 'create-task') await OR.store.saveTask({ title: String(a.title).slice(0, 140), area: ['core','rgs','learning','home','free'].includes(a.area) ? a.area : 'core', priority: ['critica','alta','normal','baja'].includes(a.priority) ? a.priority : 'normal' });
    else if (a.type === 'set-mode') await OR.engine.setMode(['normal','high','min'].includes(a.mode) ? a.mode : 'normal');
    else if (a.type === 'postpone-task') await OR.store.saveTask({ id: a.id, due: OR.util.addDays(OR.util.day(), 1), status: 'pospuesta' });
    else if (a.type === 'complete-task') await OR.store.setStatus(a.id, 'completada');
  }
  return { ask, applyAction };
})();