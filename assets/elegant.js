/* Elegant cursor (dot + ring + fading gold trail) and sliding nav indicator. Shared by all pages. */
(function () {
  var css = '' +
    'body.custom-cursor-active, body.custom-cursor-active *{ cursor:none !important; }' +
    '.cur-dot, .cur-ring{ position:fixed; top:0; left:0; pointer-events:none; z-index:10000; opacity:0; transition:opacity .3s ease; will-change:transform; }' +
    '.cur-dot{ width:10px; height:10px; margin:-5px 0 0 -5px; border-radius:50%; background:#b6893c; border:2px solid #fffaf0; box-shadow:0 0 0 1px rgba(23,20,15,.55), 0 0 12px rgba(182,137,60,.75); transition:opacity .3s ease, width .25s ease, height .25s ease, margin .25s ease; }' +
    '.cur-ring{ width:40px; height:40px; margin:-20px 0 0 -20px; border-radius:50%; border:1.5px solid rgba(160,115,40,.95); box-shadow:0 0 0 1px rgba(255,250,240,.6), inset 0 0 0 1px rgba(255,250,240,.35); background:rgba(182,137,60,0); transition:opacity .3s ease, width .35s cubic-bezier(.2,.8,.2,1), height .35s cubic-bezier(.2,.8,.2,1), margin .35s cubic-bezier(.2,.8,.2,1), background .3s ease, border-color .3s ease; }' +
    '.cur-on .cur-dot, .cur-on .cur-ring{ opacity:1; }' +
    '.cur-hover .cur-ring{ width:60px; height:60px; margin:-30px 0 0 -30px; background:rgba(182,137,60,.16); border-color:#b6893c; }' +
    '.cur-hover .cur-dot{ width:7px; height:7px; margin:-3.5px 0 0 -3.5px; }' +
    '.cur-down .cur-ring{ width:30px; height:30px; margin:-15px 0 0 -15px; }' +
    '.cur-trail{ position:fixed; inset:0; width:100vw; height:100vh; pointer-events:none; z-index:9998; }' +
    '.navlinks{ position:relative; }' +
    '.navlinks a::after{ display:none !important; }' +
    '.nav-slider{ position:absolute; left:0; bottom:0; height:1px; width:0; background:linear-gradient(90deg, transparent, #b6893c 20%, #b6893c 80%, transparent); opacity:0; pointer-events:none; transition:transform .55s cubic-bezier(.65,0,.25,1), width .55s cubic-bezier(.65,0,.25,1), opacity .3s ease; }' +
    '.navlinks a.nav-current{ color:var(--gold-dark); }';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /* ---------------- Cursor ---------------- */
  function initCursor() {
    var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;

    document.body.classList.add('custom-cursor-active');

    var dot = document.createElement('div'); dot.className = 'cur-dot';
    var ring = document.createElement('div'); ring.className = 'cur-ring';
    var canvas = document.createElement('canvas'); canvas.className = 'cur-trail';
    document.body.appendChild(canvas);
    document.body.appendChild(ring);
    document.body.appendChild(dot);
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;
    var sparks = [];
    var lastX = mx, lastY = my;
    var COLORS = ['255,236,190', '232,190,110', '255,250,235', '214,160,72'];

    function spawn(x, y, speed) {
      var n = speed > 14 ? 2 : 1;
      for (var i = 0; i < n; i++) {
        sparks.push({
          x: x + (Math.random() - 0.5) * 12,
          y: y + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -0.15 - Math.random() * 0.45,
          size: 4 + Math.random() * 7,
          born: performance.now(),
          life: 700 + Math.random() * 600,
          rot: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.04,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          phase: Math.random() * 6.28
        });
      }
      if (sparks.length > 140) sparks.splice(0, sparks.length - 140);
    }

    // Four-point star with concave sides
    function star(cx, cy, r) {
      ctx.beginPath();
      for (var k = 0; k < 4; k++) {
        var a = k * Math.PI / 2;
        var ax = Math.cos(a) * r, ay = Math.sin(a) * r;
        var b = a + Math.PI / 4;
        var bx = Math.cos(b) * r * 0.22, by = Math.sin(b) * r * 0.22;
        if (k === 0) ctx.moveTo(cx + ax, cy + ay); else ctx.lineTo(cx + ax, cy + ay);
        ctx.lineTo(cx + bx, cy + by);
      }
      ctx.closePath();
    }

    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      var dx = mx - lastX, dy = my - lastY, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 5) { spawn(mx, my, d); lastX = mx; lastY = my; }
      document.body.classList.add('cur-on');
      var t = e.target;
      var hov = t && t.closest && t.closest('a, button, input, select, textarea, label, [role="button"], .card, .bestseller');
      document.body.classList.toggle('cur-hover', !!hov);
    }, { passive: true });
    window.addEventListener('mousedown', function () { document.body.classList.add('cur-down'); });
    window.addEventListener('mouseup', function () { document.body.classList.remove('cur-down'); });
    document.addEventListener('mouseleave', function () { document.body.classList.remove('cur-on'); });

    function frame(now) {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';

      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      for (var i = sparks.length - 1; i >= 0; i--) {
        var p = sparks[i];
        var t = (now - p.born) / p.life;
        if (t >= 1) { sparks.splice(i, 1); continue; }
        p.x += p.vx; p.y += p.vy; p.rot += p.spin;
        var fade = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
        var twinkle = 0.65 + 0.35 * Math.sin(now / 90 + p.phase);
        var alpha = fade * twinkle * 0.6;
        var r = p.size * (0.5 + 0.5 * fade);
        // soft glow
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 1.8);
        g.addColorStop(0, 'rgba(' + p.color + ',' + (alpha * 0.55).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(' + p.color + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.8, 0, 6.2832); ctx.fill();
        // star body
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = 'rgba(' + p.color + ',' + alpha.toFixed(3) + ')';
        star(0, 0, r);
        ctx.fill();
        ctx.restore();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------------- Sliding nav indicator ---------------- */
  function initNavSlider() {
    var nav = document.querySelector('.navlinks');
    if (!nav) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll('a'));
    if (!links.length) return;

    var slider = document.createElement('span');
    slider.className = 'nav-slider';
    nav.appendChild(slider);

    var current = null;      // link that represents the current page/section
    var hovered = null;

    function moveTo(link) {
      if (!link) { slider.style.opacity = '0'; return; }
      slider.style.opacity = '1';
      slider.style.width = link.offsetWidth + 'px';
      slider.style.transform = 'translateX(' + link.offsetLeft + 'px)';
    }
    function settle() { moveTo(hovered || current); }

    function setCurrent(link) {
      if (link === current) return;
      current = link;
      links.forEach(function (a) { a.classList.toggle('nav-current', a === link); });
      settle();
    }

    links.forEach(function (a) {
      a.addEventListener('mouseenter', function () { hovered = a; settle(); });
      a.addEventListener('mouseleave', function () { hovered = null; settle(); });
    });

    // Page-level active link (collections page) or section-based (home page)
    var page = (location.pathname.split('/').pop() || 'index.html');
    var sectionLinks = links.filter(function (a) {
      var h = a.getAttribute('href') || '';
      return h.charAt(0) === '#' && h.length > 1 && document.getElementById(h.slice(1));
    });

    if (sectionLinks.length) {
      var ticking = false;
      var spy = function () {
        ticking = false;
        var line = window.innerHeight * 0.4;
        var found = null;
        sectionLinks.forEach(function (a) {
          var el = document.getElementById(a.getAttribute('href').slice(1));
          if (el.getBoundingClientRect().top <= line) found = a;
        });
        setCurrent(found);
      };
      window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(spy); }
      }, { passive: true });
      spy();
    } else {
      var active = nav.querySelector('a.active') ||
        links.filter(function (a) { return (a.getAttribute('href') || '').split('#')[0] === page && (a.getAttribute('href') || '').indexOf('#') < 0; })[0];
      setCurrent(active || null);
    }

    // Place with no animation on first paint, once fonts have settled
    slider.style.transition = 'none';
    settle();
    void slider.offsetWidth;
    slider.style.transition = '';
    window.addEventListener('resize', settle);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
      slider.style.transition = 'none'; settle(); void slider.offsetWidth; slider.style.transition = '';
    });
  }

  ready(function () { initCursor(); initNavSlider(); });
})();
