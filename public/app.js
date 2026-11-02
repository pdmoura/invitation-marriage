(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const cfg = window.WEDDING;
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));
  const couple = `${cfg.couple.first} & ${cfg.couple.second}`;

  const storage = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } },
  };

  /* ---------------- language ---------------- */
  const LANGS = ['pt', 'en', 'es'];
  const params = new URLSearchParams(location.search);
  const browserLang = (navigator.language || 'pt').slice(0, 2);
  let lang = [params.get('lang'), storage.get('wedding-lang', null)].find((l) => LANGS.includes(l)) || 'pt';
  if (!params.get('lang') && !storage.get('wedding-lang', null) && !location.pathname.startsWith('/c/') && LANGS.includes(browserLang)) lang = browserLang;
  const t = (key, vars = {}) => String(window.I18N[lang]?.[key] ?? window.I18N.pt[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  const locale = () => t('locale');

  const eventDate = new Date(cfg.date);
  const fmtDate = (opts, d = eventDate) => {
    const s = new Intl.DateTimeFormat(locale(), { timeZone: 'America/Sao_Paulo', ...opts }).format(d);
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const longDate = () => fmtDate({ day: 'numeric', month: 'long', year: 'numeric' });
  const dayLabel = () => fmtDate({ day: 'numeric', month: 'long' }).replace(/^./, (c) => (lang === 'en' ? c : c.toLowerCase()));
  const shortDate = () => fmtDate({ day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' · ');
  // Always show money as Brazilian reais ("R$ 200"), whatever the page language.
  const brl = (value) => new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2,
  }).format(value);
  const seatsLabel = (n) => `${n} ${n === 1 ? t('seat') : t('seats')}`;
  const pick = (obj) => (obj && typeof obj === 'object' ? obj[lang] || obj.pt : obj);

  function applyLanguage() {
    root.lang = locale();
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    $$('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    $$('[data-long-date]').forEach((el) => { el.textContent = longDate(); });
    $$('[data-long-date-weekday]').forEach((el) => { el.textContent = fmtDate({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); });
    $$('[data-short-date]').forEach((el) => { el.textContent = shortDate(); });
    $('[data-day-title]').innerHTML = t('day.title', { day: dayLabel() });
    $('[data-dresscode]').textContent = pick(cfg.dressCode);
    $('[data-whatsapp-help]').href = `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(t('rsvp.helpMsg', { couple }))}`;
    $$('[data-langs] [data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    buildStatement();
    buildMarquee();
    if (invite) renderInvite();
    if (catalog) renderGifts();
  }

  /* ---------------- static bindings ---------------- */
  const bindings = { ...cfg, first: cfg.couple.first, second: cfg.couple.second };
  $$('[data-bind]').forEach((el) => { const v = get(bindings, el.dataset.bind); if (v != null) el.textContent = v; });
  $$('[data-href]').forEach((el) => { const v = get(cfg, el.dataset.href); if (v) el.href = v; });

  /* ---------------- smooth scroll (Lenis on desktop; native momentum on touch) ---------------- */
  let lenis = null;
  function startLenis() {
    if (reduceMotion || !window.Lenis) return;
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.9, smoothWheel: true, anchors: { offset: -84 } });
    lenis.on('scroll', requestTick);
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const lockScroll = (on) => {
    if (lenis) (on ? lenis.stop() : lenis.start());
    document.body.style.overflow = on ? 'hidden' : '';
  };

  /* ---------------- marquee + statement ---------------- */
  function buildMarquee() {
    const words = [couple, shortDate().replace(/ · /g, '.'), cfg.cityShort, t('hero.kicker')];
    const chunk = words.map((w) => `<span>${w}</span><span class="dot">✦</span>`).join('');
    $('[data-marquee]').innerHTML = chunk.repeat(4);
  }
  const statement = $('[data-words]');
  let statementWords = [];
  function buildStatement() {
    statement.innerHTML = t('intro.statement').split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
    statementWords = $$('.w', statement);
    if (reduceMotion) statementWords.forEach((w) => w.classList.add('on'));
    onScroll();
  }

  /* ---------------- countdown ---------------- */
  const cd = Object.fromEntries($$('[data-cd]').map((el) => [el.dataset.cd, el]));
  function tick() {
    const s = Math.max(0, Math.floor((eventDate.getTime() - Date.now()) / 1000));
    cd.days.textContent = String(Math.floor(s / 86400));
    cd.hours.textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
    cd.minutes.textContent = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    cd.seconds.textContent = String(s % 60).padStart(2, '0');
  }
  tick();
  setInterval(tick, 1000);

  /* ---------------- calendar (.ics) ---------------- */
  $$('[data-add-calendar]').forEach((b) => b.addEventListener('click', () => {
    const end = new Date(eventDate.getTime() + 9 * 3600 * 1000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PedroESara//Casamento//PT', 'BEGIN:VEVENT',
      `UID:casamento-${fmt(eventDate)}@pedroesara`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(eventDate)}`, `DTEND:${fmt(end)}`,
      `SUMMARY:${t('calendar.title', { couple })}`, `LOCATION:${cfg.ceremony.place}\\, ${cfg.ceremony.address.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${location.origin}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'casamento-pedro-e-sara.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }));

  /* ---------------- scroll effects ---------------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );
  const observeReveals = () => $$('[data-reveal]:not(.in)').forEach((el) => io.observe(el));

  const nav = $('[data-nav]');
  const hero = $('.hero');
  const heroImg = $('[data-parallax]');
  const innerParallax = $$('[data-parallax-inner]');
  let ticking = false;
  function requestTick() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }
  function onScroll() {
    ticking = false;
    const y = lenis ? lenis.animatedScroll : scrollY;
    const vh = innerHeight;
    nav.classList.toggle('nav--solid', y > hero.offsetHeight - 90);
    if (reduceMotion) return;
    if (y < vh * 1.2) heroImg.style.transform = `translate3d(0, ${y * Number(heroImg.dataset.parallax)}px, 0)`;
    innerParallax.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1 around the viewport centre
      img.style.transform = `translate3d(0, ${p * -6}%, 0)`;
    });
    if (statementWords.length) {
      const r = statement.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.3)));
      const lit = Math.round(progress * statementWords.length);
      statementWords.forEach((w, i) => w.classList.toggle('on', i < lit));
    }
  }
  addEventListener('scroll', () => { if (!lenis) requestTick(); }, { passive: true });
  addEventListener('resize', requestTick);

  /* ---------------- toast ---------------- */
  let toastTimer;
  function toast(text) {
    const el = $('[data-toast]');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  /* ---------------- personalized invite + one-tap RSVP ---------------- */
  const pathToken = (location.pathname.match(/^\/c\/([a-z0-9]{4,20})\/?$/i) || [])[1];
  const inviteToken = pathToken || storage.get('wedding-invite', null);
  if (pathToken) storage.set('wedding-invite', pathToken);
  let invite = null;
  let rsvpShown = false;
  const personIcon = '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6"/></svg>';

  function showRsvp(state) {
    $$('[data-rsvp]').forEach((el) => {
      const on = el.dataset.rsvp === state;
      el.hidden = !on;
      if (on) { el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); }
    });
  }
  function renderInvite() {
    $('[data-invite-name]').textContent = invite.name;
    $('[data-intro-name]').textContent = invite.name;
    const greeting = $('[data-invite-greeting]');
    greeting.textContent = t('hero.greeting', { name: invite.name });
    greeting.hidden = false;
    $('[data-rsvp-reserved]').innerHTML = t('rsvp.reserved', {
      seats: `<b>${seatsLabel(invite.seats)}</b>`,
      deadline: `<b>${fmtDate({ day: 'numeric', month: 'long' }, new Date(`${cfg.rsvpDeadline}T12:00:00-03:00`))}</b>`,
    });
    $('[data-seats]').innerHTML = Array.from({ length: invite.seats }, (_, i) => `<span style="--i:${i}">${personIcon}</span>`).join('');
    $('[data-yes-text]').textContent = invite.seats === 1
      ? t('rsvp.yesText1', { day: dayLabel() })
      : t('rsvp.yesTextN', { n: invite.seats, day: dayLabel() });
    const nameInput = $('[data-donate] input[name=name]');
    if (!nameInput.value) nameInput.value = invite.name;
    if (!rsvpShown) {
      showRsvp(invite.status === 'pending' ? 'pending' : invite.status);
      rsvpShown = true;
    }
  }

  async function loadInvite() {
    if (!inviteToken) return;
    const res = await fetch(`/api/invite/${encodeURIComponent(inviteToken)}`).catch(() => null);
    if (!res?.ok) {
      if (res?.status === 404 && !pathToken) storage.set('wedding-invite', null);
      return;
    }
    invite = await res.json();
    // The language chosen by the couple for this guest wins, unless the guest switched it themselves.
    if (pathToken && LANGS.includes(invite.lang) && !params.get('lang') && storage.get(`wedding-lang-override-${pathToken}`, null) == null) lang = invite.lang;
  }

  $$('[data-answer]').forEach((btn) => btn.addEventListener('click', async () => {
    const errorEl = $('[data-rsvp-error]');
    $$('[data-answer]').forEach((b) => (b.disabled = true));
    errorEl.textContent = '';
    try {
      const res = await fetch(`/api/invite/${encodeURIComponent(inviteToken)}/rsvp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attending: btn.dataset.answer }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t('rsvp.error'));
      invite.status = data.status;
      showRsvp(data.status);
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      $$('[data-answer]').forEach((b) => (b.disabled = false));
    }
  }));
  $$('[data-change-answer]').forEach((b) => b.addEventListener('click', () => showRsvp('pending')));

  /* ---------------- language switch (footer) ---------------- */
  $$('[data-langs] [data-lang]').forEach((b) => b.addEventListener('click', () => {
    lang = b.dataset.lang;
    storage.set('wedding-lang', lang);
    if (pathToken) storage.set(`wedding-lang-override-${pathToken}`, lang);
    applyLanguage();
  }));

  /* ---------------- envelope intro ---------------- */
  const intro = $('[data-intro]');
  async function openEnvelope() {
    if (intro.classList.contains('opening')) return;
    intro.classList.add('opening');
    await wait(350);
    intro.classList.add('flap-open');
    await wait(620);
    intro.classList.add('flap-behind', 'letter-out');
    await wait(1700);
    intro.classList.add('leaving');
    root.classList.remove('show-intro'); // starts the hero animations underneath
    lockScroll(false);
    storage.set(root.dataset.envelopeKey, 1);
    await wait(1100);
    intro.hidden = true;
  }
  function skipEnvelope() {
    root.classList.remove('show-intro');
    intro.hidden = true;
    lockScroll(false);
    storage.set(root.dataset.envelopeKey, 1);
  }
  $('[data-intro-open]').addEventListener('click', openEnvelope);
  $('[data-intro-skip]').addEventListener('click', skipEnvelope);
  $('[data-reopen]').addEventListener('click', () => {
    intro.hidden = false;
    intro.className = 'intro';
    root.classList.add('show-intro');
    lockScroll(true);
    scrollTo(0, 0);
    if (lenis) lenis.scrollTo(0, { immediate: true });
  });

  /* ---------------- gifts ---------------- */
  let catalog = null;
  let payments = { pix: false, card: false };
  const grid = $('[data-gift-grid]');

  function giftImage(item, className) {
    const img = new Image();
    img.className = className;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => img.remove());
    img.src = item.image;
    return img;
  }

  function renderGifts() {
    // Gift style is chosen per invite in the admin: full list, or one simple contribution card.
    const simple = invite?.giftMode === 'simple';
    $('[data-gift-simple]').hidden = !simple;
    $$('[data-gift-list]').forEach((el) => { el.hidden = simple; });
    if (simple) { observeReveals(); return; }
    const cards = catalog.items.map((item, idx) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'gift';
      card.dataset.reveal = '';
      card.style.setProperty('--d', idx % 3);
      card.innerHTML = `
        <span class="gift__media"><span class="gift__emoji" aria-hidden="true"></span>${item.tag ? '<span class="gift__tag"></span>' : ''}</span>
        <span class="gift__info">
          <span class="gift__row"><span class="gift__title"></span><span class="gift__price"></span></span>
          <span class="gift__desc"></span>
          <span class="btn btn--primary btn--lg gift__cta"></span>
        </span>`;
      $('.gift__emoji', card).textContent = item.emoji;
      if (item.image) $('.gift__media', card).prepend(giftImage(item, 'gift__img'));
      if (item.tag) $('.gift__tag', card).textContent = t(`tag.${item.tag}`);
      $('.gift__title', card).textContent = pick(item.title);
      $('.gift__price', card).textContent = brl(item.price);
      $('.gift__desc', card).textContent = pick(item.description);
      $('.gift__cta', card).textContent = t('gifts.give');
      card.addEventListener('click', () => openDonate(item));
      return card;
    });

    const custom = document.createElement('button');
    custom.type = 'button';
    custom.className = 'gift gift--custom';
    custom.dataset.reveal = '';
    custom.innerHTML = `
      <span class="gift__media"><span>
        <span><h3>${t('custom.title')}</h3><p>${t('custom.text')}</p></span>
        <span class="gift__heart" aria-hidden="true">♡</span>
      </span></span>
      <span class="gift__info"><span class="btn btn--primary btn--lg gift__cta">${t('custom.cta')}</span></span>`;
    custom.addEventListener('click', () => openDonate(null, false));
    cards.push(custom);

    grid.replaceChildren(...cards);
    observeReveals();
  }

  /* ---------------- donate dialog (one step, no cart) ---------------- */
  const dlg = $('[data-donate]');
  const form = $('[data-view="form"]', dlg);
  const pixView = $('[data-view="pix"]', dlg);
  const errorEl = $('[data-donate-error]');
  const amountInput = $('[data-donate-amount]');
  const donate = { item: null, qty: 1, txid: null };

  const donateTotal = () => (donate.item ? donate.item.price * donate.qty : Math.round(Number(amountInput.value || 0) * 100) / 100);
  function refreshTotal() {
    $('[data-donate-qty]').textContent = donate.qty;
    $('[data-donate-total]').textContent = brl(donateTotal());
  }

  const SUGGESTED = [100, 200, 300, 500, 1000];
  function renderAmounts() {
    $('[data-amounts]').replaceChildren(...SUGGESTED.map((v) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'amount';
      b.textContent = brl(v);
      b.addEventListener('click', () => {
        amountInput.value = v;
        $$('.amount', dlg).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        refreshTotal();
      });
      return b;
    }));
  }

  function openDonate(item, couple = false) {
    donate.item = item;
    donate.qty = 1;
    errorEl.textContent = '';
    pixView.hidden = true;
    form.hidden = false;
    const thumb = $('[data-donate-thumb]');
    thumb.className = 'sheet__thumb' + (item ? '' : ' sheet__thumb--custom');
    thumb.textContent = item ? item.emoji : '♡';
    if (item?.image) thumb.append(giftImage(item, ''));
    $('[data-donate-title]').textContent = item ? pick(item.title) : couple ? t('donate.couple') : t('donate.custom');
    $('[data-donate-desc]').textContent = item ? pick(item.description) : couple ? t('donate.coupleText') : t('custom.text');
    if (!item) renderAmounts();
    $('[data-donate-qty-row]').hidden = !item?.repeatable;
    $('[data-donate-amount-row]').hidden = Boolean(item);
    amountInput.value = '';
    amountInput.min = catalog.customAmount.min;
    const enabled = { pix: payments.pix, card: payments.card };
    $$('[data-pay]', form).forEach((b) => { b.hidden = !enabled[b.dataset.pay]; b.disabled = false; });
    $('[data-donate-note]').textContent = payments.pix || payments.card ? (payments.pix ? t('donate.pixNote') : '') : t('donate.unavailable');
    refreshTotal();
    dlg.showModal();
    lockScroll(true);
  }

  function closeDonate() {
    if (!dlg.open) return;
    dlg.classList.add('closing');
    setTimeout(() => { dlg.classList.remove('closing'); dlg.close(); }, reduceMotion ? 0 : 280);
  }
  dlg.addEventListener('close', () => lockScroll(false));
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeDonate(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeDonate(); });
  $('[data-donate-close]').addEventListener('click', closeDonate);
  $$('[data-qty]', dlg).forEach((b) => b.addEventListener('click', () => {
    donate.qty = Math.min(20, Math.max(1, donate.qty + Number(b.dataset.qty)));
    refreshTotal();
  }));
  amountInput.addEventListener('input', () => {
    $$('.amount', dlg).forEach((x) => x.setAttribute('aria-pressed', String(Number(x.textContent.replace(/\D/g, '')) === Number(amountInput.value))));
    refreshTotal();
  });
  $('[data-simple-give]').addEventListener('click', () => openDonate(null, true));

  async function post(url, body) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || t('rsvp.error'));
    return data;
  }
  function payload() {
    return {
      items: donate.item ? [{ id: donate.item.id, qty: donate.qty }] : [],
      customAmount: donate.item ? undefined : Number(amountInput.value),
      name: form.name.value,
      message: form.message.value,
      invite: inviteToken || undefined,
      lang,
    };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const method = e.submitter?.dataset.pay || 'pix';
    errorEl.textContent = '';
    if (!donate.item) {
      const v = Number(amountInput.value);
      const { min, max } = catalog.customAmount;
      if (!(v >= min && v <= max)) { errorEl.textContent = t('donate.amountError', { min: brl(min), max: brl(max) }); amountInput.focus(); return; }
    }
    if (!form.name.value.trim()) { form.name.focus(); form.name.reportValidity(); return; }
    try { sessionStorage.setItem('wedding-guest', JSON.stringify({ name: form.name.value, message: form.message.value })); } catch { /* ignore */ }
    const btn = e.submitter;
    const label = btn.innerHTML;
    $$('[data-pay]', form).forEach((b) => (b.disabled = true));
    btn.textContent = t('donate.loading');
    try {
      if (method === 'card') {
        const { url } = await post('/api/checkout', payload());
        location.href = url;
        return;
      }
      const pix = await post('/api/pix', payload());
      donate.txid = pix.txid;
      $('[data-pix-total]').textContent = brl(pix.total);
      $('[data-pix-qr]').innerHTML = pix.qrSvg;
      $('[data-pix-payload]').value = pix.payload;
      $('[data-pix-receiver]').textContent = `${pix.receiver} · ${pix.key}`;
      form.hidden = true;
      pixView.hidden = false;
      $('.sheet__panel', dlg).scrollTop = 0;
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      btn.innerHTML = label;
      $$('[data-pay]', form).forEach((b) => (b.disabled = false));
    }
  });

  $('[data-pix-back]').addEventListener('click', () => { pixView.hidden = true; form.hidden = false; });
  $('[data-copy-pix]').addEventListener('click', async () => {
    const input = $('[data-pix-payload]');
    try { await navigator.clipboard.writeText(input.value); } catch { input.select(); document.execCommand('copy'); }
    toast(t('pix.copied'));
  });
  $('[data-pix-done]').addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    try { await post('/api/pix/sent', { ...payload(), txid: donate.txid }); } catch { /* the Pix itself already happened */ }
    location.href = `/obrigado?metodo=pix&lang=${lang}`;
  });

  /* ---------------- boot ---------------- */
  (async () => {
    if (root.classList.contains('show-intro')) lockScroll(true);
    const giftsReq = fetch('/api/gifts').then((r) => r.json()).catch(() => null);
    await loadInvite();
    const data = await giftsReq;
    if (data) {
      catalog = data;
      payments = data.payments;
    } else {
      grid.innerHTML = `<p class="muted">${t('rsvp.error')}</p>`;
    }
    applyLanguage();
    if (!invite) {
      showRsvp('nolink');
      $('[data-intro-name]').textContent = t('intro.guest');
    }
    observeReveals();
    if (document.readyState === 'complete' || window.Lenis) startLenis();
    else addEventListener('load', startLenis, { once: true });
    if (root.classList.contains('show-intro')) lockScroll(true);
    onScroll();
  })();
})();
