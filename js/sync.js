/* sync.js — Capa de sincronizacion. Hoy: modo local honesto.
   Punto unico donde se conectara Supabase en la fase 2
   (schema listo en supabase/schema.sql). Sin credenciales:
   la app sigue siendo 100% funcional. */
window.OR = window.OR || {};
OR.sync = (function () {
  async function flush() {
    // Con Supabase configurado: aqui saldria la cola de cambios (outbox).
    paint();
  }
  async function paint() {
    const on = navigator.onLine;
    const dot = document.getElementById('sync-dot'), lbl = document.getElementById('sync-label');
    const dot2 = document.getElementById('sync-dot-2');
    if (dot) dot.classList.toggle('off', !on);
    if (dot2) dot2.classList.toggle('off', !on);
    if (lbl) lbl.textContent = on ? 'Local · offline-first' : 'Sin conexion (sigue funcionando)';
  }
  window.addEventListener('online', paint);
  window.addEventListener('offline', paint);
  return { flush, paint };
})();
