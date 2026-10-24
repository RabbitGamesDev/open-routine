/* ============================================================
   errors.js — Alarma flotante de errores con flip 3D.
   OR.errors.show("mensaje claro", errorCrudo)
   ============================================================ */
window.OR = window.OR || {};
OR.errors = (function () {
  const root = () => document.getElementById('toasts');

  function show(friendly, raw) {
    if (!root()) return console.error(friendly, raw);
    const rawText = raw && raw.stack ? raw.stack : String(raw || 'Error desconocido');
    const el = document.createElement('div');
    el.className = 'toast-err shake';
    el.setAttribute('role', 'alert');
    el.innerHTML = `
      <div class="tflip">
        <div class="tface">
          <div class="row" style="align-items:flex-start">
            <div style="width:36px;height:36px;border-radius:12px;background:rgba(239,68,68,.2);display:grid;place-items:center;flex-shrink:0">
              <i data-lucide="alarm-clock" class="w-5 h-5" style="color:#fca5a5"></i>
            </div>
            <div style="flex:1;min-width:0">
              <p class="bold" style="font-size:.85rem;color:#fee2e2">¡Algo falló!</p>
              <p style="font-size:.8rem;line-height:1.35;margin-top:.15rem">${OR.util.esc(friendly)}</p>
            </div>
          </div>
          <div class="row" style="justify-content:flex-end;margin-top:.7rem;gap:.5rem">
            <button class="btn btn-s t-flip" style="font-size:.75rem;padding:.35rem .7rem">
              <i data-lucide="rotate-3d" class="w-3.5 h-3.5"></i> Detalle técnico</button>
            <button class="btn t-close" style="font-size:.75rem;padding:.35rem .7rem;background:rgba(239,68,68,.3);color:#fecaca">Cerrar</button>
          </div>
        </div>
        <div class="tface tback"><b>⚠ Error crudo</b>
${OR.util.esc(rawText)}</div>
      </div>`;
    root().appendChild(el);
    lucide.createIcons({}, el);
    el.querySelector('.t-close').onclick = () => dismiss(el);
    el.querySelector('.t-flip').onclick = () => el.classList.toggle('flipped');
    setTimeout(() => dismiss(el), 15000);
  }

  function dismiss(el) {
    if (!el.isConnected) return;
    el.style.transition = 'opacity .3s, transform .3s';
    el.style.opacity = '0'; el.style.transform = 'translateY(-10px)';
    setTimeout(() => el.remove(), 320);
  }

  function install() {
    window.addEventListener('error', e => show('Error inesperado. Si persiste, recarga la app.', e.error || e.message));
    window.addEventListener('unhandledrejection', e =>
      show('Una operación falló (red, Coach o sincronización). Tus datos locales están a salvo.', e.reason));
  }
  return { show, install };
})();
