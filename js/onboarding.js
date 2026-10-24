/* onboarding.js — Bienvenida breve, saltable, sin datos personales innecesarios. */
window.OR = window.OR || {};
OR.onboarding = (function () {
  async function start() {
    const s = await OR.store.settings();
    if (s.onboarded) return;
    const root = document.getElementById('onboarding-root');
    let step = 0;
    const houses = { padre: { wake: '06:30', label: 'Casa de mi padre (despertar ~06:30)' },
                     madre: { wake: '05:45', label: 'Casa de mi madre (despertar ~05:45, traslado de hermanos)' } };
    const render = async () => {
      const rs = await OR.store.routines();
      const cur = await OR.store.settings();
      const steps = [
        `<h2 style="font-size:1.4rem;font-weight:800">Bienvenido a <span style="color:var(--accent-2)">OpenRutine</span></h2>
         <p class="muted mt1">Tu sistema operativo personal: se adapta a tu vida real, no al reves. Sin horarios militares, sin culpa por dias dificiles.</p>`,
        `<h3 class="bold">Como te gusta la interfaz?</h3>
         <div class="seg mt2">${['dark','light','system'].map(t=>`<button data-th="${t}" class="${cur.theme===t?'on':''}">${{dark:'Oscuro',light:'Claro',system:'Sistema'}[t]}</button>`).join('')}</div>`,
        `<h3 class="bold">Donde pasas mas tiempo?</h3>
         <div class="grid mt2" style="gap:.5rem">${Object.entries(houses).map(([v, h]) =>
          `<button class="btn btn-s" data-house="${v}" style="justify-content:flex-start">${h.label}</button>`).join('')}</div>`,
        `<h3 class="bold">Rutinas iniciales</h3>
         <p class="small muted mt1">Activadas segun tu contexto. Puedes editarlas o desactivarlas despues.</p>
         ${rs.map(r => `<label class="row mt1" style="gap:.5rem;cursor:pointer"><input type="checkbox" class="ob-r" data-id="${r.id}" checked/> <span class="small">${OR.util.esc(r.title)}</span></label>`).join('')}`,
        `<h3 class="bold">Coach IA <span class="chip">opcional</span></h3>
         <p class="small muted mt1">Requiere desplegar el Worker gratuito de Cloudflare (instrucciones en docs/DESPLIEGUE.md). Por ahora puedes saltarlo y activarlo luego en Ajustes.</p>`,
        `<h3 class="bold">Todo listo</h3>
         <p class="small muted mt1">Modo local: tus datos viven en tu dispositivo. Exporta copias desde Ajustes > Datos cuando quieras.</p>`
      ];
      root.innerHTML = `<div class="modal-bd" style="z-index:150"><div class="modal-p">
        <p class="small muted">Paso ${step + 1} de ${steps.length}</p>
        <div class="mt2">${steps[step]}</div>
        <div class="row mt3" style="justify-content:space-between">
          <button class="btn btn-s" id="ob-skip">Saltar todo</button>
          <button class="btn btn-p" id="ob-next">${step === steps.length - 1 ? 'Entrar' : 'Siguiente'}</button>
        </div></div></div>`;
      root.querySelectorAll('[data-th]').forEach(b => b.onclick = async () => {
        await OR.store.saveSettings({ theme: b.dataset.th }); render();
      });
      root.querySelectorAll('[data-house]').forEach(b => b.onclick = async () => {
        const h = houses[b.dataset.house];
        await OR.store.saveSettings({ house: b.dataset.house, wakeTime: h.wake });
        for (const r of rs) {
          const onlyOther = (r.house && r.house !== b.dataset.house);
          await OR.store.saveRoutine({ id: r.id, active: !onlyOther });
        }
        step++; render();
      });
      root.querySelector('#ob-skip').onclick = finish;
      root.querySelector('#ob-next').onclick = async () => {
        if (step === 3) {
          for (const cb of root.querySelectorAll('.ob-r'))
            await OR.store.saveRoutine({ id: cb.dataset.id, active: cb.checked });
        }
        if (step === steps.length - 1) return finish();
        step++; render();
      };
    };
    const finish = async () => {
      await OR.store.saveSettings({ onboarded: true });
      root.innerHTML = ''; OR.router.refresh();
    };
    render();
  }
  return { start };
})();
