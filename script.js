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
    mobileCta.classList.toggle('show', pastHero && !nearFinalCta);
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
  window.addEventListener('load', kickHero);
  // Fallback in case load already fired
  if (document.readyState === 'complete') kickHero();
  let heroDone = false;
  function kickHero() {
    if (heroDone) return;
    heroDone = true;
    heroEls.forEach((el, i) => {
      el.style.transitionDelay = (prefersReduced ? 0 : i * 0.09) + 's';
      requestAnimationFrame(() => el.classList.add('in'));
    });
  }
  // Safety: reveal hero shortly after DOM ready even if 'load' is slow.
  setTimeout(kickHero, 400);

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
        setStatus('Form isn’t connected yet. Add your Web3Forms access key in support.html to start receiving messages.', 'err');
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

  /* ---------- GSAP enhancement (optional) ---------- */
  window.addEventListener('load', () => {
    if (prefersReduced || !window.gsap) return;
    const gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    // Parallax the hero blobs & phone on scroll.
    if (window.ScrollTrigger) {
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
  });
})();
