/* Road of Resistance — scroll interactions.
   No dependencies. Everything degrades to a readable static page:
   without JavaScript, or with "reduce motion" on, scenes render unpinned
   in their final state. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isSmall = window.matchMedia('(max-width: 768px), (pointer: coarse)');
  var motion = !reduceMotion.matches;

  // Switching motion preference mid-visit: reload so layout and scenes match.
  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener('change', function () { window.location.reload(); });
  }

  /* ---------- helpers ---------- */
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }      // 0..1 within [a, b]
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  // fade in over [a, b], and (optionally) out over [c, d]
  function window4(p, a, b, c, d) {
    var i = seg(p, a, b);
    return c === undefined ? i : i * (1 - seg(p, c, d));
  }
  // Draw a scroll-driven sketch: t = 0 shows nothing, t = 1 the full drawing.
  // Strokes start one after another, so it reads like a pen at work.
  function drawSketch(svg, t) {
    if (!svg) return;
    var paths = svg._paths || (svg._paths = svg.querySelectorAll('path'));
    var n = paths.length;
    for (var i = 0; i < n; i++) {
      var start = (i / n) * .75;
      paths[i].style.strokeDashoffset = String(1 - seg(t, start, start + .25));
    }
  }
  function $(scene, name) { return scene.querySelector('[data-el="' + name + '"]'); }
  function $$(scene, name) { return scene.querySelectorAll('[data-el="' + name + '"]'); }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && motion) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          revealObs.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Count-up statistics ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && motion) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countObs.unobserve(e.target);
        var el = e.target;
        var end = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var dur = 1600, start = null;
        function tick(t) {
          if (start === null) start = t;
          var p = Math.min((t - start) / dur, 1);
          el.textContent = Math.round(end * easeOut(p)).toLocaleString('en-US') + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        el.textContent = '0' + suffix;
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObs.observe(el); });
  }

  /* ---------- "Stand in her place" choices ---------- */
  var pendingChoices = [];
  document.querySelectorAll('[data-choice]').forEach(function (choice) {
    var buttons = choice.querySelectorAll('.choice__btn');
    function answer(pick) {
      if (choice.classList.contains('is-answered')) return;
      choice.classList.add('is-answered');
      buttons.forEach(function (b) {
        var chosen = b.getAttribute('data-pick') === pick;
        b.setAttribute('aria-pressed', chosen ? 'true' : 'false');
        b.disabled = true;
      });
      if (pick) {
        var verdict = choice.querySelector('.choice__verdict[data-for="' + pick + '"]');
        if (verdict) verdict.classList.add('is-shown');
      }
    }
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { answer(b.getAttribute('data-pick')); });
    });
    // If the reader scrolls (or jumps) past without choosing, reveal what she did anyway.
    pendingChoices.push({ el: choice.querySelector('.choice__prompt'), answer: answer });
  });
  function checkChoices() {
    for (var i = pendingChoices.length - 1; i >= 0; i--) {
      if (pendingChoices[i].el.getBoundingClientRect().bottom < 0) {
        pendingChoices[i].answer(null);
        pendingChoices.splice(i, 1);
      }
    }
  }

  /* ---------- Words that light up ---------- */
  document.querySelectorAll('[data-words]').forEach(function (el) {
    if (!motion) return;
    // Wrap every word in a span, keeping inline elements such as <em>.
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          wrap(child);
        }
      });
    })(el);
  });

  /* ---------- Scenes: scroll position drives the animation ---------- */
  var scenes = {
    hero: function (p, s) {
      // the title lifts away while the wall is sketched in, brick by brick
      drawSketch($(s, 'img'), seg(p, .1, .7));

      var title = $(s, 'title'), out = seg(p, 0, .28);
      title.style.opacity = String(1 - out);
      title.style.transform = 'translateY(' + (-out * 80) + 'px) scale(' + (1 - out * .12) + ')';

      var line = $(s, 'line'), l = seg(p, .55, .7);
      line.style.opacity = String(l);
      line.style.transform = 'translateY(' + ((1 - l) * 30) + 'px)';

      $(s, 'label').style.opacity = String(seg(p, .82, .94));
      $(s, 'cue').style.opacity = String(1 - seg(p, 0, .08));
    },

    words: function (p, s) {
      var words = s.querySelectorAll('.w'), n = words.length;
      for (var i = 0; i < n; i++) {
        var start = (i / n) * .8 + .02;
        words[i].style.opacity = String(lerp(.14, 1, seg(p, start, start + .1)));
      }
    },

    walls: function (p, s) {
      var close = easeInOut(seg(p, .28, .8));
      var gap = isSmall.matches ? 14 : 20;                 // % of each panel left open at the end
      var shift = lerp(-100, -gap, close);
      $(s, 'left').style.transform = 'translateX(' + shift + '%)';
      $(s, 'right').style.transform = 'translateX(' + (-shift) + '%)';
      var street = $(s, 'img');
      drawSketch(street, seg(p, 0, .3));
      street.style.transform = 'scale(' + lerp(1.08, 1, p) + ')';

      var t1 = $(s, 't1'), t2 = $(s, 't2'), t3 = $(s, 't3');
      t1.style.opacity = String(window4(p, .02, .1, .22, .28));
      t1.style.transform = 'translateY(' + ((1 - seg(p, .02, .1)) * 30 - seg(p, .22, .28) * 30) + 'px)';
      t2.style.opacity = String(window4(p, .3, .38, .5, .56));
      t2.style.transform = 'translateY(' + ((1 - seg(p, .3, .38)) * 30 - seg(p, .5, .56) * 30) + 'px)';
      var h = seg(p, .62, .78);
      t3.style.opacity = String(h);
      t3.style.transform = 'scale(' + lerp(1.2, 1, easeOut(h)) + ')';
      $(s, 'label').style.opacity = String(seg(p, .85, .95));
    },

    letter: function (p, s) {
      var lift = easeOut(seg(p, 0, .45)), fan = easeInOut(seg(p, .3, .7));
      var p1 = $(s, 'p1'), p2 = $(s, 'p2');
      drawSketch(p1, seg(p, 0, .45));
      drawSketch(p2, seg(p, .1, .55));
      var tilt = lerp(62, 0, lift), y = lerp(18, 0, lift);
      p1.style.transform = 'translateY(' + y + '%) rotateX(' + tilt + 'deg) translateX(' + lerp(-2, -30, fan) + '%) rotate(' + lerp(-1, -6, fan) + 'deg)';
      p2.style.transform = 'translateY(' + y + '%) rotateX(' + tilt + 'deg) translateX(' + lerp(2, 30, fan) + '%) rotate(' + lerp(1.5, 5, fan) + 'deg)';
      var copy = $(s, 'copy'), c = seg(p, .55, .75);
      copy.style.opacity = String(c);
      copy.style.transform = 'translateY(' + ((1 - c) * 30) + 'px)';
    },

    card: function (p, s) {
      var turn = easeOut(seg(p, 0, .5)), drift = seg(p, .5, 1);
      var card = $(s, 'card');
      drawSketch(card, seg(p, 0, .45));
      card.style.transform =
        'rotateY(' + lerp(-80, 0, turn) + 'deg) rotateX(' + lerp(24, 0, turn) + 'deg) rotateZ(' + lerp(-10, 0, turn) + 'deg)' +
        ' scale(' + lerp(.7, 1, turn) + ') rotateY(' + (drift * 6) + 'deg)';
      var name = $(s, 'name'), n = seg(p, .3, .5);
      name.style.opacity = String(n);
      name.style.letterSpacing = lerp(.2, -.04, easeOut(n)) + 'em';
      var copy = $(s, 'copy'), c = seg(p, .5, .7);
      copy.style.opacity = String(c);
      copy.style.transform = 'translateY(' + ((1 - c) * 24) + 'px)';
      var label = $(s, 'label');
      if (label) label.style.opacity = String(seg(p, .6, .8));
    },

    suitcase: function (p, s) {
      var kase = $(s, 'case');
      drawSketch(kase, seg(p, 0, .12));
      var leave = easeInOut(seg(p, .04, .42)), back = easeOut(seg(p, .5, .82));
      var x, rot, bob;
      if (p < .46) {             // 1939: travels off to the right
        x = lerp(-10, 110, leave); rot = 0; bob = Math.sin(leave * Math.PI * 6) * 2;
      } else {                   // 1944: turned around, comes back from the right
        x = lerp(110, 0, back); rot = 180; bob = Math.sin(back * Math.PI * 5) * 2 * (1 - back);
      }
      kase.style.transform = 'translateX(' + x + 'vw) rotateY(' + rot + 'deg) rotate(' + bob + 'deg)';
      $(s, 't1').style.opacity = String(window4(p, .02, .1, .36, .44));
      $(s, 't2').style.opacity = String(seg(p, .47, .57));
      var copy = $(s, 'copy'), c = seg(p, .82, .94);
      copy.style.opacity = String(c);
      copy.style.transform = 'translateY(' + ((1 - c) * 24) + 'px)';
    },

    questions: function (p, s) {
      var qs = $$(s, 'q'), n = qs.length, span = .92 / n;
      for (var i = 0; i < n; i++) {
        // each question crossfades into the next, with no empty gap between
        var a = i * span + .02, b = a + span * .3, c = a + span * .82, d = a + span * 1.02;
        var last = i === n - 1;
        var o = last ? seg(p, a, b) : window4(p, a, b, c, d);
        qs[i].style.opacity = String(o);
        var inY = (1 - seg(p, a, b)) * 40, outY = last ? 0 : seg(p, c, d) * -40;
        qs[i].style.transform = 'translateY(' + (inY + outY) + 'px) scale(' + lerp(.94, 1, seg(p, a, b)) + ')';
      }
      var candles = $(s, 'img');
      drawSketch(candles, seg(p, 0, .6));
      candles.style.transform = 'scale(' + lerp(1, 1.15, p) + ')';
    }
  };

  var sceneEls = Array.prototype.slice.call(document.querySelectorAll('[data-scene]'));

  function runScenes(vh) {
    for (var i = 0; i < sceneEls.length; i++) {
      var s = sceneEls[i];
      var r = s.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;      // off-screen: skip
      var total = r.height - vh;
      var p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
      var fn = scenes[s.getAttribute('data-scene')];
      if (fn) fn(p, s);
    }
  }

  /* ---------- Sticky image stories ---------- */
  var stories = document.querySelectorAll('[data-story]');
  function buildStories() {
    stories.forEach(function (story) {
      var stage = story.querySelector('.story__stage');
      var steps = story.querySelectorAll('.step');
      steps.forEach(function (step, i) {
        var fig = step.querySelector('.object');
        if (!fig) return;
        var clone = fig.cloneNode(true);
        clone.className = 'object stage__item' + (i === 0 ? ' is-active' : '');
        stage.appendChild(clone);
      });
      // The stage repeats figures already in the reading order: hidden from
      // screen readers (aria-hidden on the stage) and skipped by the keyboard.
      stage.querySelectorAll('a').forEach(function (a) { a.setAttribute('tabindex', '-1'); });
      if (steps[0]) steps[0].classList.add('is-active');
      story.setAttribute('data-enhanced', '');
    });
  }
  function setActive(story, index) {
    story.querySelectorAll('.step').forEach(function (s, i) { s.classList.toggle('is-active', i === index); });
    story.querySelectorAll('.stage__item').forEach(function (s, i) { s.classList.toggle('is-active', i === index); });
  }
  if ('IntersectionObserver' in window && stories.length) {
    buildStories();
    var stepObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var story = e.target.closest('[data-story]');
        var index = Array.prototype.indexOf.call(story.querySelectorAll('.step'), e.target);
        setActive(story, index);
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    document.querySelectorAll('[data-story] .step').forEach(function (s) { stepObs.observe(s); });
  }
  // progress through the active step, used for a slow zoom on its image
  function runStories(vh) {
    stories.forEach(function (story) {
      var step = story.querySelector('.step.is-active');
      var stage = story.querySelector('.story__stage');
      if (!step || !stage) return;
      var r = step.getBoundingClientRect();
      stage.style.setProperty('--sp', clamp((vh / 2 - r.top) / r.height, 0, 1).toFixed(3));
    });
  }

  /* ---------- Sketches that draw themselves when they come into view ---------- */
  var drawEls = Array.prototype.filter.call(document.querySelectorAll('.sketch:not(.sketch--scrub)'), function (el) {
    return !el.closest('.stage__item');
  });
  if ('IntersectionObserver' in window && motion) {
    var drawObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-drawn'); drawObs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0.2 });
    drawEls.forEach(function (el) { drawObs.observe(el); });
  } else {
    drawEls.forEach(function (el) { el.classList.add('is-drawn'); });
  }

  /* ---------- Parallax layers ---------- */
  var layers = Array.prototype.slice.call(document.querySelectorAll('[data-speed]'));
  function runParallax(vh) {
    var factor = isSmall.matches ? 0.4 : 1;   // lighter motion on phones
    for (var i = 0; i < layers.length; i++) {
      var el = layers[i];
      var box = el.parentElement.getBoundingClientRect();
      if (box.bottom < -vh * 0.2 || box.top > vh * 1.2) continue;
      var speed = parseFloat(el.getAttribute('data-speed')) || 0;
      var offset = (box.top + box.height / 2) - vh / 2;
      el.style.transform = 'translate3d(0,' + (offset * -speed * factor).toFixed(1) + 'px,0)';
    }
  }

  /* ---------- Nav, progress ---------- */
  var nav = document.querySelector('.localnav');
  var bar = document.querySelector('.progress__bar');
  var hero = document.querySelector('.scene--hero');

  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    var y = window.scrollY || window.pageYOffset;

    checkChoices();
    if (motion) {
      runScenes(vh);
      runParallax(vh);
      runStories(vh);
    }

    nav.classList.toggle('is-shown', hero ? y > hero.offsetHeight - vh * 0.6 : y > vh);
    var max = document.documentElement.scrollHeight - vh;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    var probe = document.elementFromPoint(window.innerWidth / 2, 60);
    nav.classList.toggle('is-dark', !!(probe && probe.closest('.dark')));
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  /* ---------- Active chapter in nav ---------- */
  var links = document.querySelectorAll('.localnav__links a');
  if ('IntersectionObserver' in window) {
    var chapObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id;
        links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + id); });
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    document.querySelectorAll('[data-chapter]').forEach(function (c) { chapObs.observe(c); });
  }

  root.classList.add('is-ready');
})();
