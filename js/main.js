/* Road of Resistance — scroll interactions.
   No dependencies. Everything degrades to a readable static page. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isSmall = window.matchMedia('(max-width: 768px), (pointer: coarse)');

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
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
  function formatNum(n) { return n.toLocaleString('en-US'); }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
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
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = formatNum(Math.round(end * eased)) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        el.textContent = '0' + suffix;
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObs.observe(el); });
  }

  /* ---------- Sticky image stories ----------
     On wide screens, move each step's figure into a pinned "stage" and
     cross-fade between them as the matching text scrolls past. */
  var stories = document.querySelectorAll('[data-story]');
  function buildStories() {
    stories.forEach(function (story) {
      if (story.hasAttribute('data-enhanced')) return;
      var stage = story.querySelector('.story__stage');
      var steps = story.querySelectorAll('.step');
      steps.forEach(function (step, i) {
        var fig = step.querySelector('.object');
        if (!fig) return;
        var clone = fig.cloneNode(true);
        clone.classList.add('stage__item');
        clone.querySelectorAll('img').forEach(function (img) { img.loading = 'eager'; });
        if (i === 0) clone.classList.add('is-active');
        stage.appendChild(clone);
      });
      // The stage duplicates figures that are already in the reading order,
      // so screen readers skip it (aria-hidden) and keyboard users skip its links.
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

  /* ---------- Parallax ---------- */
  var layers = Array.prototype.slice.call(document.querySelectorAll('[data-speed]'));
  var heroContent = document.querySelector('[data-hero-content]');
  var nav = document.querySelector('.localnav');
  var bar = document.querySelector('.progress__bar');
  var hero = document.querySelector('.hero');
  var ticking = false;

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    var y = window.scrollY || window.pageYOffset;
    var motionOn = !reduceMotion.matches;
    var factor = isSmall.matches ? 0.4 : 1; // lighter motion on phones

    if (motionOn) {
      for (var i = 0; i < layers.length; i++) {
        var el = layers[i];
        var box = el.parentElement.getBoundingClientRect();
        if (box.bottom < -vh * 0.2 || box.top > vh * 1.2) continue;
        var speed = parseFloat(el.getAttribute('data-speed')) || 0;
        // distance of the container's centre from the viewport centre
        var offset = (box.top + box.height / 2) - vh / 2;
        el.style.transform = 'translate3d(0,' + (offset * -speed * factor).toFixed(1) + 'px,0)';
      }
      if (heroContent && y < vh) {
        var p = y / vh;
        heroContent.style.opacity = String(Math.max(0, 1 - p * 1.6));
        heroContent.style.transform = 'translate3d(0,' + (y * 0.25 * factor).toFixed(1) + 'px,0) scale(' + (1 - p * 0.08) + ')';
      }
    }

    // Nav visibility, progress and colour
    var heroBottom = hero ? hero.offsetHeight * 0.8 : 0;
    nav.classList.toggle('is-shown', y > heroBottom);
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
  reduceMotion.addEventListener && reduceMotion.addEventListener('change', function () {
    if (reduceMotion.matches) {
      layers.forEach(function (el) { el.style.transform = ''; });
      if (heroContent) { heroContent.style.opacity = ''; heroContent.style.transform = ''; }
    }
    update();
  });
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
})();
