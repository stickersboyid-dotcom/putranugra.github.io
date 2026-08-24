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

  /* ── TABS ────────────────────────────────────────────────────
     Project / Writing over one panel. Real tab semantics, so the two
     pills behave the way a keyboard expects: one stop in the tab
     order, arrows to move between them, Home/End to jump.

     The plate moves the instant the pill is pressed, before the panel
     has finished swapping. The control has to answer immediately; the
     content is allowed to take its time.

     Which tab you were on is remembered for the session, so opening an
     article and coming back does not drop you on Project again.
     ────────────────────────────────────────────────────────── */

  var tabList = document.querySelector('[role="tablist"]');

  if (tabList) {
    var tabs = Array.prototype.slice.call(tabList.querySelectorAll('[role="tab"]'));
    var thumb = tabList.querySelector('.tabs__thumb');
    var swapping = false;

    var panelFor = function (tab) {
      return document.getElementById(tab.getAttribute('aria-controls'));
    };

    var currentTab = function () {
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].getAttribute('aria-selected') === 'true') return tabs[i];
      }
      return tabs[0];
    };

    var placeThumb = function (tab) {
      if (!thumb) return;
      thumb.style.setProperty('--thumb-w', tab.offsetWidth + 'px');
      thumb.style.setProperty('--thumb-x', tab.offsetLeft + 'px');
    };

    /* numbering the children once is what the stagger delay counts off */
    Array.prototype.forEach.call(document.querySelectorAll('[data-stagger]'), function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty('--i', i);
      });
    });

    var reveal = function (panel) {
      panel.classList.remove('is-leaving');
      panel.hidden = false;
      if (reduceMotion) return;
      /* re-adding a class that is already there will not replay an
         animation, so it comes off and the reflow is forced first */
      panel.classList.remove('is-entering');
      void panel.offsetWidth;
      panel.classList.add('is-entering');
    };

    /* short name, because it is also what the <head> writes onto <html> */
    var nameOf = function (tab) { return tab.id.replace('tab-', ''); };

    var remember = function (tab) {
      document.documentElement.setAttribute('data-tab', nameOf(tab));
      try { sessionStorage.setItem('tab', nameOf(tab)); } catch (err) {}
    };

    var select = function (tab, moveFocus) {
      var previous = currentTab();

      if (tab !== previous && !swapping) {
        previous.setAttribute('aria-selected', 'false');
        previous.tabIndex = -1;
        tab.setAttribute('aria-selected', 'true');
        tab.tabIndex = 0;
        placeThumb(tab);
        remember(tab);

        var outgoing = panelFor(previous);
        var incoming = panelFor(tab);

        if (reduceMotion) {
          outgoing.hidden = true;
          reveal(incoming);
        } else {
          swapping = true;
          outgoing.classList.add('is-leaving');
          setTimeout(function () {
            outgoing.classList.remove('is-leaving');
            outgoing.hidden = true;
            reveal(incoming);
            swapping = false;
          }, 110);
        }
      }

      if (moveFocus) tab.focus();
    };

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { select(tab, false); });
    });

    tabList.addEventListener('keydown', function (event) {
      var at = tabs.indexOf(document.activeElement);
      if (at === -1) return;

      var next = null;
      if (event.key === 'ArrowRight') next = tabs[(at + 1) % tabs.length];
      else if (event.key === 'ArrowLeft') next = tabs[(at - 1 + tabs.length) % tabs.length];
      else if (event.key === 'Home') next = tabs[0];
      else if (event.key === 'End') next = tabs[tabs.length - 1];
      if (!next) return;

      event.preventDefault();
      select(next, true);
    });

    /* starting state, painted rather than animated */
    var opening = currentTab();

    try {
      var remembered = sessionStorage.getItem('tab');
      if (remembered) {
        var match = document.getElementById('tab-' + remembered.replace('tab-', ''));
        if (match && tabs.indexOf(match) !== -1) opening = match;
      }
    } catch (err) {}

    tabs.forEach(function (tab) {
      var on = tab === opening;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      panelFor(tab).hidden = !on;
    });

    if (thumb) {
      thumb.style.transition = 'none';
      placeThumb(opening);
      void thumb.offsetWidth;
      thumb.style.transition = '';
    }

    /* hands styling back to aria-selected. The pre-paint rules in the
       stylesheet stop applying from here, so they can never fight a swap. */
    remember(opening);
    document.documentElement.classList.add('tabs-ready');

    window.addEventListener('resize', function () {
      placeThumb(currentTab());
    }, { passive: true });
  }

  /* ── EXPERIMENTS ─────────────────────────────────────────────
     The five toys under the Experiment tab. Each one is independent
     and each one is a loop: press it, watch it answer, press it
     again. Nothing here reaches outside its own card.
     ────────────────────────────────────────────────────────── */

  /* ── confetti ──────────────────────────────────────────────
     Pieces go into the stage rather than the card, so the shower is
     bounded by the white panel. They are cleared two seconds later
     and the button opens again — the note under the card promises a
     shower, not a mess that piles up. */

  var confettiBtn = document.querySelector('[data-confetti]');
  var confettiStage = document.querySelector('[data-confetti-stage]');

  if (confettiBtn && confettiStage) {
    /* the site's two accent yellows first, then colours that hold
       their own on both a white page and an ink one — nothing here
       may be near-black, or half the shower vanishes in dark mode */
    var confettiInk = ['#ffcc00', '#e3ff45', '#3b82f6', '#22c55e', '#f97316', '#a1a1aa'];
    var confettiLayer = null;
    var confettiTimer = null;
    var confettiBusy = false;

    confettiBtn.addEventListener('click', function () {
      if (confettiBusy) return;
      confettiBusy = true;

      if (confettiLayer && confettiLayer.parentNode) {
        confettiLayer.parentNode.removeChild(confettiLayer);
      }

      confettiLayer = document.createElement('div');
      confettiLayer.className = 'confetti';
      confettiLayer.setAttribute('aria-hidden', 'true');

      /* measured, not assumed: the stage is 100px tall on a desktop
         column and taller once the cards stack */
      var fall = confettiStage.clientHeight + 40;

      for (var i = 0; i < 44; i++) {
        var piece = document.createElement('i');
        var round = Math.random() < 0.35;
        var w = round ? 5 + Math.random() * 3 : 4 + Math.random() * 4;
        var h = round ? w : 6 + Math.random() * 6;

        piece.style.left = (Math.random() * 100).toFixed(2) + '%';
        piece.style.width = w.toFixed(1) + 'px';
        piece.style.height = h.toFixed(1) + 'px';
        piece.style.borderRadius = round ? '50%' : '1px';
        piece.style.background = confettiInk[(Math.random() * confettiInk.length) | 0];
        piece.style.setProperty('--fall', fall + 'px');
        piece.style.setProperty('--sway', (Math.random() * 44 - 22).toFixed(1) + 'px');
        piece.style.setProperty('--spin', ((Math.random() * 720 - 360) | 0) + 'deg');
        piece.style.setProperty('--dur', (0.9 + Math.random() * 0.7).toFixed(2) + 's');
        /* staggered starts are what make it a shower rather than a
           single sheet of paper crossing the card */
        piece.style.setProperty('--delay', (Math.random() * 0.35).toFixed(2) + 's');

        confettiLayer.appendChild(piece);
      }

      confettiStage.appendChild(confettiLayer);

      clearTimeout(confettiTimer);
      confettiTimer = setTimeout(function () {
        if (confettiLayer && confettiLayer.parentNode) {
          confettiLayer.parentNode.removeChild(confettiLayer);
        }
        confettiLayer = null;
        confettiBusy = false;
      }, 2000);
    });
  }

  /* ── randomize ─────────────────────────────────────────────
     The characters do not all stop at once. They lock left to right,
     one per frame, which is the difference between a slot machine
     coming to rest and a string being replaced. */

  var fn = document.querySelector('[data-fn]');

  if (fn) {
    var fnResult = fn.querySelector('[data-fn-result]');
    var fnGo = fn.querySelector('[data-fn-go]');

    /* I and O are left out: at 12px they are the two characters
       nobody can tell from 1 and 0 */
    var fnLetters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    var fnDigits = '0123456789';

    /* the shape of the code in the design, read straight off it:
       HC45 - TB84UVX7. Anything that is not L or D is a literal. */
    var fnMask = 'LLDD - LLDDLLDD';

    var fnPick = function (set) {
      return set.charAt((Math.random() * set.length) | 0);
    };

    /* draws the string with the first `locked` slots taken from
       `settled` and the rest still spinning */
    var fnDraw = function (settled, locked) {
      var out = '';
      var slot = 0;

      for (var i = 0; i < fnMask.length; i++) {
        var m = fnMask.charAt(i);

        if (m !== 'L' && m !== 'D') { out += m; continue; }

        out += slot < locked ? settled.charAt(i)
             : m === 'L' ? fnPick(fnLetters)
             : fnPick(fnDigits);
        slot++;
      }

      return out;
    };

    var fnSlots = fnMask.replace(/[^LD]/g, '').length;
    var fnRoll = null;
    var fnRest = null;

    fnGo.addEventListener('click', function () {
      clearInterval(fnRoll);
      clearTimeout(fnRest);

      var settled = fnDraw('', 0);

      fn.classList.remove('is-done');

      if (reduceMotion) {
        fnResult.textContent = settled;
        fn.classList.add('is-done');
      } else {
        fn.classList.add('is-rolling');

        /* five frames of pure churn before anything settles, so the
           eye reads it as scrambling rather than as typing */
        var frame = 0;

        fnRoll = setInterval(function () {
          frame++;
          var locked = Math.max(0, frame - 5);
          fnResult.textContent = fnDraw(settled, locked);

          if (locked >= fnSlots) {
            clearInterval(fnRoll);
            fn.classList.remove('is-rolling');
            fn.classList.add('is-done');
          }
        }, 45);
      }

      /* the tick is an answer, not a state — it steps back out so the
         button reads as offering the next roll rather than reporting
         the last one */
      fnRest = setTimeout(function () {
        fn.classList.remove('is-done');
      }, 2600);
    });
  }

  /* ── pills ─────────────────────────────────────────────────
     The same travelling plate as the tabs at the top of the page.
     It is measured rather than declared, because the three labels
     are different lengths and the plate has to resize on the way. */

  Array.prototype.forEach.call(document.querySelectorAll('[data-mini-pills]'), function (group) {
    var thumb = group.querySelector('.mini-pills__thumb');
    var pills = Array.prototype.slice.call(group.querySelectorAll('.mini-pill'));

    if (!pills.length) return;

    var activePill = function () {
      for (var i = 0; i < pills.length; i++) {
        if (pills[i].getAttribute('aria-pressed') === 'true') return pills[i];
      }
      return pills[0];
    };

    var place = function (pill, animate) {
      if (!thumb) return;
      if (!animate) thumb.style.transition = 'none';
      thumb.style.setProperty('--pill-w', pill.offsetWidth + 'px');
      thumb.style.setProperty('--pill-x', pill.offsetLeft + 'px');
      if (!animate) { void thumb.offsetWidth; thumb.style.transition = ''; }
    };

    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        if (pill.getAttribute('aria-pressed') === 'true') return;
        activePill().setAttribute('aria-pressed', 'false');
        pill.setAttribute('aria-pressed', 'true');
        place(pill, true);
      });
    });

    place(activePill(), false);

    /* Geist arrives after this script does, and the labels are what
       the plate is measured against — "Music" is eight pixels wider
       in Geist than in the fallback. Without this the plate keeps the
       width it was given before the swap. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { place(activePill(), false); });
    }

    /* A hidden panel measures zero, so a visitor who left on Writing
       and comes back would find the plate parked at the origin. This
       fires when the panel is revealed as well as when the window
       changes, which covers both without either being special-cased.
       The observer is held in a variable so nothing can collect it
       while the page is still up. */
    if (window.ResizeObserver) {
      var pillWatch = new ResizeObserver(function () { place(activePill(), false); });
      pillWatch.observe(group);
      group.__pillWatch = pillWatch;
    } else {
      window.addEventListener('resize', function () {
        place(activePill(), false);
      }, { passive: true });
    }
  });

  /* ── tilt ──────────────────────────────────────────────────
     Rotation from the pointer, and a highlight that stays where the
     pointer is while the card turns under it. The logo is pushed off
     the card's own plane in CSS, so the same rotation carries it
     further than the surface travels — that gap is the parallax. */

  Array.prototype.forEach.call(document.querySelectorAll('[data-tilt]'), function (tilt) {
    if (reduceMotion || !canHover) return;

    var card = tilt.querySelector('.tilt__card');
    if (!card) return;

    /* past about 12deg the near corner starts to read as a fold
       rather than a tip */
    var maxTilt = 11;
    var pending = 0;

    var track = function (event) {
      if (pending) return;

      pending = requestAnimationFrame(function () {
        pending = 0;

        var box = tilt.getBoundingClientRect();
        if (!box.width || !box.height) return;

        var px = (event.clientX - box.left) / box.width;
        var py = (event.clientY - box.top) / box.height;
        var cx = px - 0.5;
        var cy = py - 0.5;

        /* the card leans away from the pointer on the vertical axis
           and towards it on the horizontal, which is how a real card
           behaves under a finger */
        card.style.setProperty('--ry', (cx * maxTilt * 2).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-cy * maxTilt * 2).toFixed(2) + 'deg');
        tilt.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        tilt.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        tilt.style.setProperty('--lx', (cx * 14).toFixed(1) + 'px');
        tilt.style.setProperty('--ly', (cy * 10).toFixed(1) + 'px');
      });
    };

    tilt.addEventListener('pointerenter', function () { tilt.classList.add('is-live'); });
    tilt.addEventListener('pointermove', track);

    tilt.addEventListener('pointerleave', function () {
      /* the class comes off first, so the reset that follows in the
         same frame settles on the long curve instead of snapping */
      tilt.classList.remove('is-live');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      tilt.style.setProperty('--lx', '0px');
      tilt.style.setProperty('--ly', '0px');
    });
  });

  /* ── coupon ────────────────────────────────────────────────
     The two halves and the ragged line between them are already in
     the stylesheet; all that is left is to say when. Two seconds
     apart, then the paper goes back together. */

  Array.prototype.forEach.call(document.querySelectorAll('[data-coupon]'), function (coupon) {
    var mend = null;

    coupon.addEventListener('click', function () {
      if (coupon.classList.contains('is-torn')) return;

      coupon.classList.add('is-torn');

      clearTimeout(mend);
      mend = setTimeout(function () {
        coupon.classList.remove('is-torn');
      }, 2000);
    });
  });

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

  /* ── IMAGE LIGHTBOX ──────────────────────────────────────────
     Artwork sits at column width in the page. Clicking it opens the
     full export over the page, where the overlay itself scrolls, so a
     wide diagram can be panned on a phone instead of shrunk again.
     ────────────────────────────────────────────────────────── */

  var zoomers = document.querySelectorAll('[data-zoom]');

  if (zoomers.length) {
    var box = null;
    var boxImg = null;
    var lastZoomer = null;

    var buildBox = function () {
      box = document.createElement('div');
      box.className = 'cs-lightbox';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');

      boxImg = document.createElement('img');
      boxImg.className = 'cs-lightbox__img';

      var close = document.createElement('button');
      close.className = 'cs-lightbox__close';
      close.type = 'button';
      close.setAttribute('aria-label', 'Close');
      close.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">' +
        '<path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

      box.appendChild(boxImg);
      box.appendChild(close);
      document.body.appendChild(box);

      /* anywhere in the overlay dismisses, the artwork included — on a wide
         screen there is barely any surround left to aim at */
      box.addEventListener('click', closeBox);
      close.addEventListener('click', closeBox);
    };

    var hideTimer = null;

    var closeBox = function () {
      if (!box || !box.classList.contains('is-open')) return;
      box.classList.remove('is-open');
      document.body.style.overflow = '';

      var hide = function () { box.style.display = 'none'; };
      if (reduceMotion) hide(); else hideTimer = setTimeout(hide, 250);

      if (lastZoomer) lastZoomer.focus();
    };

    var openBox = function (zoomer) {
      var img = zoomer.querySelector('img');
      if (!img) return;

      if (!box) buildBox();

      /* a reopen inside the fade-out window would otherwise be hidden
         by the previous close's pending timer */
      clearTimeout(hideTimer);

      lastZoomer = zoomer;
      boxImg.src = img.currentSrc || img.src;
      boxImg.alt = img.alt;

      /* carrying the intrinsic size over reserves the right box before
         the full-size file decodes, so the overlay does not jump. The
         markup's own attributes are there even while the thumbnail is
         still lazy-loading, where naturalWidth would read 0. */
      var w = img.getAttribute('width') || img.naturalWidth;
      var h = img.getAttribute('height') || img.naturalHeight;
      if (w && h) {
        boxImg.width = w;
        boxImg.height = h;
      }

      box.style.display = 'flex';
      box.scrollTop = 0;
      box.scrollLeft = 0;
      document.body.style.overflow = 'hidden';

      /* read a layout property so the browser commits opacity 0 before
         the class flips it — otherwise there is nothing to fade from */
      void box.offsetHeight;
      box.classList.add('is-open');
    };

    Array.prototype.forEach.call(zoomers, function (zoomer) {
      zoomer.addEventListener('click', function () { openBox(zoomer); });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeBox();
    });
  }

  /* ── SECTION JUMP ────────────────────────────────────────────
     The sticky menu beside "Back to home". It jumps to a section on
     pick, and it also reads the scroll position back, so the label
     always names whatever section is currently being read.
     ────────────────────────────────────────────────────────── */

  var jump = document.querySelector('[data-jump]');

  if (jump) {
    var jumpBtn = jump.querySelector('[data-jump-btn]');
    var jumpLabel = jump.querySelector('[data-jump-label]');
    var jumpItems = Array.prototype.slice.call(jump.querySelectorAll('[data-jump-item]'));

    /* an item whose target is missing would break the spy's index
       alignment, so the pairs are filtered down together */
    var jumpPairs = [];
    jumpItems.forEach(function (item) {
      var target = document.querySelector(item.getAttribute('href'));
      if (target) jumpPairs.push({ item: item, target: target });
    });

    var openJump = function () {
      jump.classList.add('is-open');
      jumpBtn.setAttribute('aria-expanded', 'true');
    };

    var closeJump = function () {
      jump.classList.remove('is-open');
      jumpBtn.setAttribute('aria-expanded', 'false');
    };

    jumpBtn.addEventListener('click', function (event) {
      event.stopPropagation();
      if (jump.classList.contains('is-open')) closeJump(); else openJump();
    });

    jumpPairs.forEach(function (pair) {
      /* the href does the scrolling; scroll-margin-top on the section
         keeps the heading clear of the sticky bar */
      pair.item.addEventListener('click', closeJump);
    });

    document.addEventListener('click', function (event) {
      if (!jump.contains(event.target)) closeJump();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && jump.classList.contains('is-open')) {
        closeJump();
        jumpBtn.focus();
      }
    });

    var jumpActive = -1;

    var markJump = function (index) {
      if (index === jumpActive) return;
      jumpActive = index;
      jumpPairs.forEach(function (pair, i) {
        if (i === index) pair.item.setAttribute('aria-current', 'true');
        else pair.item.removeAttribute('aria-current');
      });
      jumpLabel.textContent = jumpPairs[index].item.textContent;
    };

    var spyJump = function () {
      /* the reading line sits just under the sticky bar, so a section
         counts as current the moment its heading tucks behind it */
      var line = 120;
      var index = 0;

      for (var i = 0; i < jumpPairs.length; i++) {
        if (jumpPairs[i].target.getBoundingClientRect().top <= line) index = i;
      }

      /* the last section is usually too short to ever reach the line
         on its own once the page bottoms out */
      var atEnd = window.innerHeight + window.pageYOffset >= document.body.scrollHeight - 2;
      if (atEnd) index = jumpPairs.length - 1;

      markJump(index);
    };

    if (jumpPairs.length) {
      var spyQueued = false;
      var onScroll = function () {
        if (spyQueued) return;
        spyQueued = true;
        window.requestAnimationFrame(function () {
          spyQueued = false;
          spyJump();
        });
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      spyJump();
    }
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
