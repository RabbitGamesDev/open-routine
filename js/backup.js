/* ============================================================
   backup.js — Exportación e importación con validación.
   Flujo: leer → validar → resumen → confirmar → aplicar.
   Nunca ejecuta código del archivo. Esquema versionado.
   ============================================================ */
window.OR = window.OR || {};

OR.backup = (function () {
  const SCHEMA = 1;

  async function exportJSON() {
    const data = { app: 'openrutine', schema: SCHEMA, exportedAt: new Date().toISOString(), stores: {} };
    for (const s of OR.db.STORES) {
      if (s === 'kv') { data.stores.kv = await OR.db.kvGet('__all__', null) || collectKV(); }
      else data.stores[s] = await OR.db.all(s);
    }
    return data;
  }
  async function collectKV() {
    // kv usa clave primaria 'k'; exportamos las claves conocidas
    const keys = ['settings','xp','achievements','streaks','usage'];
    const out = {};
    for (const k of keys) out[k] = await OR.db.kvGet(k, null);
    return out;
  }

  function download() {
    exportJSON().then(data => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `openrutine-backup-${OR.util.day()}.json`;
      a.click();
      OR.gamification.unlock('backup');
      OR.ui.toast('Copia de seguridad exportada');
    }).catch(e => OR.errors.show('No se pudo exportar la copia.', e));
  }

  /* Valida estructura y devuelve resumen para confirmar */
  function validate(file) {
    return new Promise((res, rej) => {
      if (file.size > 10 * 1024 * 1024) return rej(new Error('El archivo supera 10 MB.'));
      const reader = new FileReader();
      reader.onerror = () => rej(new Error('No se pudo leer el archivo.'));
      reader.onload = () => {
        let data;
        try { data = JSON.parse(reader.result); }
        catch { return rej(new Error('No es un JSON válido.')); }
        if (data.app !== 'openrutine') return rej(new Error('Este archivo no es de OpenRutine.'));
        if (typeof data.schema !== 'number' || data.schema > SCHEMA)
          return rej(new Error(`Esquema v${data.schema} más nuevo que el soportado (v${SCHEMA}). Actualiza la app.`));
        const stores = data.stores || {};
        const summary = Object.entries(stores)
          .filter(([k, v]) => Array.isArray(v))
          .map(([k, v]) => `${v.length} ${k}`).join(' · ');
        const kvCount = stores.kv ? Object.keys(stores.kv).length : 0;
        res({ data, summary: summary + (kvCount ? ` · ${kvCount} ajustes` : '') });
      };
      reader.readAsText(file);
    });
  }

  async function apply(data) {
    const s = await OR.store.settings();
    for (const [store, arr] of Object.entries(data.stores || {})) {
      if (!OR.db.STORES.includes(store)) continue;           // tiendas desconocidas: ignoradas
      if (Array.isArray(arr)) {
        if (store === 'occurrences') {
          // anti-duplicados: put con clave única routineId+date lo resuelve
          for (const item of arr) { if (item && item.id) await OR.db.put(store, item); }
        } else {
          for (const item of arr) { if (item && item.id) await OR.db.put(store, item); }
        }
      }
      if (store === 'kv' && arr && typeof arr === 'object') {
        for (const [k, v] of Object.entries(arr)) await OR.db.kvSet(k, v);
      }
    }
    await OR.store.applyTheme(await OR.store.settings());
    return s;
  }

  async function importFlow(file) {
    try {
      const { data, summary } = await validate(file);
      const ok = await OR.ui.confirm(
        `Resumen de la importación: <b>${OR.util.esc(summary)}</b>.<br>Los registros con el mismo ID se actualizarán; no se borrará nada que no esté en el archivo.`,
        { label: 'Importar' });
      if (!ok) return;
      await apply(data);
      OR.ui.toast('Datos importados correctamente');
      OR.router.refresh();
    } catch (err) {
      OR.errors.show('La importación fue rechazada por seguridad.', err);
    }
  }

  return { download, importFlow, SCHEMA };
})();
