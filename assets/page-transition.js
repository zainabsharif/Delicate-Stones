/* Page transition: a soft ivory veil with the logo and a drawn gold hairline. Only used between pages. */
(function () {
  var LOGO_SRC = './assets/logo.jpg';
  var FLAG = 'dsPageTransition';
  var EXIT_MS = 520;

  var css = '' +
    '.pt-veil{ position:fixed; inset:0; z-index:99999; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:22px;' +
    ' background:linear-gradient(rgba(255,255,255,0.35), rgba(255,255,255,0.35)), url(./assets/Background/2.png) 0 0 / 420px repeat, #f6efe2; opacity:0; visibility:hidden; pointer-events:none;' +
    ' transition:opacity .5s cubic-bezier(.4,0,.2,1), visibility 0s linear .5s; }' +
    '.pt-veil.pt-on{ opacity:1; visibility:visible; pointer-events:all; transition:opacity .5s cubic-bezier(.4,0,.2,1), visibility 0s; }' +
    '.pt-veil.pt-instant{ transition:none !important; }' +
    '.pt-veil img{ width:min(340px, 62vw); height:min(340px, 62vw); border-radius:50%; object-fit:cover; box-shadow:0 0 0 1px rgba(182,137,60,.4), 0 18px 60px rgba(182,137,60,.3);' +
    ' opacity:0; transform:scale(.94); transition:opacity .5s ease .1s, transform .7s cubic-bezier(.2,.8,.2,1) .1s; }' +
    '.pt-veil.pt-on img{ opacity:1; transform:scale(1); animation:pt-spin 2.4s linear infinite; }' +
    '@keyframes pt-spin{ to{ transform:rotate(360deg); } }' +
    '.pt-line{ width:180px; height:1px; background:linear-gradient(90deg, transparent, #b6893c, transparent); transform:scaleX(0); transition:transform .6s cubic-bezier(.65,0,.25,1) .1s; }' +
    '.pt-veil.pt-on .pt-line{ transform:scaleX(1); }';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function reduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function buildVeil() {
    var v = document.getElementById('ptVeil');
    if (v) return v;
    v = document.createElement('div');
    v.className = 'pt-veil';
    v.id = 'ptVeil';
    v.innerHTML = '<img src="' + LOGO_SRC + '" alt=""><div class="pt-line"></div>';
    document.body.appendChild(v);
    return v;
  }

  function playExit(href) {
    if (reduced()) { window.location.href = href; return; }
    var v = buildVeil();
    void v.offsetWidth;
    v.classList.add('pt-on');
    setTimeout(function () {
      try { sessionStorage.setItem(FLAG, '1'); } catch (e) {}
      window.location.href = href;
    }, EXIT_MS + 160);
  }

  // Called right after <body> opens: if we arrived via a transition, start covered.
  function earlyEnterCheck() {
    var has = false;
    try { has = sessionStorage.getItem(FLAG) === '1'; } catch (e) {}
    if (!has || reduced()) {
      try { sessionStorage.removeItem(FLAG); } catch (e) {}
      return;
    }
    var v = buildVeil();
    v.classList.add('pt-instant', 'pt-on');
  }

  function completeEnterAnimation() {
    var has = false;
    try { has = sessionStorage.getItem(FLAG) === '1'; } catch (e) {}
    if (!has) return;
    try { sessionStorage.removeItem(FLAG); } catch (e) {}
    var v = document.getElementById('ptVeil');
    if (!v) return;

    if (window.location.hash) {
      var target = document.getElementById(window.location.hash.slice(1));
      if (target) {
        var prev = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        target.scrollIntoView(true);
        document.documentElement.style.scrollBehavior = prev;
      }
    }
    setTimeout(function () {
      void v.offsetWidth;
      v.classList.remove('pt-instant');
      v.classList.remove('pt-on');
    }, 250);
  }

  function initLinks() {
    var links = document.querySelectorAll('a[href^="collections.html"], a[href^="index.html"]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
        e.preventDefault();
        playExit(this.getAttribute('href'));
      });
    }
  }

  // In-page anchors: plain smooth scroll (the nav indicator slides along); no veil.
  function initAnchorLinks() {
    var links = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
        var id = (this.getAttribute('href') || '').slice(1);
        var el = id && document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
        try { history.replaceState(null, '', '#' + id); } catch (err) {}
      });
    }
  }

  // Back/Forward cache can restore a page with the veil still covering it.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    try { sessionStorage.removeItem(FLAG); } catch (err) {}
    var v = document.getElementById('ptVeil');
    if (v) v.classList.remove('pt-on', 'pt-instant');
  });

  window.__pt = {
    earlyEnterCheck: earlyEnterCheck,
    completeEnterAnimation: completeEnterAnimation,
    initLinks: initLinks,
    initAnchorLinks: initAnchorLinks,
    playInPage: function (cb) { if (typeof cb === 'function') cb(); }
  };
})();
