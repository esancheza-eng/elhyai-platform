/* ============================================================
   mobile.js — ElhyAI Academy
   1) Menú ☰ para celulares (portada, cursos, validar, términos)
   2) Botones compactos (solo icono) en pantallas pequeñas
   3) Registro de la app instalable (PWA) + botón "Instalar app"
   No modifica la lógica existente de la plataforma.
   ============================================================ */
(function () {
  'use strict';

  var MOBILE = window.matchMedia('(max-width: 768px)');

  /* ── Altura real de la barra superior (para menús y pestañas) ── */
  function setNavHeight() {
    var bar = document.querySelector('.navbar, .topbar');
    if (!bar) return;
    var h = Math.round(bar.getBoundingClientRect().height) || 64;
    document.documentElement.style.setProperty('--m-nav-h', h + 'px');
  }

  /* ── Menú desplegable móvil ─────────────────────────────── */
  function buildMenu() {
    var toggle = document.querySelector('.navbar .nav-toggle');
    if (!toggle || toggle.dataset.mReady) return;
    var source = document.querySelector('.navbar .nav-menu, .navbar .nav-links');
    if (!source) return;
    toggle.dataset.mReady = '1';

    var menu = document.createElement('div');
    menu.className = 'm-menu';
    menu.setAttribute('role', 'menu');

    // Buscador de la portada (si existe)
    var search = document.getElementById('nav-q');
    if (search) {
      var s = document.createElement('input');
      s.type = 'search';
      s.placeholder = search.placeholder || 'Buscar cursos...';
      s.setAttribute('style', 'width:100%;padding:.8rem 1rem;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:#0e2040;color:#f0f4ff;margin-bottom:.5rem;outline:none');
      s.addEventListener('input', function () {
        search.value = s.value;
        if (typeof window.filterCourses === 'function') window.filterCourses(s.value);
      });
      s.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          closeMenu();
          var c = document.getElementById('cursos');
          if (c) c.scrollIntoView({ behavior: 'smooth' });
        }
      });
      menu.appendChild(s);
    }

    // Enlaces
    source.querySelectorAll('a').forEach(function (a) {
      var l = a.cloneNode(true);
      l.removeAttribute('id');
      l.addEventListener('click', closeMenu);
      menu.appendChild(l);
    });

    // Botones de sesión (Iniciar sesión / Registrarse)
    var btns = document.querySelectorAll('.navbar .btn-nl, .navbar .btn-nr, .navbar .btn-ghost, .navbar .btn-primary');
    if (btns.length) {
      var box = document.createElement('div');
      box.className = 'm-menu-actions';
      btns.forEach(function (b) {
        var nb = document.createElement('button');
        nb.type = 'button';
        nb.textContent = b.textContent.trim();
        if (b.classList.contains('btn-nr') || b.classList.contains('btn-primary')) nb.className = 'm-primary';
        nb.addEventListener('click', function () { closeMenu(); b.click(); });
        box.appendChild(nb);
      });
      menu.appendChild(box);
    }

    document.body.appendChild(menu);

    function closeMenu() {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Menú');
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      setNavHeight();
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!menu.classList.contains('open')) return;
      if (menu.contains(e.target) || toggle.contains(e.target)) return;
      closeMenu();
    });
    MOBILE.addEventListener && MOBILE.addEventListener('change', function (q) { if (!q.matches) closeMenu(); });
  }

  /* ── Botones solo-icono: envuelve el texto en <span class="m-label"> ── */
  function wrapLabels() {
    document.querySelectorAll('.nav-actions .btn.btn-sm, .topbar-btn, .btn-menu').forEach(function (b) {
      if (b.dataset.mWrapped) return;
      b.dataset.mWrapped = '1';
      Array.prototype.slice.call(b.childNodes).forEach(function (n) {
        if (n.nodeType === 3 && n.textContent.trim()) {
          var sp = document.createElement('span');
          sp.className = 'm-label';
          sp.textContent = n.textContent;
          b.replaceChild(sp, n);
          if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', n.textContent.trim());
          if (!b.title) b.title = n.textContent.trim();
        }
      });
    });
  }

  /* ── PWA: service worker ───────────────────────────────── */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  /* ── PWA: botón "Instalar app" ─────────────────────────── */
  var deferredPrompt = null;
  var KEY = 'elhyai_install_dismissed';

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }
  function dismissed() {
    try { return Date.now() - Number(localStorage.getItem(KEY) || 0) < 7 * 864e5; } catch (e) { return false; }
  }
  function remember() {
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
  }

  function showInstallBar(isIOS) {
    if (isStandalone() || dismissed() || document.getElementById('m-install')) return;
    // Solo en páginas públicas (no interrumpir el aula ni el panel admin)
    if (document.querySelector('.topbar, #admin-app')) return;

    var bar = document.createElement('div');
    bar.id = 'm-install';
    bar.setAttribute('style', [
      'position:fixed', 'left:12px', 'right:12px',
      'bottom:calc(12px + env(safe-area-inset-bottom))',
      'z-index:2000', 'display:flex', 'align-items:center', 'gap:.75rem',
      'padding:.75rem .85rem', 'border-radius:14px',
      'background:#0a1628', 'color:#f0f4ff',
      'border:1px solid rgba(201,168,76,.35)',
      'box-shadow:0 10px 30px rgba(0,0,0,.4)',
      'font-family:inherit', 'max-width:520px', 'margin:0 auto'
    ].join(';'));

    var txt = isIOS
      ? '<b>Instala ElhyAI Academy</b><br><span style="font-size:.8rem;color:#c5d0e0">Toca <b>Compartir</b> y luego <b>"Agregar a inicio"</b></span>'
      : '<b>Instala ElhyAI Academy</b><br><span style="font-size:.8rem;color:#c5d0e0">Ábrela como app desde tu celular</span>';

    bar.innerHTML =
      '<img src="icons/icon-192.png" alt="" width="40" height="40" style="border-radius:10px;flex:0 0 auto">' +
      '<div style="flex:1;line-height:1.3;font-size:.92rem">' + txt + '</div>' +
      (isIOS ? '' : '<button type="button" id="m-install-go" style="flex:0 0 auto;padding:.55rem .9rem;border-radius:8px;border:0;font-weight:700;background:linear-gradient(135deg,#c9a84c,#e6c97a);color:#050d1a;cursor:pointer">Instalar</button>') +
      '<button type="button" id="m-install-x" aria-label="Cerrar" style="flex:0 0 auto;background:none;border:0;color:#8898b0;font-size:1.3rem;line-height:1;cursor:pointer;padding:.25rem">&times;</button>';

    document.body.appendChild(bar);

    document.getElementById('m-install-x').onclick = function () { remember(); bar.remove(); };
    var go = document.getElementById('m-install-go');
    if (go) go.onclick = function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () { deferredPrompt = null; bar.remove(); });
    };
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (MOBILE.matches) showInstallBar(false);
  });
  window.addEventListener('appinstalled', function () {
    var b = document.getElementById('m-install');
    if (b) b.remove();
  });

  function iosHint() {
    var ua = navigator.userAgent || '';
    var isIOS = /iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios/i.test(ua);
    if (isIOS && !isStandalone()) setTimeout(function () { showInstallBar(true); }, 2500);
  }

  /* ── Inicio ────────────────────────────────────────────── */
  function init() {
    setNavHeight();
    buildMenu();
    wrapLabels();
    registerSW();
    iosHint();
    window.addEventListener('resize', setNavHeight);
    window.addEventListener('scroll', setNavHeight, { passive: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
