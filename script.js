/* =========================================================
   ClassTrack — Landing page interactions & motion
   Core animations are vanilla JS (work offline). GSAP, when
   present, adds subtle scroll-parallax flourishes on top.
   ========================================================= */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---------- Year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Nav: scrolled state + mobile menu ---------- */
  const nav = $('#nav');
  const burger = $('#navBurger');
  const links = $('.nav__links');

  const onScrollNav = () => {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 24);
  };
  onScrollNav();

  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    $$('.nav__links a').forEach((a) =>
      a.addEventListener('click', () => {
        links.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ---------- Scroll progress bar ---------- */
  const progress = $('#scrollProgress');
  const onScrollProgress = () => {
    if (!progress) return;
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    progress.style.width = pct + '%';
  };
  onScrollProgress();

  /* ---------- Sticky mobile CTA (show after hero, hide near footer CTA) ---------- */
  const mobileCta = document.getElementById('mobileCta');
  const getSection = document.getElementById('get');
  const onScrollMobileCta = () => {
    if (!mobileCta) return;
    const pastHero = window.scrollY > window.innerHeight * 0.85;
    let nearFinalCta = false;
    if (getSection) {
      const r = getSection.getBoundingClientRect();
      nearFinalCta = r.top < window.innerHeight && r.bottom > 0;
    }
    const show = pastHero && !nearFinalCta;
    mobileCta.classList.toggle('show', show);
    // Hidden bar must not be reachable by keyboard / screen readers.
    mobileCta.inert = !show;
  };
  onScrollMobileCta();

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        onScrollNav();
        onScrollProgress();
        onScrollMobileCta();
        ticking = false;
      });
    },
    { passive: true }
  );

  /* ---------- Cursor glow (desktop only) ---------- */
  const glow = $('#cursorGlow');
  if (glow && !isTouch && !prefersReduced) {
    window.addEventListener(
      'pointermove',
      (e) => {
        glow.style.opacity = '1';
        glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      },
      { passive: true }
    );
  }

  /* ---------- Counters ---------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count || '0');
    const divide = parseFloat(el.dataset.divide || '1');
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const end = target / divide;
    const dur = prefersReduced ? 0 : 1500;
    const start = performance.now();

    const fmt = (v) => {
      let s;
      if (decimals > 0) s = v.toFixed(decimals);
      else s = Math.round(v).toLocaleString('en-US');
      return prefix + s + suffix;
    };

    if (dur === 0) { el.textContent = fmt(end); return; }

    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      el.textContent = fmt(end * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Reveal on scroll (IntersectionObserver) ---------- */
  const revealEls = $$('.reveal, .reveal-msg');
  // set stagger delays
  revealEls.forEach((el) => {
    const d = parseFloat(el.dataset.delay || '0');
    if (d) el.style.transitionDelay = d + 's';
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.classList.add('is-in');
          obs.unobserve(el);
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el) => io.observe(el));

    // Chat bubbles stagger within their container
    $$('.chatui__body').forEach((body) => {
      const msgs = $$('.reveal-msg', body);
      msgs.forEach((m, i) => (m.style.transitionDelay = i * 0.18 + 's'));
    });

    // Counters
    const countIO = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    $$('.count').forEach((el) => countIO.observe(el));

    // Attendance ring
    const ringIO = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const ring = entry.target;
          const pct = parseFloat(ring.dataset.ring || '0');
          const r = ring.r.baseVal.value;
          const circ = 2 * Math.PI * r;
          ring.style.strokeDasharray = String(circ);
          // start empty then fill (CSS transition handles the draw)
          ring.style.strokeDashoffset = String(circ);
          requestAnimationFrame(() => {
            ring.style.strokeDashoffset = String(circ * (1 - pct / 100));
          });
          obs.unobserve(ring);
        });
      },
      { threshold: 0.4 }
    );
    $$('[data-ring]').forEach((el) => ringIO.observe(el));

    // Bunk bar fill
    const fillIO = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          requestAnimationFrame(() => {
            el.style.width = (el.dataset.fill || '0') + '%';
          });
          obs.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    $$('[data-fill]').forEach((el) => fillIO.observe(el));
  } else {
    // No IO support: reveal everything immediately.
    revealEls.forEach((el) => el.classList.add('is-in'));
    $$('.count').forEach(animateCount);
    $$('[data-ring]').forEach((el) => {
      const r = el.r.baseVal.value;
      const circ = 2 * Math.PI * r;
      el.style.strokeDasharray = String(circ);
      el.style.strokeDashoffset = String(circ * (1 - parseFloat(el.dataset.ring || '0') / 100));
    });
    $$('[data-fill]').forEach((el) => (el.style.width = (el.dataset.fill || '0') + '%'));
  }

  /* ---------- Hero entrance (staggered) ---------- */
  const heroEls = $$('[data-hero]').sort(
    (a, b) => (+a.dataset.hero || 0) - (+b.dataset.hero || 0)
  );
  // Start right away (this script is deferred, so the DOM is ready). Waiting for
  // window 'load' used to hold the hero text back behind analytics/fonts and
  // pushed Largest Contentful Paint out by seconds.
  heroEls.forEach((el, i) => {
    el.style.transitionDelay = (prefersReduced ? 0 : i * 0.06) + 's';
  });
  requestAnimationFrame(() => heroEls.forEach((el) => el.classList.add('in')));

  /* ---------- 3D tilt on devices/cards (desktop) ---------- */
  if (!isTouch && !prefersReduced) {
    $$('[data-tilt]').forEach((el) => {
      const strength = el.classList.contains('phone') ? 8 : 5;
      const parent = el.closest('.hero__device') || el.parentElement;
      const zone = parent || el;
      zone.addEventListener('pointermove', (e) => {
        const rect = zone.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(1000px) rotateY(${px * strength}deg) rotateX(${-py * strength}deg)`;
      });
      zone.addEventListener('pointerleave', () => {
        el.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
      });
    });

    // Floating chips parallax with the pointer
    const device = $('.hero__device');
    if (device) {
      const chips = $$('.chip', device);
      device.addEventListener('pointermove', (e) => {
        const rect = device.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        chips.forEach((chip, i) => {
          const depth = (i + 1) * 8;
          chip.style.transform = `translate(${px * depth}px, ${py * depth}px)`;
        });
      });
      device.addEventListener('pointerleave', () => {
        chips.forEach((chip) => (chip.style.transform = 'translate(0,0)'));
      });
    }
  }

  /* ---------- Gentle idle float for chips ---------- */
  if (!prefersReduced) {
    $$('.chip').forEach((chip, i) => {
      chip.animate(
        [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-9px)' },
          { transform: 'translateY(0)' },
        ],
        { duration: 3600 + i * 700, iterations: Infinity, easing: 'ease-in-out', delay: i * 300 }
      );
    });
  }

  /* ---------- FAQ: exclusive accordion ---------- */
  const faqItems = $$('.faq__item');
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) faqItems.forEach((o) => o !== item && (o.open = false));
    });
  });

  /* ---------- Magnetic buttons (desktop) ---------- */
  if (!isTouch && !prefersReduced) {
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${mx * 0.25}px, ${my * 0.35}px)`;
      });
      el.addEventListener('pointerleave', () => (el.style.transform = 'translate(0,0)'));
    });
  }

  /* ---------- Support form (Web3Forms) ---------- */
  const form = document.getElementById('supportForm');
  if (form) {
    const statusEl = document.getElementById('formStatus');
    const btn = document.getElementById('formSubmit');
    const btnHTML = btn ? btn.innerHTML : '';

    const setStatus = (msg, kind) => {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.className = 'form__status show ' + (kind || '');
    };
    const emailOK = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());

      // Honeypot: silently ignore bots.
      if (data.botcheck) return;

      if (!data.name || !data.email || !data.message) {
        setStatus('Please fill in your name, email and message.', 'err');
        return;
      }
      if (!emailOK(data.email)) {
        setStatus('That email address doesn’t look right.', 'err');
        return;
      }
      const key = (data.access_key || '').trim();
      if (!key || key.indexOf('YOUR_WEB3FORMS') === 0) {
        setStatus('Form isn’t connected yet. Add your Web3Forms access key in support/index.html to start receiving messages.', 'err');
        return;
      }

      if (btn) { btn.disabled = true; btn.innerHTML = 'Sending…'; }
      setStatus('', '');

      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.success) {
          setStatus('✓ Thanks! Your message is on its way. We’ll reply to your email soon.', 'ok');
          form.reset();
        } else {
          setStatus(json.message || 'Something went wrong. Please try again or email us directly.', 'err');
        }
      } catch (err) {
        setStatus('Network error — please check your connection and try again.', 'err');
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = btnHTML; }
      }
    });
  }

  /* ---------- GSAP scroll-parallax (desktop + motion-OK only) ----------
     Lazy-loaded on demand, so touch / mobile / reduced-motion visitors
     never download (~60KB) or execute it — keeps mobile scrolling smooth. */
  function initHeroParallax() {
    const gsap = window.gsap;
    if (!gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(window.ScrollTrigger);
    $$('.hero .blob').forEach((b, i) => {
      gsap.to(b, {
        yPercent: (i + 1) * 14,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
      });
    });
    const phone = $('#heroPhone');
    if (phone) {
      gsap.to(phone, {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
      });
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  if (!isTouch && !prefersReduced && document.querySelector('.hero .blob')) {
    window.addEventListener('load', () => {
      const base = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/';
      loadScript(base + 'gsap.min.js')
        .then(() => loadScript(base + 'ScrollTrigger.min.js'))
        .then(initHeroParallax)
        .catch(() => { /* progressive enhancement — safe to ignore */ });
    });
  }

  /* ---------- Pause hero blob drift when the hero scrolls off-screen ---------- */
  const heroSection = document.getElementById('hero');
  if (heroSection && 'IntersectionObserver' in window && !prefersReduced) {
    const heroPauseIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) =>
          heroSection.classList.toggle('hero--paused', !e.isIntersecting)
        );
      },
      { threshold: 0 }
    );
    heroPauseIO.observe(heroSection);
  }

  /* ---------- Smart app banner (mobile, site-wide via JS) ----------
     A lightweight, dismissible install banner. It is skipped on the
     homepage (which already has a sticky mobile CTA), on desktop, and
     once the visitor has dismissed it. Injected here so every page
     gets it without editing each HTML file. */
  (function appBanner() {
    var DISMISS_KEY = 'ct_appbanner_dismissed';
    if (document.getElementById('mobileCta')) return;            // skip homepage
    try { if (localStorage.getItem(DISMISS_KEY) === '1') return; } catch (e) {}
    if (!window.matchMedia('(max-width: 720px)').matches) return; // mobile only

    // Resolve the logo path relative to the current page.
    var iconLink =
      document.querySelector('link[rel="icon"][type="image/png"]') ||
      document.querySelector('link[rel="apple-touch-icon"]');
    var logo = iconLink ? iconLink.getAttribute('href') : 'logo.png';

    var bar = document.createElement('div');
    bar.className = 'appbanner';
    bar.setAttribute('role', 'complementary');
    bar.setAttribute('aria-label', 'Get the ClassTrack app');
    bar.innerHTML =
      '<button class="appbanner__close" type="button" aria-label="Dismiss">&times;</button>' +
      '<img class="appbanner__icon" src="' + logo + '" alt="ClassTrack" width="42" height="42" />' +
      '<div class="appbanner__txt"><strong>ClassTrack</strong>' +
      '<small><span class="ms ms--fill">star</span> 4.8 · Free on Google Play</small></div>' +
      '<a class="appbanner__cta" href="https://play.google.com/store/apps/details?id=com.classtracks.app" target="_blank" rel="noopener">GET</a>';

    document.body.appendChild(bar);
    document.body.classList.add('has-appbanner');
    requestAnimationFrame(function () { requestAnimationFrame(function () { bar.classList.add('show'); }); });

    bar.querySelector('.appbanner__close').addEventListener('click', function () {
      bar.remove();
      document.body.classList.remove('has-appbanner');
      try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
    });
  })();

  /* ---------- iOS waitlist ("show interest") modal ----------
     Any element with [data-ios-waitlist] opens a small form. Signups are sent
     with Web3Forms (same inbox as the contact form). Built on first click, so it
     costs nothing on page load. */
  (function iosWaitlist() {
    var KEY = '9af6f644-51d3-44fe-a5e7-ce1b529c124e'; // Web3Forms public access key
    var DONE_KEY = 'ct_ios_waitlist';
    var PLAY = 'https://play.google.com/store/apps/details?id=com.classtracks.app';
    var dlg = null;

    function track() {
      try { (window.dataLayer = window.dataLayer || []).push({ event: 'ios_waitlist_signup' }); } catch (e) {}
      try { if (window.fbq) window.fbq('track', 'Lead', { content_name: 'iOS waitlist' }); } catch (e) {}
    }

    function build() {
      dlg = document.createElement('dialog');
      dlg.className = 'waitlist';
      dlg.setAttribute('aria-labelledby', 'waitlistTitle');
      dlg.innerHTML =
        '<button type="button" class="waitlist__close" aria-label="Close"><span class="ms">close</span></button>' +
        '<div class="waitlist__ic" aria-hidden="true"><span class="ms ms--fill">phone_iphone</span></div>' +
        '<div class="waitlist__form-view">' +
          '<h2 id="waitlistTitle">ClassTrack for iPhone is coming</h2>' +
          '<p class="waitlist__lead">Join the iOS waitlist and we\u2019ll email you the day it lands on the App Store.</p>' +
          '<form class="form waitlist__form" novalidate>' +
            '<input type="checkbox" name="botcheck" class="form__hp" tabindex="-1" autocomplete="off" aria-hidden="true" />' +
            '<div class="field"><label for="wlEmail">Email</label>' +
              '<input id="wlEmail" name="email" type="email" placeholder="you@example.com" autocomplete="email" required /></div>' +
            '<div class="form__row">' +
              '<div class="field"><label for="wlName">Name <span class="waitlist__opt">(optional)</span></label>' +
                '<input id="wlName" name="name" type="text" placeholder="Your name" autocomplete="name" /></div>' +
              '<div class="field"><label for="wlDevice">Device</label>' +
                '<select id="wlDevice" name="device"><option>iPhone</option><option>iPad</option><option>iPhone &amp; iPad</option></select></div>' +
            '</div>' +
            '<div class="form__status" role="status" aria-live="polite"></div>' +
            '<button type="submit" class="btn btn--primary btn--lg btn--block"><span class="ms">notifications_active</span> Notify me</button>' +
            '<p class="form__note">One email when we launch on iOS. No spam. <a href="/privacy/">Privacy</a></p>' +
          '</form>' +
        '</div>' +
        '<div class="waitlist__done-view" hidden>' +
          '<h2>You\u2019re on the list! \uD83C\uDF89</h2>' +
          '<p class="waitlist__lead">We\u2019ll email you as soon as ClassTrack is live on the App Store. On Android? You can use it today.</p>' +
          '<div class="waitlist__done-actions">' +
            '<a class="btn btn--primary" href="' + PLAY + '" target="_blank" rel="noopener"><span class="ms">download</span> Get it on Google Play</a>' +
            '<button type="button" class="btn btn--soft waitlist__again">Use another email</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(dlg);

      var form = dlg.querySelector('form');
      var status = dlg.querySelector('.form__status');
      var submit = form.querySelector('[type="submit"]');
      var submitHTML = submit.innerHTML;
      var setStatus = function (msg, kind) {
        status.textContent = msg;
        status.className = 'form__status' + (msg ? ' show ' + kind : '');
      };
      var showDone = function (done) {
        dlg.querySelector('.waitlist__form-view').hidden = done;
        dlg.querySelector('.waitlist__done-view').hidden = !done;
      };
      dlg._showDone = showDone;

      dlg.querySelector('.waitlist__close').addEventListener('click', function () { dlg.close(); });
      dlg.querySelector('.waitlist__again').addEventListener('click', function () {
        showDone(false); form.reset(); setStatus('', ''); form.email.focus();
      });
      // Click on the dark backdrop closes the dialog.
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (form.botcheck.checked) return; // bot
        var email = form.email.value.trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          setStatus('Please enter a valid email address.', 'err');
          form.email.focus();
          return;
        }
        submit.disabled = true; submit.textContent = 'Joining\u2026'; setStatus('', '');
        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: KEY,
            subject: 'New iOS waitlist signup',
            from_name: 'ClassTrack iOS waitlist',
            email: email,
            name: form.name.value.trim() || '(not given)',
            device: form.device.value,
            page: location.pathname,
            message: 'Wants to be notified when ClassTrack launches on iOS (' + form.device.value + ').'
          })
        })
          .then(function (r) { return r.json(); })
          .then(function (json) {
            if (!json.success) throw new Error(json.message || 'failed');
            try { localStorage.setItem(DONE_KEY, '1'); } catch (err) {}
            track();
            showDone(true);
          })
          .catch(function () {
            setStatus('Couldn\u2019t sign you up just now. Please check your connection and try again.', 'err');
          })
          .then(function () { submit.disabled = false; submit.innerHTML = submitHTML; });
      });
    }

    function open(e) {
      if (typeof HTMLDialogElement !== 'function') return; // very old browser: follow the link instead
      e.preventDefault();
      if (!dlg) build();
      var done = false;
      try { done = localStorage.getItem(DONE_KEY) === '1'; } catch (err) {}
      dlg._showDone(done);
      dlg.showModal();
      if (!done) dlg.querySelector('#wlEmail').focus();
    }

    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-ios-waitlist]');
      if (t) open(e);
    });
  })();

  /* ---------- Dynamic favicon: change when the tab loses focus ---------- */
  (function faviconSwap() {
    const link = document.querySelector('link[rel="icon"]');
    if (!link) return;

    const activeHref = link.getAttribute('href');           // e.g. favicon.svg or ../favicon.svg
    const awayHref = activeHref.replace('favicon.svg', 'favicon-away.svg');
    const activeTitle = document.title;
    const awayTitle = '👋 Come back to ClassTrack';

    // Preload the away icon so the swap is instant.
    const pre = new Image();
    pre.src = awayHref;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        link.setAttribute('href', awayHref);
        document.title = awayTitle;
      } else {
        link.setAttribute('href', activeHref);
        document.title = activeTitle;
      }
    });
  })();
})();
