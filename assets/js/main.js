/* ============================================================
   Nugraha Putra — putranugra.com
   Device mockups, copy-to-clipboard, toast, theme switch.
   No dependencies.
   ============================================================ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── TOAST ───────────────────────────────────────────────── */

  var toastEl = document.querySelector('[data-toast]');
  var toastTimer = null;

  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 2000);
  }

  /* ── COPY TO CLIPBOARD ───────────────────────────────────── */

  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
    btn.addEventListener('click', function (event) {
      /* the email is a real link, so the address flows and wraps as text and
         still reaches a mail client without JS. With JS, a click copies. */
      if (btn.tagName === 'A') event.preventDefault();

      var value = btn.getAttribute('data-copy');

      function fallback() {
        var field = document.createElement('textarea');
        field.value = value;
        field.setAttribute('readonly', '');
        field.style.cssText = 'position:fixed;top:-1000px;opacity:0;';
        document.body.appendChild(field);
        field.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        document.body.removeChild(field);
        /* if the clipboard is off limits, hand the address to the mail client
           rather than flashing it in a toast the user can't select */
        if (ok) { toast('Email copied to clipboard'); }
        else { window.location.href = 'mailto:' + value; }
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value)
          .then(function () { toast('Email copied to clipboard'); })
          .catch(fallback);
      } else {
        fallback();
      }
    });
  });

  /* ── THEME SWITCH ────────────────────────────────────────────
     The <head> of every page carries a two-line copy of the read half
     of this, so a stored choice is on the element before first paint
     and the page never flashes the wrong palette. With no stored
     choice the attribute stays off and the prefers-color-scheme media
     query in styles.css decides — which is also what keeps this
     working with JS disabled.
     ────────────────────────────────────────────────────────── */

  var themeBtn = document.querySelector('[data-theme-toggle]');

  if (themeBtn) {
    var root = document.documentElement;
    var scheme = window.matchMedia('(prefers-color-scheme: dark)');

    var isDark = function () {
      var chosen = root.getAttribute('data-theme');
      return chosen ? chosen === 'dark' : scheme.matches;
    };

    var paintSwitch = function () {
      themeBtn.setAttribute('aria-checked', isDark() ? 'true' : 'false');
    };

    paintSwitch();

    themeBtn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (err) {}
      paintSwitch();
    });

    /* A page restored from the back/forward cache comes back as the exact
       DOM the reader left, and nothing in <head> runs a second time, so it
       would still be wearing the theme it had before they switched on some
       other page. Every link on this site is an ordinary link now, but the
       browser's own back button still takes that path and nothing we do in
       markup can opt out of it. pageshow is the one event that fires on a
       bfcache restore, so the stored choice gets re-read there.

       It runs on ordinary loads too, where it simply agrees with the
       <head> guard. Cheaper than reasoning about which restore paths set
       event.persisted in which browser. */
    var applyStored = function () {
      var stored = null;
      try { stored = localStorage.getItem('theme'); } catch (err) {}
      if (stored) root.setAttribute('data-theme', stored);
      else root.removeAttribute('data-theme');
      paintSwitch();
    };

    window.addEventListener('pageshow', applyStored);

    /* a reader who never touched the switch should still follow the OS
       if it flips while the page is open */
    var onSchemeChange = function () {
      if (!root.getAttribute('data-theme')) paintSwitch();
    };

    if (scheme.addEventListener) scheme.addEventListener('change', onSchemeChange);
    else if (scheme.addListener) scheme.addListener(onSchemeChange);
  }

  /* ── BAR CHART REVEAL ────────────────────────────────────────
     Bars ship at full height. We flatten them only once we know we
     can raise them again, and a timer guarantees that happens even
     if the observer never fires.
     ────────────────────────────────────────────────────────── */

  var bars = document.querySelectorAll('.cs-bar');

  if (bars.length && !reduceMotion) {
    Array.prototype.forEach.call(bars, function (bar) {
      bar.classList.add('is-pending');
    });

    var grown = false;
    var growBars = function () {
      if (grown) return;
      grown = true;
      Array.prototype.forEach.call(bars, function (bar) {
        bar.classList.remove('is-pending');
        bar.classList.add('is-growing');
      });
    };

    if ('IntersectionObserver' in window) {
      var barWatcher = new IntersectionObserver(function (entries) {
        var seen = entries.some(function (entry) { return entry.isIntersecting; });
        if (seen) { barWatcher.disconnect(); growBars(); }
      }, { threshold: 0.25 });

      Array.prototype.forEach.call(document.querySelectorAll('.cs-bars'), function (group) {
        barWatcher.observe(group);
      });
    }

    setTimeout(growBars, 2500);
  }

  /* ── SCROLL-SYNCED STEPS ─────────────────────────────────────
     A scrollable mockup that lights up the matching step beside it.
     `data-stops` holds the scroll fractions each step begins at.
     ────────────────────────────────────────────────────────── */

  var syncPane = document.querySelector('[data-scroll-sync]');

  if (syncPane) {
    var steps = document.querySelectorAll('[data-step]');
    var stops = (syncPane.getAttribute('data-stops') || '0').split(',').map(parseFloat);

    var syncSteps = function () {
      var travel = syncPane.scrollHeight - syncPane.clientHeight;
      var progress = travel > 0 ? syncPane.scrollTop / travel : 0;
      var active = 0;

      for (var i = stops.length - 1; i >= 0; i--) {
        if (progress >= stops[i]) { active = i; break; }
      }

      Array.prototype.forEach.call(steps, function (step, i) {
        step.classList.toggle('is-active', i === active);
      });
    };

    syncPane.addEventListener('scroll', syncSteps, { passive: true });
    syncSteps();
  }

  /* ── CURSOR TOOLTIP ──────────────────────────────────────── */

  var tip = document.querySelector('[data-cursor-tip]');

  if (tip && canHover) {
    var place = function (event) {
      var margin = 16;
      var w = tip.offsetWidth;
      var h = tip.offsetHeight;
      var x = event.clientX + 16;
      var y = event.clientY + 18;

      /* flip to the other side of the pointer rather than run off screen */
      if (x + w + margin > window.innerWidth) x = event.clientX - w - 16;
      if (y + h + margin > window.innerHeight) y = event.clientY - h - 16;

      tip.style.setProperty('--tip-x', x + 'px');
      tip.style.setProperty('--tip-y', y + 'px');
    };

    Array.prototype.forEach.call(document.querySelectorAll('[data-tip]'), function (el) {
      el.addEventListener('mouseenter', function (event) {
        tip.textContent = el.getAttribute('data-tip');
        place(event);
        tip.classList.add('is-visible');
      });
      el.addEventListener('mousemove', place);
      el.addEventListener('mouseleave', function () {
        tip.classList.remove('is-visible');
      });
    });

    /* the pointer can leave a box without a mouseleave when the page moves
       under it, so scrolling dismisses the tip too */
    window.addEventListener('scroll', function () {
      tip.classList.remove('is-visible');
    }, { passive: true });
  }

  /* ── NAME TYPE-ON ────────────────────────────────────────── */

  var nameEl = document.querySelector('[data-type-suffix]');

  if (nameEl) {
    var suffix = nameEl.getAttribute('data-type-suffix');
    var slot = nameEl.querySelector('[data-type-slot]');
    var shown = 0;
    var typeTimer = null;

    /* types forward or backward from wherever it currently sits, so darting
       the cursor in and out reverses mid-word instead of snapping */
    function typeTo(target, speed) {
      clearTimeout(typeTimer);
      (function tick() {
        if (shown === target) return;
        shown += shown < target ? 1 : -1;
        slot.textContent = suffix.slice(0, shown);
        typeTimer = setTimeout(tick, speed);
      })();
    }

    if (!canHover || reduceMotion) {
      /* nothing to hover with, so introduce yourself in full */
      shown = suffix.length;
      slot.textContent = suffix;
    } else {
      nameEl.addEventListener('mouseenter', function () { typeTo(suffix.length, 55); });
      nameEl.addEventListener('mouseleave', function () { typeTo(0, 28); });
    }
  }

  /* ── TIMELINE ────────────────────────────────────────────────
     A cancellable, freezable chain of delays. Freezing banks each
     pending task's remaining time instead of dropping it, so a
     paused mockup picks up mid-beat rather than restarting.
     ────────────────────────────────────────────────────────── */

  function Timeline() {
    this.tasks = [];
    this.alive = false;
    this.frozen = false;
  }

  Timeline.prototype.begin = function () {
    this.alive = true;
    this.frozen = false;
  };

  Timeline.prototype.wait = function (ms, fn) {
    var self = this;
    var task = { remaining: ms, startedAt: 0, id: null };

    task.arm = function () {
      task.startedAt = Date.now();
      task.id = setTimeout(function () {
        var i = self.tasks.indexOf(task);
        if (i !== -1) self.tasks.splice(i, 1);
        if (self.alive && !self.frozen) fn();
      }, task.remaining);
    };

    this.tasks.push(task);
    if (!this.frozen) task.arm();
  };

  Timeline.prototype.freeze = function () {
    if (this.frozen || !this.alive) return;
    this.frozen = true;
    var now = Date.now();
    this.tasks.forEach(function (task) {
      clearTimeout(task.id);
      task.remaining = Math.max(0, task.remaining - (now - task.startedAt));
    });
  };

  Timeline.prototype.thaw = function () {
    if (!this.frozen || !this.alive) return;
    this.frozen = false;
    this.tasks.forEach(function (task) { task.arm(); });
  };

  Timeline.prototype.end = function () {
    this.alive = false;
    this.frozen = false;
    this.tasks.forEach(function (task) { clearTimeout(task.id); });
    this.tasks = [];
  };

  /* ── FAKE CURSOR CLICK ───────────────────────────────────── */

  function clickAt(timeline, screen, xRatio, yRatio, done) {
    var pointer = screen.querySelector('[data-pointer]');
    var ripple = screen.querySelector('[data-ripple]');
    if (!pointer || !ripple) { done(); return; }

    var rect = screen.getBoundingClientRect();
    var x = xRatio * rect.width;
    var y = yRatio * rect.height;

    pointer.style.transition = 'none';
    pointer.style.left = (x - 20) + 'px';
    pointer.style.top = (y - 14) + 'px';
    pointer.classList.add('is-visible');

    timeline.wait(80, function () {
      pointer.style.transition = 'left 300ms ease, top 300ms ease, opacity 200ms ease, transform 150ms ease';
      pointer.style.left = x + 'px';
      pointer.style.top = y + 'px';

      timeline.wait(350, function () {
        pointer.classList.add('is-pressing');
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('is-popping');

        timeline.wait(200, function () {
          pointer.classList.remove('is-pressing');

          timeline.wait(200, function () {
            pointer.classList.remove('is-visible');
            pointer.style.transition = '';
            ripple.classList.remove('is-popping');
            done();
          });
        });
      });
    });
  }

  function resetCursor(screen) {
    if (!screen) return;
    var pointer = screen.querySelector('[data-pointer]');
    var ripple = screen.querySelector('[data-ripple]');
    if (pointer) {
      pointer.classList.remove('is-visible', 'is-pressing');
      pointer.style.transition = '';
    }
    if (ripple) ripple.classList.remove('is-popping');
  }

  /* ── AUTO SCROLL (long screenshots) ──────────────────────────
     Time-based, not pixels-per-frame: a 120Hz display would
     otherwise run at double speed. Duration scales with distance
     so a 6000px landing page and a 500px app screen both read at
     a comfortable pace.
     ────────────────────────────────────────────────────────── */

  function passDuration(travel) {
    return Math.min(9000, Math.max(2500, (travel / 130) * 1000));
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function Scroller(img, viewport, timeline) {
    this.img = img;
    this.viewport = viewport;
    this.timeline = timeline;
    this.raf = null;
    this.alive = false;
    this.wanted = false;
    this.frozen = false;
    this.onReturn = null;
  }

  Scroller.prototype.maxOffset = function () {
    if (!this.img.naturalWidth) return 0;
    var box = this.viewport.getBoundingClientRect();
    var rendered = this.img.naturalHeight * (box.width / this.img.naturalWidth);
    return Math.max(0, rendered - box.height);
  };

  Scroller.prototype.apply = function (y) {
    this.img.style.transform = 'translateY(-' + y + 'px)';
  };

  Scroller.prototype.run = function (from, to, duration, done) {
    var self = this;
    var last = null;
    var elapsed = 0;

    function frame(now) {
      if (!self.alive) return;
      if (last === null) last = now;

      /* clamped so a backgrounded tab resumes instead of jumping to the end */
      var dt = Math.min(100, now - last);
      last = now;
      if (!self.frozen) elapsed += dt;

      var t = Math.min(1, elapsed / duration);
      self.apply(from + (to - from) * easeInOut(t));

      if (t < 1) { self.raf = requestAnimationFrame(frame); }
      else { done(); }
    }

    this.raf = requestAnimationFrame(frame);
  };

  Scroller.prototype.cycle = function () {
    var self = this;
    var travel = this.maxOffset();

    if (travel <= 0) {
      /* nothing taller than the viewport to scroll. Hand control back rather
         than stranding a deck that is waiting on a pass that never finishes. */
      if (this.onReturn) this.onReturn();
      return;
    }

    var down = passDuration(travel);

    this.run(0, travel, down, function () {
      self.timeline.wait(1000, function () {
        self.run(travel, 0, down * 0.65, function () {
          self.timeline.wait(800, function () {
            if (self.onReturn) { self.onReturn(); return; }
            self.cycle();
          });
        });
      });
    });
  };

  Scroller.prototype.start = function () {
    var self = this;
    this.wanted = true;

    function go() {
      if (!self.wanted || self.alive) return;
      self.alive = true;
      self.apply(0);
      self.cycle();
    }

    if (this.img.complete && this.img.naturalWidth) { go(); }
    else { this.img.addEventListener('load', go, { once: true }); }
  };

  Scroller.prototype.stop = function () {
    this.wanted = false;
    this.alive = false;
    this.frozen = false;
    cancelAnimationFrame(this.raf);
    this.apply(0);
  };

  /* ── SLIDE DECK ──────────────────────────────────────────── */

  function slidesOf(screen) {
    return Array.prototype.slice.call(screen.querySelectorAll('.slide'));
  }

  function show(slides, index) {
    slides.forEach(function (slide, i) {
      slide.classList.toggle('is-active', i === index);
    });
  }

  /* reset a slide without the cross-fade, so looping back is invisible */
  function snapOut(slide) {
    slide.classList.add('no-fade');
    slide.classList.remove('is-active');
    void slide.offsetHeight;
    slide.classList.remove('no-fade');
  }

  /* ── MOCKUP: SLIDE DECK ──────────────────────────────────────
     Driven by markup, so one engine serves the homepage box and the
     case study pages:
       data-dwell   "1000,1000,1000,1000"          ms held per slide
       data-clicks  "0:0.931,0.057 2:0.917,0.885"  slide : x , y ratios
     ────────────────────────────────────────────────────────── */

  function parseDwell(value, count) {
    var parts = (value || '').split(',');
    var out = [];
    for (var i = 0; i < count; i++) {
      var ms = parseInt(parts[i], 10);
      out.push(isNaN(ms) ? 1000 : ms);
    }
    return out;
  }

  function parseClicks(value) {
    var out = {};
    (value || '').trim().split(/\s+/).forEach(function (entry) {
      var m = entry.match(/^(\d+):([\d.]+),([\d.]+)$/);
      if (m) out[m[1]] = { x: parseFloat(m[2]), y: parseFloat(m[3]) };
    });
    return out;
  }

  function deckMock(card) {
    var screen = card.querySelector('[data-screen]');
    var slides = slidesOf(screen);
    var timeline = new Timeline();
    var current = 0;

    var DWELL = parseDwell(card.getAttribute('data-dwell'), slides.length);
    var CLICKS = parseClicks(card.getAttribute('data-clicks'));

    function goTo(next) {
      if (current === slides.length - 1 && next === 0) snapOut(slides[current]);
      show(slides, next);
      current = next;
    }

    function loop() {
      var next = (current + 1) % slides.length;
      timeline.wait(DWELL[current], function () {
        var spot = CLICKS[current];
        if (spot) {
          clickAt(timeline, screen, spot.x, spot.y, function () { goTo(next); loop(); });
        } else {
          goTo(next);
          loop();
        }
      });
    }

    return {
      start: function () { timeline.begin(); loop(); },
      stop: function () {
        timeline.end();
        resetCursor(screen);
        show(slides, 0);
        current = 0;
      },
      freeze: function () { timeline.freeze(); },
      thaw: function () { timeline.thaw(); }
    };
  }

  /* ── MOCKUP: SCROLLING SCREENSHOT ─────────────────────────── */

  function scrollerMock(card) {
    var viewport = card.querySelector('.phone__screen');
    var img = card.querySelector('[data-scroller]');
    var timeline = new Timeline();
    var scroller = new Scroller(img, viewport, timeline);

    return {
      start: function () { timeline.begin(); scroller.start(); },
      stop: function () { timeline.end(); scroller.stop(); },
      freeze: function () { timeline.freeze(); scroller.frozen = true; },
      thaw: function () { timeline.thaw(); scroller.frozen = false; }
    };
  }

  /* ── MOCKUP: GUIDED TOUR ─────────────────────────────────────
     A deck whose final screen scrolls before looping back.
     ────────────────────────────────────────────────────────── */

  function tourMock(card) {
    var screen = card.querySelector('[data-screen]');
    var slides = slidesOf(screen);
    var homeSlide = slides[3];
    var homeImg = homeSlide.querySelector('[data-scroller]');
    var timeline = new Timeline();
    var scroller = new Scroller(homeImg, homeSlide, timeline);
    var current = 0;

    var DWELL = [1000, 1000, 2000, 2000];
    /* vertical position of the three outlet rows in the list screenshot */
    var OUTLET_Y = [0.189, 0.302, 0.415];

    function goTo(next) {
      if (current === 3 && next === 0) snapOut(slides[3]);
      show(slides, next);
      current = next;
    }

    function loop() {
      var next = (current + 1) % slides.length;
      timeline.wait(DWELL[current], function () {
        /* tapping an outlet in the list is the one beat that needs a cursor */
        if (current === 2) {
          var y = OUTLET_Y[Math.floor(Math.random() * OUTLET_Y.length)] + 0.02;
          var x = 0.16 + Math.random() * 0.42;
          clickAt(timeline, screen, x, y, function () {
            goTo(3);
            timeline.wait(1000, function () {
              scroller.onReturn = function () {
                scroller.stop();
                goTo(0);
                loop();
              };
              scroller.start();
            });
          });
        } else {
          goTo(next);
          loop();
        }
      });
    }

    return {
      start: function () { timeline.begin(); loop(); },
      stop: function () {
        timeline.end();
        scroller.stop();
        resetCursor(screen);
        show(slides, 0);
        current = 0;
      },
      freeze: function () { timeline.freeze(); scroller.frozen = true; },
      thaw: function () { timeline.thaw(); scroller.frozen = false; }
    };
  }

  /* ── WIRING ──────────────────────────────────────────────── */

  var BUILDERS = {
    deck: deckMock,
    scroller: scrollerMock,
    tour: tourMock
  };

  /* start/stop come from two places once the observer is in play, and
     freeze/thaw only mean anything while something is running */
  function guard(mock) {
    var running = false;
    return {
      start: function () { if (!running) { running = true; mock.start(); } },
      stop: function () { if (running) { running = false; mock.stop(); } },
      freeze: function () { if (running) mock.freeze(); },
      thaw: function () { if (running) mock.thaw(); }
    };
  }

  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-mock]'));

  if (!reduceMotion) {
    /* every mockup plays on its own. The observer isn't a trigger, it only
       parks whatever has scrolled out of sight so idle rAF loops don't run. */
    var observer = 'IntersectionObserver' in window
      ? new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            var mock = entry.target.__mock;
            if (!mock) return;
            if (entry.isIntersecting) { mock.start(); } else { mock.stop(); }
          });
        }, { threshold: 0.01 })
      : null;

    cards.forEach(function (card) {
      var build = BUILDERS[card.getAttribute('data-mock')];
      if (!build) return;

      var mock = guard(build(card));
      card.__mock = mock;
      mock.start();

      if (observer) observer.observe(card);

      /* hovering raises the title plate over the mockup, so hold the
         mockup still while it's being read */
      if (canHover && card.hasAttribute("data-hover-freeze")) {
        card.addEventListener('mouseenter', mock.freeze);
        card.addEventListener('mouseleave', mock.thaw);
        card.addEventListener('focus', mock.freeze);
        card.addEventListener('blur', mock.thaw);
      }
    });
  }

})();
