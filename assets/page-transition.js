(function () {
  var TILE_COLS = 6;
  var TILE_ROWS = 6;
  var LOGO_SRC = './assets/logo.jpg';
  var FLAG = 'dsPageTransition';

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function buildOverlay() {
    var overlay = document.getElementById('ptOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.className = 'pt-overlay';
    overlay.id = 'ptOverlay';

    var grid = document.createElement('div');
    grid.className = 'pt-logo-grid';
    grid.id = 'ptGrid';

    for (var r = 0; r < TILE_ROWS; r++) {
      for (var c = 0; c < TILE_COLS; c++) {
        var tile = document.createElement('div');
        tile.className = 'pt-tile';
        var posX = (c / (TILE_COLS - 1)) * 100;
        var posY = (r / (TILE_ROWS - 1)) * 100;
        tile.style.backgroundImage = 'url(' + LOGO_SRC + ')';
        tile.style.backgroundPosition = posX + '% ' + posY + '%';
        var dx = c - (TILE_COLS - 1) / 2;
        var dy = r - (TILE_ROWS - 1) / 2;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var mag = 30 + Math.random() * 30;
        tile.style.setProperty('--tile-out', 'translate(' + ((dx / dist) * mag).toFixed(1) + 'px,' + ((dy / dist) * mag).toFixed(1) + 'px)');
        tile.style.setProperty('--tile-rot', (Math.random() * 16 - 8).toFixed(1) + 'deg');
        grid.appendChild(tile);
      }
    }

    var sparkleLayer = document.createElement('div');
    sparkleLayer.className = 'pt-sparkle-layer';
    sparkleLayer.id = 'ptSparkleLayer';

    overlay.appendChild(grid);
    overlay.appendChild(sparkleLayer);
    document.body.appendChild(overlay);
    return overlay;
  }

  function spawnBurstSparkles(count) {
    var layer = document.getElementById('ptSparkleLayer');
    if (!layer) return;
    for (var i = 0; i < count; i++) {
      var s = document.createElement('div');
      s.className = 'sparkle sparkle-burst';
      var angle = Math.random() * Math.PI * 2;
      var dist = 90 + Math.random() * 220;
      var size = 6 + Math.random() * 11;
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.left = '50%';
      s.style.top = '50%';
      s.style.setProperty('--tx', (Math.cos(angle) * dist).toFixed(1) + 'px');
      s.style.setProperty('--ty', (Math.sin(angle) * dist).toFixed(1) + 'px');
      s.style.animationDelay = Math.floor(Math.random() * 140) + 'ms';
      layer.appendChild(s);
      (function (el) { setTimeout(function () { el.remove(); }, 1200); })(s);
    }
  }

  function playExit(targetHref) {
    if (prefersReducedMotion()) {
      window.location.href = targetHref;
      return;
    }
    var overlay = buildOverlay();
    var grid = document.getElementById('ptGrid');
    grid.classList.remove('pt-burst', 'pt-zoom');
    void grid.offsetWidth;
    overlay.classList.add('pt-show');

    requestAnimationFrame(function () {
      grid.classList.add('pt-burst');
      spawnBurstSparkles(24);
    });

    setTimeout(function () {
      grid.classList.add('pt-zoom');
      spawnBurstSparkles(18);
    }, 380);

    setTimeout(function () {
      try { sessionStorage.setItem(FLAG, '1'); } catch (e) {}
      window.location.href = targetHref;
    }, 950);
  }

  var inPageBusy = false;

  function playInPage(callback) {
    if (prefersReducedMotion() || inPageBusy) {
      if (typeof callback === 'function') callback();
      return;
    }
    inPageBusy = true;

    var overlay = buildOverlay();
    var grid = document.getElementById('ptGrid');
    grid.style.display = '';
    grid.classList.remove('pt-burst', 'pt-zoom');
    void grid.offsetWidth;
    overlay.classList.remove('pt-enter-open');
    overlay.classList.add('pt-show');

    requestAnimationFrame(function () {
      grid.classList.add('pt-burst');
      spawnBurstSparkles(20);
    });

    setTimeout(function () {
      grid.classList.add('pt-zoom');
      spawnBurstSparkles(14);
    }, 380);

    setTimeout(function () {
      if (typeof callback === 'function') callback();
      grid.style.display = 'none';
      spawnBurstSparkles(26);
      overlay.classList.add('pt-enter-open');
      setTimeout(function () {
        overlay.classList.remove('pt-show', 'pt-enter-open');
        grid.style.display = '';
        grid.classList.remove('pt-burst', 'pt-zoom');
        inPageBusy = false;
      }, 700);
    }, 950);
  }

  function earlyEnterCheck() {
    var hasFlag = false;
    try { hasFlag = sessionStorage.getItem(FLAG) === '1'; } catch (e) {}
    if (!hasFlag || prefersReducedMotion()) {
      try { sessionStorage.removeItem(FLAG); } catch (e) {}
      return;
    }
    var overlay = buildOverlay();
    document.getElementById('ptGrid').style.display = 'none';
    overlay.classList.add('pt-show');
  }

  function completeEnterAnimation() {
    var hasFlag = false;
    try { hasFlag = sessionStorage.getItem(FLAG) === '1'; } catch (e) {}
    if (!hasFlag) return;
    try { sessionStorage.removeItem(FLAG); } catch (e) {}

    var overlay = document.getElementById('ptOverlay');
    if (!overlay) return;

    if (window.location.hash) {
      var target = document.getElementById(window.location.hash.slice(1));
      if (target) {
        var prevBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        target.scrollIntoView(true);
        document.documentElement.style.scrollBehavior = prevBehavior;
      }
    }

    setTimeout(function () {
      spawnBurstSparkles(30);
      overlay.classList.add('pt-enter-open');
      setTimeout(function () {
        overlay.classList.remove('pt-show', 'pt-enter-open');
        var grid = document.getElementById('ptGrid');
        if (grid) grid.style.display = '';
      }, 700);
    }, 200);
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

  function initAnchorLinks() {
    var links = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (!href || href.length < 2) continue;
      links[i].addEventListener('click', function (e) {
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
        var targetEl = document.getElementById(this.getAttribute('href').slice(1));
        if (!targetEl) return;
        e.preventDefault();
        playInPage(function () {
          var prevBehavior = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = 'auto';
          targetEl.scrollIntoView(true);
          document.documentElement.style.scrollBehavior = prevBehavior;
        });
      });
    }
  }

  // Going Back/Forward restores the page exactly as it was left — mid exit-animation,
  // with the overlay covering everything. Clear it whenever a page comes back from that cache.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    try { sessionStorage.removeItem(FLAG); } catch (err) {}
    inPageBusy = false;
    var overlay = document.getElementById('ptOverlay');
    if (!overlay) return;
    overlay.classList.remove('pt-show', 'pt-enter-open');
    var grid = document.getElementById('ptGrid');
    if (grid) {
      grid.classList.remove('pt-burst', 'pt-zoom');
      grid.style.display = '';
    }
  });

  window.__pt = {
    earlyEnterCheck: earlyEnterCheck,
    completeEnterAnimation: completeEnterAnimation,
    initLinks: initLinks,
    initAnchorLinks: initAnchorLinks,
    playInPage: playInPage
  };
})();
