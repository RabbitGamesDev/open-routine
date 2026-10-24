/* ============================================================
   ui.js — Modales, toasts de éxito, confirmaciones, helpers DOM.
   ============================================================ */
window.OR = window.OR || {};
OR.ui = (function () {
  function modal(html, { onOpen } = {}) {
    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="modal-bd" id="m-bd"><div class="modal-p" role="dialog" aria-modal="true">${html}</div></div>`;
    lucide.createIcons({}, root);
    const bd = document.getElementById('m-bd');
    bd.addEventListener('click', e => { if (e.target === bd) close(); });
    const panel = bd.firstElementChild;
    panel.style.animation = 'fadeUp .3s cubic-bezier(.2,.8,.2,1)';
    onOpen && onOpen(panel);
    return panel;
  }
  function close() { document.getElementById('modal-root').innerHTML = ''; }

  function toast(msg, icon = 'check-circle-2') {
    const root = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast-ok';
    el.innerHTML = `<i data-lucide="${icon}" class="w-4.5 h-4.5" style="width:18px;height:18px"></i><span style="font-size:.85rem">${OR.util.esc(msg)}</span>`;
    root.appendChild(el);
    lucide.createIcons({}, el);
    setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 320); }, 3200);
  }

  function confirm(message, { danger = false, label = 'Confirmar' } = {}) {
    return new Promise(res => {
      const panel = modal(`
        <h3 class="bold" style="font-size:1.05rem">${danger ? '⚠️ ' : ''}¿Confirmas?</h3>
        <p class="muted small mt1">${OR.util.esc(message)}</p>
        <div class="row mt3" style="justify-content:flex-end">
          <button class="btn btn-s" id="c-no">Cancelar</button>
          <button class="btn ${danger ? 'btn-d' : 'btn-p'}" id="c-yes">${label}</button>
        </div>`);
      panel.querySelector('#c-no').onclick = () => { close(); res(false); };
      panel.querySelector('#c-yes').onclick = () => { close(); res(true); };
    });
  }

  const icon = (n, cls = '') => `<i data-lucide="${n}" class="${cls}" style="width:18px;height:18px"></i>`;
  const progress = pct => `<div class="progress"><div style="width:${Math.min(100, pct)}%"></div></div>`;
  const empty = (iconName, title, sub, actionHtml = '') => `
    <div class="empty"><i data-lucide="${iconName}"></i>
      <p class="bold">${title}</p><p class="small">${sub}</p>${actionHtml}</div>`;

  return { modal, close, toast, confirm, icon, progress, empty };
})();
