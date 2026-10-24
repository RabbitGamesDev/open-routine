/* app.js — Arranque de OpenRutine */
(function () {
  async function boot() {
    OR.errors.install();
    try {
      const s = await OR.store.settings();
      OR.util.setTZ(s.tz);
      OR.store.applyTheme(s);
      document.getElementById('sb-date').textContent =
        new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });
      OR.sync.paint();
      await OR.seed.firstRun();
      OR.router.start();
      await OR.onboarding.start();
      document.getElementById('btn-add').onclick = () => OR.views.taskModal();
      const splash = document.getElementById('splash');
      setTimeout(() => { splash.classList.add('out'); setTimeout(() => splash.remove(), 600); }, 700);
      if ('serviceWorker' in navigator && location.protocol.startsWith('http'))
        navigator.serviceWorker.register('sw.js').catch(() => {});
    } catch (err) {
      OR.errors.show('Error al iniciar OpenRutine. Recarga la pagina.', err);
    }
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
