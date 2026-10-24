/* views.js — Las nueve vistas de OpenRutine. Cada una pinta en #view. */
window.OR = window.OR || {};
OR.views = {};
(function () {
  const esc = s => OR.util.esc(s);
  const ic = (n, c) => OR.ui.icon(n, c);
  const AREAS = [['core','CORE'],['rgs','RGS Labs'],['learning','Learning'],['home','Home'],['free','Free Time']];
  const areaChip = a => `<span class="chip chip-p area-${a}">${(AREAS.find(x=>x[0]===a)||['','?'])[1]}</span>`;

  /* ============ MODAL COMPARTIDO: TAREA ============ */
  OR.views.taskModal = async function (existing) {
    const t = existing || { subtasks: [], tags: [], area: 'core', priority: 'normal', status: 'pendiente' };
    const sub = (t.subtasks || []);
    const panel = OR.ui.modal(`
      <h3 class="bold" style="font-size:1.1rem">${existing ? 'Editar' : 'Nueva'} tarea</h3>
      <label class="fld">Titulo</label><input id="t-title" class="input" value="${esc(t.title||'')}"/>
      <label class="fld">Descripcion</label><textarea id="t-desc" class="input" rows="2">${esc(t.desc||'')}</textarea>
      <div class="grid g2 mt1">
        <div><label class="fld">Area</label><select id="t-area" class="input">${AREAS.map(([v,l])=>`<option value="${v}" ${t.area===v?'selected':''}>${l}</option>`).join('')}</select></div>
        <div><label class="fld">Proyecto</label><input id="t-proj" class="input" value="${esc(t.project||'')}" placeholder="DataForge CLI…"/></div>
        <div><label class="fld">Prioridad</label><select id="t-prio" class="input">${(OR.store.PRIORITIES || ['normal']).map(p=>`<option ${t.priority===p?'selected':''}>${p}</option>`).join('')}</select></div>
        <div><label class="fld">Estado</label><select id="t-status" class="input">${(OR.store.TASK_STATUSES || ['pendiente']).map(s=>`<option ${t.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div><label class="fld">Fecha limite</label><input id="t-due" type="date" class="input" value="${t.due||''}"/></div>
        <div><label class="fld">Estimacion (min)</label><input id="t-est" type="number" class="input" value="${t.estimateMin||''}"/></div>
      </div>
      <label class="fld">Etiquetas (coma)</label><input id="t-tags" class="input" value="${esc((t.tags||[]).join(', '))}"/>
      <label class="fld">Subtareas (una por linea, "- " si esta hecha)</label>
      <textarea id="t-subs" class="input" rows="3">${sub.map(s=>(s.done?'- ':'')+s.title).join('\n')}</textarea>
      <label class="fld">Evidencia / enlace de resultado</label><input id="t-ev" class="input" value="${esc(t.evidence||'')}" placeholder="https://github.com/…"/>
      <label class="fld">Notas</label><textarea id="t-notes" class="input" rows="2">${esc(t.notes||'')}</textarea>
      <div class="row mt3" style="justify-content:flex-end;gap:.5rem">
        ${existing ? '<button class="btn btn-d" id="t-del">Eliminar</button>' : ''}
        <button class="btn btn-s" onclick="OR.ui.close()">Cancelar</button>
        <button class="btn btn-p" id="t-save">Guardar</button>
      </div>`);
    panel.querySelector('#t-save').onclick = async () => {
      const title = panel.querySelector('#t-title').value.trim();
      if (!title) return OR.errors.show('La tarea necesita un titulo.', new Error('ValidationError: empty title'));
      const subtasks = panel.querySelector('#t-subs').value.split('\n').map(l=>l.trim()).filter(Boolean)
        .map(l => l.startsWith('- ') ? { title: l.slice(2), done: true } : { title: l, done: false });
      const prevStatus = existing ? existing.status : 'pendiente';
      const saved = await OR.store.saveTask({ ...existing, title,
        desc: panel.querySelector('#t-desc').value, area: panel.querySelector('#t-area').value,
        project: panel.querySelector('#t-proj').value.trim(), priority: panel.querySelector('#t-prio').value,
        status: panel.querySelector('#t-status').value, due: panel.querySelector('#t-due').value || null,
        estimateMin: +panel.querySelector('#t-est').value || null,
        tags: panel.querySelector('#t-tags').value.split(',').map(x=>x.trim()).filter(Boolean),
        subtasks, evidence: panel.querySelector('#t-ev').value.trim(), notes: panel.querySelector('#t-notes').value });
      if (saved.status === 'completada' && prevStatus !== 'completada') await OR.gamification.onTaskCompleted(saved);
      OR.ui.close(); OR.ui.toast('Tarea guardada'); OR.router.refresh();
    };
    const del = panel.querySelector('#t-del');
    if (del) del.onclick = async () => {
      if (await OR.ui.confirm('Se eliminara la tarea y sus subtareas. Esta accion no se puede deshacer.', { danger: true, label: 'Eliminar' })) {
        await OR.store.deleteTask(existing.id); OR.ui.close(); OR.ui.toast('Tarea eliminada'); OR.router.refresh();
      }
    };
  };

  /* ============ MODAL COMPARTIDO: RESULTADO RGS ============ */
  OR.views.resultModal = function (presetProject) {
    const panel = OR.ui.modal(`
      <h3 class="bold" style="font-size:1.1rem">Registrar resultado verificable</h3>
      <div class="grid g2 mt1">
        <div><label class="fld">Proyecto</label><select id="r-proj" class="input">
          <option ${presetProject==='DataForge CLI'?'selected':''}>DataForge CLI</option>
          <option ${presetProject==='KlueCRM'?'selected':''}>KlueCRM</option></select></div>
        <div><label class="fld">Que se entrego</label><input id="r-title" class="input" placeholder="Comando export v0.2"/></div>
      </div>
      <label class="fld">Que cambio / que se hizo</label><textarea id="r-changed" class="input" rows="2"></textarea>
      <label class="fld">Que falta</label><input id="r-missing" class="input"/>
      <div class="grid g2"><div><label class="fld">Enlace GitHub</label><input id="r-gh" class="input" placeholder="https://…"/></div>
      <div><label class="fld">Enlace publicacion</label><input id="r-pub" class="input"/></div></div>
      <div class="row mt3" style="justify-content:flex-end;gap:.5rem">
        <button class="btn btn-s" onclick="OR.ui.close()">Cancelar</button>
        <button class="btn btn-p" id="r-save">Registrar</button></div>`);
    panel.querySelector('#r-save').onclick = async () => {
      const title = panel.querySelector('#r-title').value.trim();
      if (!title) return OR.errors.show('Describe que entregaste.', new Error('ValidationError: empty result'));
      await OR.store.saveResult({ project: panel.querySelector('#r-proj').value, title,
        whatChanged: panel.querySelector('#r-changed').value, missing: panel.querySelector('#r-missing').value,
        githubUrl: panel.querySelector('#r-gh').value.trim(), publishedUrl: panel.querySelector('#r-pub').value.trim() });
      OR.ui.close(); OR.ui.toast('Resultado registrado'); OR.router.refresh();
    };
  };

  /* ============ INICIO ============ */
  OR.views.inicio = async function (view) {
    const s = (await OR.store.settings()) || {};
    const today = OR.util.day();
    const { mode, rec } = (await OR.engine.suggestions()) || { mode: { icon: 'check', desc: '' }, rec: [] };
    const occ = (await OR.recurrence.forDate(today)) || [];
    const tasks = (await OR.store.tasks()) || [];
    const open = tasks.filter(t => t.status !== 'completada');
    const results = (await OR.store.results()) || [];
    const acad = (await OR.store.academic()) || [];
    const streaks = (await OR.store.kv('streaks', {})) || {};
    const next = await OR.engine.nextCommitment();
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Buenos dias' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
    const modes = [['normal','Normal'],['high','Alta demanda'],['min','Minimo']];

    view.innerHTML = `
    <section class="v-enter" style="display:grid;gap:1rem">
      <div class="row between wrap">
        <div><p class="muted small">${OR.util.pretty(today)} · Casa: ${esc(s.house || '')}</p>
          <h2 style="font-size:1.6rem;font-weight:800;letter-spacing:-.02em">${greet}${s.name ? ', ' + esc(s.name) : ''}</h2></div>
        <div class="seg" role="group" aria-label="Modo del dia">${modes.map(([v,l]) =>
          `<button class="${s.mode===v?'on':''}" onclick="OR.engine.setMode('${v}').then(()=>OR.router.refresh())">${l}</button>`).join('')}</div>
      </div>
      <p class="small muted mode-${s.mode || 'normal'}" style="display:flex;gap:.4rem;align-items:center">${ic(mode?.icon || 'check')} ${mode?.desc || ''}</p>

      ${rec && rec[0] ? `<div class="card card-h v-enter-2" style="border-color:color-mix(in srgb,var(--accent) 45%,var(--border))">
        <div class="row between wrap">
          <div class="row"><span style="width:38px;height:38px;border-radius:12px;background:color-mix(in srgb,var(--accent) 18%,transparent);display:grid;place-items:center;color:var(--accent-2)">${ic('target')}</span>
            <div><p class="small muted">Siguiente accion recomendada</p><p class="bold">${esc(rec[0].title)}</p></div></div>
          <div class="row wrap">
            ${areaChip(rec[0].area)}<span class="chip">${rec[0].priority}</span>
            <button class="btn btn-p" onclick="OR.store.setStatus('${rec[0].id}','completada').then(()=>OR.router.refresh())">${ic('check')} Completar</button>
          </div></div></div>` :
        OR.ui.empty('party-popper','Todo en orden','No hay tareas abiertas. Descansa o planifica algo nuevo.')}

      ${rec && rec.length > 1 ? `<div class="card v-enter-3"><p class="small bold muted mb2">TAMBIEN HOY</p>
        ${rec.slice(1).map(t=>`<div class="row" style="padding:.5rem 0;border-top:1px solid var(--border)">
          <div class="tcheck ${t.status==='completada'?'done':''}" onclick="OR.store.setStatus('${t.id}','completada').then(()=>OR.router.refresh())"></div>
          <span class="small" style="flex:1">${esc(t.title)}</span>${areaChip(t.area)}</div>`).join('')}</div>` : ''}

      <div class="row wrap" style="gap:.5rem">
        <button class="btn btn-s" onclick="OR.views.taskModal()">${ic('plus')} Tarea</button>
        <button class="btn btn-s" onclick="OR.views.taskModal({area:'home',priority:'critica',title:'Encargo urgente: '})">${ic('zap')} Encargo urgente</button>
        <button class="btn btn-s" onclick="OR.views.resultModal()">${ic('badge-check')} Resultado</button>
        <a class="btn btn-s" href="#/coach">${ic('sparkles')} Coach</a>
        <button class="btn btn-s" onclick="OR.gamification.usageDays().then(()=>OR.ui.toast('Pausa registrada. El descanso tambien cuenta'))">${ic('coffee')} Pausa</button>
      </div>

      <div class="grid g3">
        <div class="card"><div class="row between"><p class="small bold muted">HABITOS HOY</p>${ic('repeat')}</div>
          <p class="bold" style="font-size:1.5rem">${occ.filter(o=>o.status==='done').length}/${occ.length}</p>
          <a class="small" style="color:var(--accent-2)" href="#/rutinas">Ver rutinas</a></div>
        <div class="card"><div class="row between"><p class="small bold muted">RGS LABS</p>${ic('terminal')}</div>
          <p class="bold" style="font-size:1.5rem">${results.length}</p>
          <p class="small muted">${results[0] ? esc(results[0].title) : 'Sin resultados aun'}</p></div>
        <div class="card"><div class="row between"><p class="small bold muted">ACADEMICO</p>${ic('graduation-cap')}</div>
          <p class="bold" style="font-size:1.5rem">${acad.length}</p>
          <a class="small" style="color:var(--accent-2)" href="#/academico">Investigar</a></div>
        <div class="card"><div class="row between"><p class="small bold muted">PENDIENTES</p>${ic('list-todo')}</div>
          <p class="bold" style="font-size:1.5rem">${open.length}</p>
          <a class="small" style="color:var(--accent-2)" href="#/misiones">Misiones</a></div>
        <div class="card"><div class="row between"><p class="small bold muted">RACHAS</p>${ic('flame')}</div>
          ${Object.entries(streaks || {}).map(([k,v])=>`<p class="small">${esc(k)}: <b>${v?.count || 0} dias</b></p>`).join('') || '<p class="small muted">Sin rachas aun</p>'}</div>
        <div class="card"><div class="row between"><p class="small bold muted">PROXIMO COMPROMISO</p>${ic('calendar-clock')}</div>
          ${next ? `<p class="bold small">${esc(next.title)}</p><p class="small muted">${OR.util.pretty(next.due)}</p>`
                 : '<p class="small muted">Nada programado</p>'}</div>
      </div>
    </section>`;
  };

  /* ============ MISIONES ============ */
  OR.views.misiones = async function (view) {
    window._m = window._m || { q: '', area: '', prio: '', vista: 'lista' };
    const m = window._m;
    let all = (await OR.store.tasks()) || [];
    all = all.filter(t => !t.isProjectStub);
    let list = all.filter(t =>
      (!m.q || t.title.toLowerCase().includes(m.q)) &&
      (!m.area || t.area === m.area) && (!m.prio || t.priority === m.prio));

    const card = t => `
      <div class="card card-h" style="padding:.85rem">
        <div class="row">
          <div class="tcheck ${t.status==='completada'?'done':''}" title="Marcar completada"
            onclick="OR.store.setStatus('${t.id}','${t.status==='completada'?'pendiente':'completada'}').then(()=>OR.router.refresh())">
            ${t.status==='completada'?ic('check','w-3.5 h-3.5'):''}</div>
          <div style="flex:1;min-width:0;cursor:pointer" onclick="OR.store.getTask('${t.id}').then(OR.views.taskModal)">
            <p class="small bold" style="${t.status==='completada'?'text-decoration:line-through;color:var(--text-2)':''}">${esc(t.title)}</p>
            <p class="small muted">${[t.project, t.due ? 'vence ' + OR.util.pretty(t.due) : ''].filter(Boolean).join(' · ')}</p>
            ${(t.subtasks||[]).length ? `<div class="progress mt1" style="height:5px"><div style="width:${t.subtasks.filter(x=>x.done).length/t.subtasks.length*100}%"></div></div>` : ''}
          </div>
          ${areaChip(t.area)}<span class="chip">${t.priority}</span>
          <button class="btn-g" title="Posponer a manana" onclick="OR.store.saveTask({id:'${t.id}',due:OR.util.addDays(OR.util.day(),1),status:'pospuesta'}).then(()=>OR.router.refresh())">${ic('clock')}</button>
        </div></div>`;

    const kcol = (status) => `
      <div class="kcol"><h4>${status} (${list.filter(t=>t.status===status).length})</h4>
        ${list.filter(t=>t.status===status).map(t=>`
          <div class="ktask" onclick="OR.store.getTask('${t.id}').then(OR.views.taskModal)">
            <p class="small bold">${esc(t.title)}</p>
            <div class="row mt1 between"><span class="chip">${t.priority}</span>${areaChip(t.area)}</div>
            <select class="input mt1" style="padding:.3rem;font-size:.75rem" onchange="event.stopPropagation();OR.store.setStatus('${t.id}',this.value).then(()=>OR.router.refresh())">
              ${(OR.store.TASK_STATUSES || ['pendiente']).map(s=>`<option ${t.status===s?'selected':''}>${s}</option>`).join('')}
            </select></div>`).join('') || '<p class="small muted" style="padding:.4rem">Vacio</p>'}
      </div>`;

    view.innerHTML = `<section class="v-enter" style="display:grid;gap:1rem">
      <div class="row between wrap">
        <div class="seg">${[['lista','Lista'],['kanban','Kanban']].map(([v,l])=>`<button class="${m.vista===v?'on':''}" onclick="window._m.vista='${v}';OR.router.refresh()">${l}</button>`).join('')}</div>
        <button class="btn btn-p" onclick="OR.views.taskModal()">${ic('plus')} Nueva tarea</button></div>
      <div class="row wrap" style="gap:.5rem">
        <input class="input" style="flex:1;min-width:180px" placeholder="Buscar…" value="${esc(m.q)}" oninput="window._m.q=this.value;OR.util.debounce(()=>OR.router.refresh(),350)()"/>
        <select class="input" style="width:auto" onchange="window._m.area=this.value;OR.router.refresh()">
          <option value="">Area: todas</option>${AREAS.map(([v,l])=>`<option value="${v}" ${m.area===v?'selected':''}>${l}</option>`).join('')}</select>
        <select class="input" style="width:auto" onchange="window._m.prio=this.value;OR.router.refresh()">
          <option value="">Prioridad</option>${(OR.store.PRIORITIES || []).map(p=>`<option ${m.prio===p?'selected':''}>${p}</option>`).join('')}</select></div>
      ${m.vista === 'lista'
        ? `<div style="display:grid;gap:.6rem">${list.map(card).join('') || OR.ui.empty('inbox','Sin tareas','Crea tu primera tarea para empezar.')}</div>`
        : `<div class="kanban">${(OR.store.TASK_STATUSES || []).map(s=>kcol(s)).join('')}</div>`}
    </section>`;
  };

  /* ============ RUTINAS ============ */
  OR.views.rutinas = async function (view) {
    const today = OR.util.day();
    const rs = (await OR.store.routines()) || [];
    const occ = (await OR.recurrence.forDate(today)) || [];
    const recText = r => { const rc = r.recurrence || {};
      if (rc.type === 'weekdays') return ['D','L','M','X','J','V','S'].filter((_,i)=>(rc.days||[]).includes(i)).join('') || '—';
      if (rc.type === 'interval') return `cada ${rc.everyN||2} dias`;
      return 'diaria'; };
    const occRow = o => `
      <div class="row" style="padding:.55rem 0;border-top:1px solid var(--border)">
        <div class="tcheck ${o.status==='done'?'done':''}" onclick="OR.recurrence.complete('${o.id}').then(()=>OR.router.refresh())">${o.status==='done'?ic('check','w-3.5 h-3.5'):''}</div>
        <div style="flex:1"><p class="small bold">${esc(o.routine?.title || '')}</p>
          ${o.routine?.note ? `<p class="small muted">${esc(o.routine.note)}</p>` : ''}</div>
        <span class="chip">${o.status}</span>
        ${o.status==='pending' ? `<button class="btn-g" title="Posponer a manana" onclick="OR.recurrence.postpone('${o.id}').then(()=>OR.router.refresh())">${ic('clock')}</button>
        <button class="btn-g" title="Saltar (sin penalizacion)" onclick="OR.recurrence.skip('${o.id}',prompt('Motivo (opcional):')||'').then(()=>OR.router.refresh())">${ic('forward')}</button>` : ''}
      </div>`;

    view.innerHTML = `<section class="v-enter" style="display:grid;gap:1rem">
      <div class="card"><div class="row between"><h3 class="bold">Hoy · ${OR.util.pretty(today)}</h3>
        <span class="chip chip-p">${occ.filter(o=>o.status==='done').length}/${occ.length} hechas</span></div>
        ${occ.map(occRow).join('') || '<p class="small muted mt1">Ninguna rutina toca hoy.</p>'}</div>
      <div class="row between"><h3 class="bold">Plantillas</h3>
        <button class="btn btn-p" onclick="OR.views.routineModal()">${ic('plus')} Nueva rutina</button></div>
      <div class="grid g2">${rs.map(r=>`
        <div class="card card-h"><div class="row between">
          <p class="bold small">${esc(r.title)}</p>
          <button class="btn-g" onclick="OR.store.saveRoutine({id:'${r.id}',active:${!r.active}}).then(()=>OR.router.refresh())"
            title="${r.active?'Desactivar':'Activar'}">${ic(r.active?'toggle-right':'toggle-left')}</button></div>
          <div class="row mt1 wrap">${areaChip(r.area)}<span class="chip">${recText(r)}</span>
            ${r.house ? `<span class="chip">casa ${r.house}</span>` : ''}
            ${r.pausedUntil ? `<span class="chip">pausada hasta ${r.pausedUntil}</span>` : ''}</div>
          ${(r.sequence||[]).length ? `<p class="small muted mt1">${r.sequence.length} pasos · ${esc(r.sequence[0])}…</p>` : ''}
          <div class="row mt2"><button class="btn btn-s" style="font-size:.78rem;padding:.35rem .7rem" onclick="OR.store.routines().then(x=>OR.views.routineModal(x.find(y=>y.id==='${r.id}')))">Editar</button>
          <button class="btn btn-d" style="font-size:.78rem;padding:.35rem .7rem" onclick="OR.views._delRoutine('${r.id}')">Eliminar</button></div>
        </div>`).join('')}</div>
    </section>`;
  };
  OR.views._delRoutine = async id => {
    if (await OR.ui.confirm('Se eliminara la plantilla y su historial de ocurrencias.', { danger: true, label: 'Eliminar' })) {
      await OR.store.deleteRoutine(id); OR.ui.toast('Rutina eliminada'); OR.router.refresh(); }
  };

  OR.views.routineModal = function (existing) {
    const r = existing || { recurrence: { type: 'daily' }, area: 'core', sequence: [], active: true };
    const rc = r.recurrence || {};
    const panel = OR.ui.modal(`
      <h3 class="bold" style="font-size:1.1rem">${existing ? 'Editar' : 'Nueva'} rutina</h3>
      <label class="fld">Titulo</label><input id="r-title" class="input" value="${esc(r.title||'')}"/>
      <div class="grid g2 mt1">
        <div><label class="fld">Area</label><select id="r-area" class="input">${AREAS.map(([v,l])=>`<option value="${v}" ${r.area===v?'selected':''}>${l}</option>`).join('')}</select></div>
        <div><label class="fld">Casa</label><select id="r-house" class="input">
          <option value="" ${!r.house?'selected':''}>ambas</option><option ${r.house==='padre'?'selected':''}>padre</option><option ${r.house==='madre'?'selected':''}>madre</option></select></div>
        <div><label class="fld">Tipo</label><select id="r-type" class="input">
          <option value="daily" ${rc.type==='daily'?'selected':''}>todos los dias</option>
          <option value="weekdays" ${rc.type==='weekdays'?'selected':''}>dias especificos</option>
          <option value="interval" ${rc.type==='interval'?'selected':''}>cada N dias</option></select></div>
        <div><label class="fld">Cada N dias</label><input id="r-n" type="number" class="input" value="${rc.everyN||2}"/></div>
      </div>
      <div id="r-days-row"><label class="fld">Dias de la semana</label><div class="row wrap">
        ${['Dom','Lun','Mar','Mie','Jue','Vie','Sab'].map((d,i)=>`<label class="chip" style="cursor:pointer">
          <input type="checkbox" class="r-day" value="${i}" ${(rc.days||[]).includes(i)?'checked':''}/> ${d}</label>`).join('')}</div></div>
      <label class="fld">Secuencia de pasos (uno por linea)</label>
      <textarea id="r-seq" class="input" rows="4">${esc((r.sequence||[]).join('\n'))}</textarea>
      <label class="fld">Nota (ej. condiciones del bano, posponible sin penalizacion)</label>
      <input id="r-note" class="input" value="${esc(r.note||'')}"/>
      <label class="fld">Pausar hasta (opcional)</label><input id="r-pause" type="date" class="input" value="${r.pausedUntil||''}"/>
      <div class="row mt3" style="justify-content:flex-end;gap:.5rem">
        <button class="btn btn-s" onclick="OR.ui.close()">Cancelar</button>
        <button class="btn btn-p" id="r-save">Guardar</button></div>`);
    const typeSel = panel.querySelector('#r-type');
    const daysRow = panel.querySelector('#r-days-row');
    const toggleDays = () => daysRow.style.display = typeSel.value === 'weekdays' ? '' : 'none';
    typeSel.onchange = toggleDays; toggleDays();
    panel.querySelector('#r-save').onclick = async () => {
      const title = panel.querySelector('#r-title').value.trim();
      if (!title) return OR.errors.show('La rutina necesita un titulo.', new Error('ValidationError: empty routine'));
      const type = typeSel.value;
      await OR.store.saveRoutine({ ...existing, title,
        area: panel.querySelector('#r-area').value, house: panel.querySelector('#r-house').value || null,
        recurrence: { type,
          days: type === 'weekdays' ? [...panel.querySelectorAll('.r-day:checked')].map(c=>+c.value) : undefined,
          everyN: type === 'interval' ? Math.max(1, +panel.querySelector('#r-n').value || 2) : undefined },
        sequence: panel.querySelector('#r-seq').value.split('\n').map(l=>l.trim()).filter(Boolean),
        note: panel.querySelector('#r-note').value.trim(),
        pausedUntil: panel.querySelector('#r-pause').value || null, active: true });
      OR.ui.close(); OR.ui.toast('Rutina guardada'); OR.router.refresh();
    };
  };

  /* ============ RGS LABS ============ */
  OR.views.rgs = async function (view) {
    const tasks = ((await OR.store.tasks()) || []).filter(t => t.area === 'rgs' && !t.isProjectStub);
    const results = (await OR.store.results()) || [];
    const projCard = name => {
      const pts = tasks.filter(t => t.project === name);
      return `<div class="card card-h"><div class="row between">
        <p class="bold">${name} ${name==='DataForge CLI'?'<span class="chip chip-p">prioridad alta</span>':'<span class="chip">secundario</span>'}</p>
        <button class="btn btn-s" style="font-size:.78rem;padding:.35rem .7rem" onclick="OR.views.taskModal({area:'rgs',project:'${name}'})">${ic('plus')} tarea</button></div>
        ${pts.map(t=>`<div class="row mt1" style="gap:.5rem">
          <div class="tcheck ${t.status==='completada'?'done':''}" style="width:18px;height:18px"
            onclick="OR.store.setStatus('${t.id}','${t.status==='completada'?'pendiente':'completada'}').then(()=>OR.router.refresh())"></div>
          <span class="small" style="flex:1;${t.status==='completada'?'text-decoration:line-through;color:var(--text-2)':''}">${esc(t.title)}</span>
          <span class="chip">${t.priority}</span></div>`).join('') || '<p class="small muted mt1">Sin tareas. Anade las siguientes acciones reales del proyecto.</p>'}</div>`;
    };
    view.innerHTML = `<section class="v-enter" style="display:grid;gap:1rem">
      <div class="row between wrap"><p class="small muted" style="max-width:560px">Espacio profesional. Los resultados verificables pesan mas que las horas.</p>
        <button class="btn btn-p" onclick="OR.views.resultModal()">${ic('badge-check')} Registrar resultado</button></div>
      <div class="grid g2">${projCard('DataForge CLI')}${projCard('KlueCRM')}</div>
      <div class="card"><div class="row between mb2"><h3 class="bold">Registro de resultados</h3>
        <button class="btn btn-s" style="font-size:.78rem" onclick="OR.views._copySummary()">${ic('clipboard-copy')} Copiar resumen exportable</button></div>
        ${results.map(r=>`<div class="row" style="padding:.6rem 0;border-top:1px solid var(--border);align-items:flex-start">
          <div style="flex:1"><p class="small bold">${esc(r.title)} <span class="chip">${esc(r.project)}</span></p>
            <p class="small muted">${esc(r.whatChanged||'')}${r.missing ? ' · Falta: ' + esc(r.missing) : ''}</p>
            <p class="small">${r.githubUrl ? `<a style="color:var(--accent-2)" href="${esc(r.githubUrl)}" target="_blank" rel="noopener">GitHub</a>` : ''}
              ${r.publishedUrl ? ` <a style="color:var(--accent-2)" href="${esc(r.publishedUrl)}" target="_blank" rel="noopener">Publicacion</a>` : ''}</p></div>
          <span class="small muted">${OR.util.pretty(r.date)}</span>
          <button class="btn-g" onclick="OR.store.deleteResult('${r.id}').then(()=>OR.router.refresh())">${ic('trash-2')}</button>
        </div>`).join('') || OR.ui.empty('badge-check','Sin resultados aun','Registra que entregaste hoy: que cambio, que falta, enlaces.')}</div>
    </section>`;
  };
  OR.views._copySummary = async () => {
    const rs = (await OR.store.results()) || [];
    const txt = 'Resultados RGS Labs\n' + rs.map(r => '- [' + r.date + '] ' + r.project + ': ' + r.title + (r.whatChanged ? ' — ' + r.whatChanged : '') + (r.githubUrl ? ' (' + r.githubUrl + ')' : '')).join('\n');
    try { await navigator.clipboard.writeText(txt); OR.ui.toast('Resumen copiado — listo para compartir'); }
    catch (e) { OR.errors.show('No se pudo copiar al portapapeles.', e); }
  };

  /* ============ ACADEMICO ============ */
  OR.views.academico = async function (view) {
    const FASES = ['Explorar carreras','Comparar contenidos','Seleccionar finalistas','Investigar universidades','Revisar planes de estudio','Identificar prerrequisitos','Investigar preparatorias','Comparar opciones','Lista priorizada'];
    const recs = (await OR.store.academic()) || [];
    const careers = recs.filter(r => r.kind === 'carrera');
    const fase = careers.length === 0 ? 0 : careers.length < 3 ? 1 : 3;
    const kindLabel = { carrera: 'Carrera', preparatoria: 'Preparatoria', nota: 'Nota' };
    view.innerHTML = `<section class="v-enter" style="display:grid;gap:1rem">
      <div class="card"><p class="small bold muted mb2">PROCESO (IVEA completado: 9/9 · promedio 9.2)</p>
        <div class="row wrap" style="gap:.4rem">${FASES.map((f,i)=>`<span class="chip ${i<fase?'chip-p':''}" style="${i===fase?'border-color:var(--accent)':''}">${i+1}. ${f}</span>`).join('')}</div></div>
      <div class="row between wrap"><p class="small muted">Guarda solo fuentes que consultaste. Marca lo que necesita verificacion.</p>
        <button class="btn btn-p" onclick="OR.views.acadModal()">${ic('plus')} Anadir registro</button></div>
      ${careers.length ? `<div class="card" style="overflow-x:auto"><p class="small bold muted mb2">COMPARADOR DE CARRERAS</p>
        <table style="width:100%;border-collapse:collapse;font-size:.82rem;min-width:560px">
          <tr style="text-align:left;color:var(--text-2)"><th style="padding:.4rem">Carrera</th><th>Institucion</th><th>Costos</th><th>Confianza</th><th>Estado</th><th>Proxima accion</th></tr>
          ${careers.map(c=>`<tr style="border-top:1px solid var(--border)">
            <td style="padding:.45rem"><b>${esc(c.name)}</b>${c.url ? `<br><a style="color:var(--accent-2);font-size:.72rem" href="${esc(c.url)}" target="_blank" rel="noopener">fuente</a>` : ''}</td>
            <td>${esc(c.institution||'—')}</td><td>${esc(c.costs||'—')}</td><td>${esc(c.confidence)}</td><td>${esc(c.status)}</td><td>${esc(c.nextAction||'—')}</td></tr>`).join('')}
        </table></div>` : ''}
      <div class="grid g2">${recs.filter(r=>r.kind!=='carrera').map(r=>`
        <div class="card card-h"><div class="row between"><p class="bold small">${esc(r.name)}</p><span class="chip">${kindLabel[r.kind]||r.kind}</span></div>
          <p class="small muted mt1">${esc(r.institution||'')} ${r.url ? `· <a style="color:var(--accent-2)" href="${esc(r.url)}" target="_blank" rel="noopener">fuente</a>` : ''}</p>
          ${r.notes ? `<p class="small mt1">${esc(r.notes)}</p>` : ''}
          <p class="small mt1">${r.nextAction ? 'Siguiente: ' + esc(r.nextAction) : ''} <span class="chip" style="margin-left:.3rem">${esc(r.status)}</span></p>
          <div class="row mt2"><button class="btn btn-s" style="font-size:.78rem;padding:.35rem .7rem" onclick="OR.store.academic().then(x=>OR.views.acadModal(x.find(y=>y.id==='${r.id}')))">Editar</button>
          <button class="btn btn-d" style="font-size:.78rem;padding:.35rem .7rem" onclick="OR.store.deleteAcademic('${r.id}').then(()=>OR.router.refresh())">Eliminar</button></div>
        </div>`).join('') || (!careers.length ? OR.ui.empty('graduation-cap','Empieza tu investigacion','Anade 3-5 carreras de informatica, IA o ciberseguridad y compara con fuentes oficiales.') : '')}</div>
    </section>`;
  };
  OR.views.acadModal = function (existing) {
    const a = existing || { kind: 'carrera', confidence: 'media', status: 'explorando' };
    const panel = OR.ui.modal(`
      <h3 class="bold" style="font-size:1.1rem">${existing ? 'Editar' : 'Nuevo'} registro academico</h3>
      <div class="grid g2 mt1">
        <div><label class="fld">Tipo</label><select id="a-kind" class="input">
          <option value="carrera" ${a.kind==='carrera'?'selected':''}>Carrera</option>
          <option value="preparatoria" ${a.kind==='preparatoria'?'selected':''}>Preparatoria</option>
          <option value="nota" ${a.kind==='nota'?'selected':''}>Nota / conclusion</option></select></div>
        <div><label class="fld">Nombre</label><input id="a-name" class="input" value="${esc(a.name||'')}"/></div>
        <div><label class="fld">Institucion</label><input id="a-inst" class="input" value="${esc(a.institution||'')}"/></div>
        <div><label class="fld">Enlace fuente oficial</label><input id="a-url" class="input" value="${esc(a.url||'')}"/></div>
        <div><label class="fld">Costos</label><input id="a-costs" class="input" value="${esc(a.costs||'')}"/></div>
        <div><label class="fld">Confianza</label><select id="a-conf" class="input">
          ${['baja','media','alta'].map(c=>`<option ${a.confidence===c?'selected':''}>${c}</option>`).join('')}</select></div>
        <div><label class="fld">Estado</label><select id="a-status" class="input">
          ${['explorando','comparando','finalista','investigando','verificado'].map(c=>`<option ${a.status===c?'selected':''}>${c}</option>`).join('')}</select></div>
        <div><label class="fld">Proxima accion</label><input id="a-next" class="input" value="${esc(a.nextAction||'')}"/></div>
      </div>
      <label class="fld">Requisitos</label><textarea id="a-req" class="input" rows="2">${esc(a.requirements||'')}</textarea>
      <label class="fld">Notas</label><textarea id="a-notes" class="input" rows="2">${esc(a.notes||'')}</textarea>
      <div class="row mt3" style="justify-content:flex-end;gap:.5rem">
        <button class="btn btn-s" onclick="OR.ui.close()">Cancelar</button>
        <button class="btn btn-p" id="a-save">Guardar</button></div>`);
    panel.querySelector('#a-save').onclick = async () => {
      const name = panel.querySelector('#a-name').value.trim();
      if (!name) return OR.errors.show('El registro necesita un nombre.', new Error('ValidationError: empty academic record'));
      await OR.store.saveAcademic({ ...existing, name, kind: panel.querySelector('#a-kind').value,
        institution: panel.querySelector('#a-inst').value.trim(), url: panel.querySelector('#a-url').value.trim(),
        costs: panel.querySelector('#a-costs').value.trim(), confidence: panel.querySelector('#a-conf').value,
        status: panel.querySelector('#a-status').value, nextAction: panel.querySelector('#a-next').value.trim(),
        requirements: panel.querySelector('#a-req').value, notes: panel.querySelector('#a-notes').value });
      if (panel.querySelector('#a-kind').value === 'carrera') await OR.gamification.unlock('first-career');
      OR.ui.close(); OR.ui.toast('Registro guardado'); OR.router.refresh();
    };
  };

  /* ============ PROGRESO ============ */
  OR.views.progreso = async function (view) {
    window._p = window._p || { days: 30 };
    const days = window._p.days;
    const today = OR.util.day();
    const from = OR.util.addDays(today, -(days - 1));
    (window._charts || []).forEach(c => c.destroy()); window._charts = [];

    const tasks = (await OR.store.tasks()) || [];
    const doneTasks = tasks.filter(t => t.completedAt && t.completedAt.slice(0, 10) >= from);
    const occs = ((await OR.db.all('occurrences')) || []).filter(o => o.date >= from);
    const xp = (await OR.gamification.xp()) || { total: 0, log: [] };
    const xpLog = xp.log || [];
    const hasData = doneTasks.length || occs.length || xpLog.length;
    const demoBtn = `<button class="btn btn-s" onclick="OR.seed.enableDemo().then(()=>OR.router.refresh())">Activar datos de demo</button>`;
    const canvas = (id, h) => `<div class="card"><canvas id="${id}" style="width:100%;height:${h||180}px"></canvas></div>`;
    const dayKeys = []; for (let d = from; d <= today; d = OR.util.addDays(d, 1)) dayKeys.push(d);

    view.innerHTML = `<section class="v-enter" style="display:grid;gap:1rem">
      <div class="row between wrap"><h3 class="bold">Progreso real</h3>
        <div class="seg">${[7,30,90,365,0].map(d=>`<button class="${days===d?'on':''}" onclick="window._p.days=${d};OR.router.refresh()">${d===0?'Todo':d+' dias'}</button>`).join('')}</div></div>
      ${!hasData ? `<div class="card">${OR.ui.empty('bar-chart-3','Aun no hay datos reales','Completa tareas y habitos, o activa los datos de demostracion para explorar las graficas.', demoBtn)}</div>` : `
      <div class="grid g2">
        ${canvas('c1')} ${canvas('c2')}
        ${canvas('c3')} ${canvas('c4')}
      </div>
      <p class="small muted">Las graficas usan solo tus datos locales. Un dia ocupado por la familia tambien es informacion valida.</p>`}
    </section>`;
    if (!hasData || typeof Chart === 'undefined') return;
    const grid = { color: 'rgba(140,140,160,.12)' }, tick = { color: '#A1A1AA', maxTicksLimit: 8 };
    const mk = (id, cfg) => { const el = document.getElementById(id); if (el) window._charts.push(new Chart(el, cfg)); };
    mk('c1', { type: 'bar', data: { labels: dayKeys.map(d=>d.slice(5)),
      datasets: [{ label: 'Tareas completadas', data: dayKeys.map(d => doneTasks.filter(t=>t.completedAt.slice(0,10)===d).length),
        backgroundColor: '#8B5CF6', borderRadius: 6 }] },
      options: { plugins: { legend: { labels: { color: '#A1A1AA' } } }, scales: { x: { ticks: tick, grid: { display: false } }, y: { beginAtZero: true, ticks: { ...tick, precision: 0 }, grid } } } });
    mk('c2', { type: 'doughnut', data: { labels: AREAS.map(a=>a[1]),
      datasets: [{ data: AREAS.map(([v]) => doneTasks.filter(t=>t.area===v).length),
        backgroundColor: ['#34D399','#8B5CF6','#39d0ff','#FBBF24','#F472B6'], borderWidth: 0 }] },
      options: { plugins: { legend: { position: 'bottom', labels: { color: '#A1A1AA' } } } } });
    mk('c3', { type: 'line', data: { labels: dayKeys.map(d=>d.slice(5)), datasets: [
        { label: 'Habitos hechos', data: dayKeys.map(d => occs.filter(o=>o.date===d&&o.status==='done').length), borderColor: '#34D399', tension: .35 },
        { label: 'Pospuestos/saltados', data: dayKeys.map(d => occs.filter(o=>o.date===d&&['skipped','postponed'].includes(o.status)).length), borderColor: '#FBBF24', tension: .35 }] },
      options: { plugins: { legend: { labels: { color: '#A1A1AA' } } }, scales: { x: { ticks: tick, grid: { display: false } }, y: { beginAtZero: true, ticks: { ...tick, precision: 0 }, grid } } } });
    let acc = 0;
    const cum = xpLog.filter(l => l?.at && l.at.slice(0, 10) >= from).sort((a, b) => (a?.at || '').localeCompare(b?.at || '')).map(l => (acc += (l?.amount || 0)));
    mk('c4', { type: 'line', data: { labels: cum.map(()=>''), datasets: [{ label: 'XP acumulada', data: cum, borderColor: '#A78BFA', backgroundColor: 'rgba(139,92,246,.15)', fill: true, tension: .35 }] },
      options: { plugins: { legend: { labels: { color: '#A1A1AA' } } }, scales: { x: { display: false }, y: { beginAtZero: true, ticks: tick, grid } } } });
  };

  /* ============ LOGROS ============ */
  OR.views.logros = async function (view) {
    const xp = (await OR.gamification.xp()) || { total: 0, log: [] };
    const unlocked = (await OR.gamification.achievements()) || {};
    const totalXp = xp.total || 0;
    const level = Math.floor(totalXp / 100) + 1;
    const into = totalXp % 100;
    const REWARDS = [
      { cost: 30, label: 'Capitulo de serie / video', icon: 'tv' },
      { cost: 50, label: 'Hora extra de gaming', icon: 'gamepad-2' },
      { cost: 100, label: 'Acento dorado temporal (24h)', icon: 'palette', fx: async () => {
        await OR.store.saveSettings({ accent: '#FBBF24' });
        setTimeout(() => OR.store.saveSettings({ accent: '#8B5CF6' }), 86400000); } },
    ];
    view.innerHTML = `<section class="v-enter" style="display:grid;gap:1rem">
      <div class="card" style="background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 18%,var(--surface)),var(--surface))">
        <div class="row between"><div><p class="small muted">Nivel ${level}</p><p style="font-size:2rem;font-weight:800">${totalXp} XP</p></div>${ic('trophy')}</div>
        ${OR.ui.progress(into)}<p class="small muted mt1">${100 - into} XP para el nivel ${level + 1}</p></div>
      <h3 class="bold">Logros <span class="chip">${Object.keys(unlocked).length}/${OR.gamification.DEFS.length}</span></h3>
      <div class="grid g3">${OR.gamification.DEFS.map(d => { const u = unlocked[d.id]; return `
        <div class="card" style="opacity:${u ? 1 : .45};${u ? 'border-color:color-mix(in srgb,var(--warning) 50%,var(--border))' : ''}">
          <div class="row">${ic(d.icon)}<div><p class="small bold">${d.name}</p><p class="small muted">${d.desc}</p></div></div>
          ${u ? `<p class="small mt1" style="color:var(--success)">Desbloqueado ${new Date(u.unlockedAt).toLocaleDateString('es-MX')}</p>` : '<p class="small muted mt1">Bloqueado</p>'}</div>`; }).join('')}</div>
      <h3 class="bold">Recompensas personales <span class="chip">opcionales</span></h3>
      <p class="small muted">El descanso, la comida y la higiene <b>nunca</b> cuestan puntos.</p>
      <div class="grid g3">${REWARDS.map((r, i) => `
        <div class="card card-h"><div class="row">${ic(r.icon)}<p class="small bold" style="flex:1">${r.label}</p></div>
          <button class="btn btn-s mt2 wfull" style="justify-content:center" onclick="OR.views._reward(${r.cost},'${r.label}',${i})">Canjear · ${r.cost} XP</button></div>`).join('')}</div>
    </section>`;
    window._rewardFx = REWARDS.map(r => r.fx || null);
  };
  OR.views._reward = async (cost, label, i) => {
    const ok = await OR.gamification.grantReward(cost, label);
    const xp = (await OR.gamification.xp()) || { total: 0 };
    if (!ok) return OR.ui.toast('Te faltan ' + (cost - (xp.total || 0)) + ' XP', 'lock');
    if (window._rewardFx && window._rewardFx[i]) await window._rewardFx[i]();
    OR.ui.toast('Recompensa desbloqueada: ' + label); OR.router.refresh();
  };

  /* ============ COACH ============ */
  OR.views.coach = async function (view) {
    const s = (await OR.store.settings()) || {};
    const cfg = s.coach || {};
    if (!cfg.enabled || !cfg.workerUrl) {
      view.innerHTML = `<div class="card v-enter">${OR.ui.empty('sparkles','Coach IA no configurado',
        'El Coach usa un Cloudflare Worker + OpenRouter (modelos gratuitos). Tu API key nunca toca el frontend. Configura la URL del Worker en Ajustes > Coach para activarlo.',
        `<a class="btn btn-p" href="#/ajustes">Ir a Ajustes</a>`)}</div>`;
      return;
    }
    view.innerHTML = `<section class="v-enter" style="display:flex;flex-direction:column;gap:.8rem;min-height:calc(100vh - 200px)">
      <div class="card"><div class="row"><span style="width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent-2));display:grid;place-items:center;color:#fff">${ic('sparkles')}</span>
        <div style="flex:1"><p class="bold">Coach OpenRutine</p>
          <p class="small muted">Areas permitidas: ${(cfg.allowAreas||[]).join(', ') || 'ninguna'} · El Coach propone, tu confirmas cada cambio.</p></div>
        <span class="chip chip-p"><span class="pulse-dot"></span> listo</span></div></div>
      <div id="chat" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:.6rem"></div>
      <form id="chat-f" class="row"><input id="chat-i" class="input" style="flex:1" placeholder="Pide un plan, divide una mision, revisa tu progreso…" autocomplete="off"/>
        <button class="btn btn-p" type="submit">${ic('send')}</button></form>
    </section>`;
    const chat = document.getElementById('chat');
    const addMsg = (who, html) => {
      const d = document.createElement('div');
      d.style.cssText = `max-width:85%;padding:.7rem .9rem;border-radius:16px;font-size:.88rem;${who === 'user'
        ? 'align-self:flex-end;background:var(--accent);color:#fff;border-bottom-right-radius:4px'
        : 'align-self:flex-start;background:var(--surface-2);border:1px solid var(--border);border-bottom-left-radius:4px'}`;
      d.innerHTML = html; chat.appendChild(d); chat.scrollTop = chat.scrollHeight; return d;
    };
    addMsg('bot', 'Hola. Soy tu Coach. Puedo recomendarte la siguiente tarea, dividir una mision o adaptar tu plan. Solo veo las areas que permites en Ajustes.');
    document.getElementById('chat-f').onsubmit = async e => {
      e.preventDefault();
      const input = document.getElementById('chat-i');
      const text = input.value.trim(); if (!text) return;
      input.value = ''; addMsg('user', esc(text));
      const thinking = addMsg('bot', '<i class="muted">pensando…</i>');
      try {
        const res = await OR.coach.ask(text);
        thinking.innerHTML = res.html;
        if (res.actions && res.actions.length) {
          const box = document.createElement('div');
          box.style.cssText = 'align-self:stretch;display:grid;gap:.5rem;margin-top:.3rem';
          box.innerHTML = `<p class="small bold muted">ACCIONES PROPUESTAS — revisalas y confirma:</p>` + res.actions.map((a, i) => `
            <div class="card row between" style="padding:.6rem .8rem">
              <span class="small">${esc(a.label || a.type)}</span>
              <span class="row"><button class="btn btn-p" style="font-size:.75rem;padding:.3rem .7rem" data-i="${i}">Aplicar</button>
              <button class="btn btn-s" style="font-size:.75rem;padding:.3rem .7rem" data-x="${i}">Rechazar</button></span></div>`).join('');
          chat.appendChild(box); chat.scrollTop = chat.scrollHeight;
          box.querySelectorAll('[data-i]').forEach(b => b.onclick = async () => {
            await OR.coach.applyAction(res.actions[+b.dataset.i]); box.remove();
            OR.ui.toast('Accion aplicada'); OR.router.refresh();
          });
          box.querySelectorAll('[data-x]').forEach(b => b.onclick = () => box.remove());
        }
      } catch (err) {
        thinking.remove();
        OR.errors.show('El Coach no respondio. Revisa el Worker o la conexion.', err);
      }
    };
  };

  /* ============ AJUSTES ============ */
  OR.views.ajustes = async function (view) {
    const s = (await OR.store.settings()) || {};
    const hierLabels = { obligaciones: 'Obligaciones con otras personas', cuidado: 'Cuidado personal', rgs: 'RGS Labs', academico: 'Academico', hogar: 'Hogar', opcional: 'Opcionales', descanso: 'Descanso' };
    view.innerHTML = `<section class="v-enter" style="display:grid;gap:1rem;max-width:720px">
      <div class="card"><h3 class="bold mb2">Apariencia</h3>
        <div class="grid g2">
          <div><label class="fld">Tema</label><select id="s-theme" class="input">
            ${['dark','light','system'].map(t=>`<option value="${t}" ${s.theme===t?'selected':''}>${{dark:'Oscuro',light:'Claro',system:'Sistema'}[t]}</option>`).join('')}</select></div>
          <div><label class="fld">Color de acento</label><input id="s-accent" type="color" class="input" style="height:42px;padding:.3rem" value="${s.accent || '#8B5CF6'}"/></div>
          <div><label class="fld">Densidad</label><select id="s-density" class="input">
            ${['comfortable','compact'].map(t=>`<option ${s.density===t?'selected':''}>${t}</option>`).join('')}</select></div>
          <div><label class="fld">Animaciones</label><select id="s-motion" class="input">
            <option value="auto" ${s.motion==='auto'?'selected':''}>automaticas (respeta reduced-motion)</option>
            <option value="reduce" ${s.motion==='reduce'?'selected':''}>reducidas</option></select></div>
          <div><label class="fld">Tamano de texto</label><select id="s-text" class="input">
            ${['normal','large'].map(t=>`<option ${s.textSize===t?'selected':''}>${t}</option>`).join('')}</select></div>
          <div><label class="fld">Tu nombre (saludo)</label><input id="s-name" class="input" value="${esc(s.name || '')}"/></div>
        </div></div>

      <div class="card"><h3 class="bold mb2">Rutinas y contexto</h3>
        <div class="grid g2">
          <div><label class="fld">Casa habitual</label><select id="s-house" class="input">
            <option ${s.house==='padre'?'selected':''}>padre</option><option ${s.house==='madre'?'selected':''}>madre</option></select></div>
          <div><label class="fld">Despertar habitual</label><input id="s-wake" type="time" class="input" value="${s.wakeTime || '07:00'}"/></div>
          <div><label class="fld">Zona horaria</label><input id="s-tz" class="input" value="${esc(s.tz || 'America/Mexico_City')}"/></div>
        </div>
        <label class="fld">Jerarquia de prioridades (1 = mas importante)</label>
        ${(s.hierarchy || ['obligaciones','cuidado','rgs','academico','hogar','opcional','descanso']).map((k, i) => `<div class="row mt1" style="gap:.6rem">
          <span class="chip" style="width:2rem;justify-content:center">${i + 1}</span>
          <select class="input hier-sel">${Object.entries(hierLabels).map(([v, l]) => `<option value="${v}" ${k === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`).join('')}
        <p class="small muted mt1">El motor recomienda segun este orden, pero nunca bloquea el resto de la app.</p></div>

      <div class="card"><h3 class="bold mb2">Privacidad del Coach</h3>
        <p class="small muted mb2">El Coach solo recibe las areas marcadas. Notas privadas y registros familiares nunca se envian.</p>
        ${AREAS.map(([v, l]) => `<label class="row mt1" style="gap:.5rem;cursor:pointer">
          <input type="checkbox" class="c-area" value="${v}" ${((s.coach && s.coach.allowAreas) || []).includes(v) ? 'checked' : ''}/> <span class="small">${l}</span></label>`).join('')}
        <label class="fld">URL del Cloudflare Worker</label>
        <input id="s-worker" class="input" placeholder="https://openrutine-coach.tu-usuario.workers.dev" value="${esc((s.coach && s.coach.workerUrl) || '')}"/>
        <label class="row mt1" style="gap:.5rem;cursor:pointer"><input type="checkbox" id="s-coach-on" ${s.coach && s.coach.enabled ? 'checked' : ''}/>
          <span class="small">Activar Coach IA</span></label></div>

      <div class="card"><h3 class="bold mb2">Datos y copias de seguridad</h3>
        <div class="row wrap" style="gap:.5rem">
          <button class="btn btn-s" onclick="OR.backup.download()">${ic('download')} Exportar JSON</button>
          <label class="btn btn-s" style="cursor:pointer">${ic('upload')} Importar JSON<input type="file" accept=".json,application/json" hidden onchange="if(this.files[0]) OR.backup.importFlow(this.files[0])"/></label>
          ${s.demo ? `<button class="btn btn-d" onclick="OR.seed.disableDemo().then(()=>OR.router.refresh())">${ic('trash-2')} Quitar datos demo</button>`
                   : `<button class="btn btn-s" onclick="OR.seed.enableDemo().then(()=>OR.router.refresh())">${ic('flask-conical')} Activar datos demo</button>`}
        </div>
        <p class="small muted mt1">La importacion valida el esquema, muestra resumen y pide confirmacion. Nunca se ejecuta codigo del archivo.</p></div>

      <div class="card"><h3 class="bold mb2">Cuenta y sincronizacion</h3>
        <div class="row"><span class="pulse-dot" id="sync-dot-2"></span><p class="small">Modo local — tus datos viven en este dispositivo (IndexedDB) y se exportan con JSON.</p></div>
        <p class="small muted mt1">Supabase (login multi-dispositivo) esta preparado en la arquitectura (schema en supabase/schema.sql) pero requiere crear proyecto y configurar credenciales. La app es 100% funcional sin el. Sin promesas de fusion automatica: al configurarlo, exporta/importa tu JSON como puente.</p></div>

      <div class="card"><h3 class="bold mb2">Informacion</h3>
        <p class="small muted">OpenRutine v1.0 · PWA offline-first · Sin frameworks pesados (HTML/CSS/JS modular + IndexedDB + Chart.js).
        <br/>Docs: README.md · docs/DESPLIEGUE.md · docs/PRIVACIDAD.md</p></div>
      <button class="btn btn-p" id="s-save">Guardar ajustes</button>
    </section>`;
    document.getElementById('s-save').onclick = async () => {
      const hierSel = [...view.querySelectorAll('.hier-sel')].map(x => x.value);
      await OR.store.saveSettings({
        theme: document.getElementById('s-theme').value, accent: document.getElementById('s-accent').value,
        density: document.getElementById('s-density').value, motion: document.getElementById('s-motion').value,
        textSize: document.getElementById('s-text').value, name: document.getElementById('s-name').value.trim(),
        house: document.getElementById('s-house').value, wakeTime: document.getElementById('s-wake').value,
        tz: document.getElementById('s-tz').value.trim() || 'America/Mexico_City', hierarchy: hierSel,
        coach: { ...(s.coach || {}), workerUrl: document.getElementById('s-worker').value.trim(),
          enabled: document.getElementById('s-coach-on').checked,
          allowAreas: [...view.querySelectorAll('.c-area:checked')].map(c => c.value) } });
      OR.ui.toast('Ajustes guardados'); OR.router.refresh();
    };
  };
})();