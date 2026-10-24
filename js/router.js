/* ============================================================
   router.js — Navegación por hash con vistas diferidas.
   Añadir módulo = 1 archivo en js/views + 1 línea aquí.
   ============================================================ */
window.OR = window.OR || {};

OR.router = (function () {
  const MODULES = {
    '/inicio':    { title: 'Inicio',       icon: 'home',      file: 'inicio',    mobile: true },
    '/misiones':  { title: 'Misiones',     icon: 'target',    file: 'misiones',  mobile: true },
    '/rutinas':   { title: 'Rutinas',      icon: 'repeat',    file: 'rutinas',   mobile: true },
    '/rgs':       { title: 'RGS Labs',     icon: 'terminal',  file: 'rgs',       mobile: true },
    '/academico': { title: 'Académico',    icon: 'graduation-cap', file: 'academico', mobile: false },
    '/progreso':  { title: 'Progreso',     icon: 'bar-chart-3', file: 'progreso',  mobile: false },
    '/logros':    { title: 'Logros',       icon: 'trophy',    file: 'logros',    mobile: false },
    '/coach':     { title: 'Coach IA',     icon: 'sparkles',  file: 'coach',     mobile: true },
    '/ajustes':   { title: 'Ajustes',      icon: 'settings',  file: 'ajustes',   mobile: false },
  };
  const MORE = ['/academico', '/progreso', '/logros', '/ajustes'];

  function current() {
    const h = location.hash.replace('#', '') || '/inicio';
    return MODULES[h] ? h : '/inicio';
  }

  function navHTML(path) {
    const item = (p, r) => `<a href="#${p}" class="navlink ${p === path ? 'active' : ''}" data-path="${p}">
      ${OR.ui.icon(r.icon)}<span>${r.title}</span></a>`;
    return Object.entries(MODULES).map(([p, r]) => item(p, r)).join('');
  }
  function mobileHTML(path) {
    const main = Object.entries(MODULES).filter(([, r]) => r.mobile);
    const item = (p, r) => `<a href="#${p}" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:.55rem 0;color:${p === path ? 'var(--accent-2)' : 'var(--text-2)'}">
      ${OR.ui.icon(r.icon)}<span style="font-size:.62rem;font-weight:700">${r.title}</span></a>`;
    const moreActive = MORE.includes(path);
    const moreBtn = `<button id="more-btn" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:.55rem 0;color:${moreActive ? 'var(--accent-2)' : 'var(--text-2)'}">
      ${OR.ui.icon('layout-grid')}<span style="font-size:.62rem;font-weight:700">Más</span></button>`;
    return main.map(([p, r]) => item(p, r)).join('') + moreBtn;
  }

  async function render() {
    const path = current();
    const mod = MODULES[path];
    try {
      const view = document.getElementById('view');
      view.innerHTML = `<div class="skeleton" style="height:120px"></div><div class="skeleton mt2" style="height:220px"></div>`;
      await OR.views[mod.file](view);                 // cada vista pinta en #view
      document.getElementById('view-title').textContent = mod.title;
      document.title = `OpenRutine — ${mod.title}`;
      document.getElementById('nav').innerHTML = navHTML(path);
      const bn = document.getElementById('bottomnav');
      bn.innerHTML = `<div class="row wfull safe-b" style="justify-content:space-around">${mobileHTML(path)}</div>`;
      const moreBtn = document.getElementById('more-btn');
      if (moreBtn) moreBtn.onclick = showMoreSheet;
      lucide.createIcons();
      window.scrollTo({ top: 0 });
      closeSidebar();
    } catch (err) {
      OR.errors.show(`No se pudo cargar "${mod.title}".`, err);
    }
  }

  function showMoreSheet() {
    const items = MORE.map(p => MODULES[p]);
    OR.ui.modal(`
      <h3 class="bold mb2">Más módulos</h3>
      <div class="grid" style="gap:.5rem">
        ${items.map((r, i) => `<a href="#${MORE[i]}" class="navlink" onclick="OR.ui.close()">${OR.ui.icon(r.icon)}<span>${r.title}</span></a>`).join('')}
      </div>`);
  }

  function openSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('scrim').classList.add('on'); }
  function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('scrim').classList.remove('on'); }

  function refresh() { render(); }
  function start() {
    window.addEventListener('hashchange', render);
    document.getElementById('scrim').onclick = closeSidebar;
    document.getElementById('burger').onclick = openSidebar;
    if (!location.hash) location.hash = '#/inicio';
    render();
  }
  return { start, refresh, MODULES };
})();
