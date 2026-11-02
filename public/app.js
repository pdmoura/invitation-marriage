(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const cfg = window.WEDDING;
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wide = () => matchMedia('(min-width: 821px)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));
  const couple = `${cfg.couple.first} & ${cfg.couple.second}`;
  const icon = (id) => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;

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
  const deadline = new Date(`${cfg.rsvpDeadline}T12:00:00-03:00`);
  const fmtDate = (opts, d = eventDate) => {
    const s = new Intl.DateTimeFormat(locale(), { timeZone: 'America/Sao_Paulo', ...opts }).format(d);
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const dayLabel = () => fmtDate({ day: 'numeric', month: 'long' }).replace(/^./, (c) => (lang === 'en' ? c : c.toLowerCase()));
  const deadlineLabel = () => fmtDate({ day: 'numeric', month: 'long' }, deadline).replace(/^./, (c) => (lang === 'en' ? c : c.toLowerCase()));
  const shortDate = () => fmtDate({ day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
  // Money is always Brazilian reais ("R$ 200"), whatever the page language.
  const brl = (value) => new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2,
  }).format(value);
  const seatsLabel = (n) => `${n} ${n === 1 ? t('seat') : t('seats')}`;
  const pick = (obj) => (obj && typeof obj === 'object' ? obj[lang] || obj.pt : obj);

  function applyLanguage() {
    root.lang = locale();
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    $$('[data-long-date-weekday]').forEach((el) => { el.textContent = fmtDate({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); });
    $$('[data-short-date]').forEach((el) => { el.textContent = shortDate(); });
    $('[data-day-title]').textContent = t('day.title', { day: dayLabel() });
    $('[data-dresscode]').textContent = pick(cfg.dressCode);
    $('[data-rsvp-deadline-line]').textContent = t('letter.deadline', { deadline: deadlineLabel() });
    $('[data-whatsapp-help]').href = `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(t('rsvp.helpMsg', { couple }))}`;
    $('[data-whatsapp-couple]').href = `https://wa.me/${cfg.whatsapp}`;
    $$('[data-langs] [data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    $('[data-intro-hint]').textContent = t(intro.classList.contains('ready') ? 'intro.hint2' : 'intro.hint');
    updateCountdown();
    renderReplyAside();
    buildSpines();
    if (invite) renderInvite();
    if (catalog) renderGifts();
  }

  /* ---------------- static bindings ---------------- */
  const bindings = { ...cfg, first: cfg.couple.first, second: cfg.couple.second };
  $$('[data-bind]').forEach((el) => { const v = get(bindings, el.dataset.bind); if (v != null) el.textContent = v; });
  $$('[data-href]').forEach((el) => { const v = get(cfg, el.dataset.href); if (v) el.href = v; });

  /* ---------------- countdown line ---------------- */
  function updateCountdown() {
    const days = Math.max(0, Math.ceil((eventDate.getTime() - Date.now()) / 86400000));
    $('[data-countdown-line]').textContent = days > 0 ? t('hero.count', { n: days }) : '';
  }
  setInterval(updateCountdown, 60 * 60 * 1000);

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

  /* ---------------- smooth scroll: light touch on desktop, native on phones ---------------- */
  let lenis = null;
  function startLenis() {
    if (reduceMotion || !window.Lenis) return;
    lenis = new window.Lenis({ lerp: 0.16, wheelMultiplier: 1.1, smoothWheel: true, anchors: { offset: -12 } });
    lenis.on('scroll', requestTick);
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const lockScroll = (on) => {
    if (lenis) (on ? lenis.stop() : lenis.start());
    document.body.style.overflow = on ? 'hidden' : '';
  };

  /* ---------------- signature move: the photograph slowly changes ---------------- */
  const photos = $$('.hero__photo img');
  let photoIndex = 0;
  if (!reduceMotion && photos.length > 1) {
    setInterval(() => {
      if (document.hidden || root.classList.contains('show-intro')) return;
      photos[photoIndex].classList.remove('is-on');
      photoIndex = (photoIndex + 1) % photos.length;
      photos[photoIndex].classList.add('is-on');
    }, 5600);
  }

  /* ---------------- entrances ---------------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );
  const observeReveals = () => $$('[data-reveal]:not(.in)').forEach((el) => io.observe(el));

  /* ---------------- the day: cards fold into spines as you scroll (desktop) ---------------- */
  const deckSection = $('[data-deck]');
  const deckCards = $$('.deck__card', deckSection);
  const SPINE = 120;
  function buildSpines() {
    deckCards.forEach((card) => {
      let spine = $('.deck__spine', card);
      if (!spine) { spine = document.createElement('span'); spine.className = 'deck__spine'; spine.setAttribute('aria-hidden', 'true'); spine.innerHTML = '<span></span>'; card.append(spine); }
      spine.firstChild.textContent = `${$('.deck__time', card).textContent} · ${$('h3', card).textContent}`;
    });
  }
  function layoutDeck() {
    if (!wide() || reduceMotion) {
      deckCards.forEach((c) => { c.style.width = ''; c.style.transform = ''; c.classList.remove('is-spine'); [...c.children].forEach((ch) => { ch.style.opacity = ''; ch.style.visibility = ''; }); });
      return;
    }
    const r = deckSection.getBoundingClientRect();
    const span = deckSection.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, span)));
    const steps = deckCards.length - 1;
    const tt = p * steps;
    const track = $('[data-deck-track]');
    const full = Math.max(560, track.clientWidth - SPINE * Math.min(steps, Math.ceil(tt)));
    track.style.setProperty('--full', `${full}px`);
    deckCards.forEach((card, i) => {
      const slideIn = i === 0 ? 1 : Math.min(1, Math.max(0, tt - (i - 1)));
      const squeeze = Math.min(1, Math.max(0, tt - i));
      const width = full - (full - SPINE) * squeeze;
      card.style.width = `${width}px`;
      card.style.transform = `translate3d(${(1 - slideIn) * 110}vw, 0, 0)`;
      const fade = String(Math.max(0, 1 - squeeze * 1.8));
      [...card.children].forEach((child) => {
        if (child.classList.contains('deck__spine')) return;
        child.style.opacity = fade;
        child.style.visibility = Number(fade) < 0.05 ? 'hidden' : '';
      });
      card.classList.toggle('is-spine', squeeze > 0.6);
    });
  }
  deckCards.forEach((card, i) => card.addEventListener('click', (e) => {
    if (!card.classList.contains('is-spine') || e.target.closest('a,button')) return;
    const span = deckSection.offsetHeight - innerHeight;
    const y = deckSection.offsetTop + (span * i) / (deckCards.length - 1);
    if (lenis) lenis.scrollTo(y); else scrollTo({ top: y, behavior: 'smooth' });
  }));

  let ticking = false;
  function requestTick() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }
  function onScroll() {
    ticking = false;
    layoutDeck();
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

  function showRsvp(state) {
    $$('[data-rsvp]').forEach((el) => { el.hidden = el.dataset.rsvp !== state; });
  }
  function renderReplyAside() {
    $('[data-reply-aside]').textContent = invite
      ? t('rsvp.aside', { seats: seatsLabel(invite.seats), deadline: deadlineLabel() })
      : t('rsvp.asideNoLink');
  }
  function renderInvite() {
    $('[data-invite-name]').textContent = invite.name;
    $('[data-intro-name]').textContent = invite.name;
    const greeting = $('[data-invite-greeting]');
    greeting.textContent = t('hero.greeting', { name: invite.name });
    greeting.hidden = false;
    $('[data-rsvp-reserved]').textContent = t('rsvp.reserved', { seats: seatsLabel(invite.seats) });
    $('[data-seats]').innerHTML = Array.from({ length: invite.seats }, (_, i) => `<span style="--i:${i}">${icon('person')}</span>`).join('');
    $('[data-yes-text]').textContent = invite.seats === 1
      ? t('rsvp.yesText1', { day: dayLabel() })
      : t('rsvp.yesTextN', { n: invite.seats, day: dayLabel() });
    const nameInput = $('[data-donate] input[name=name]');
    if (!nameInput.value) nameInput.value = invite.name;
    renderReplyAside();
    if (!rsvpShown) { showRsvp(invite.status === 'pending' ? 'pending' : invite.status); rsvpShown = true; }
  }

  async function loadInvite() {
    if (!inviteToken) return;
    const res = await fetch(`/api/invite/${encodeURIComponent(inviteToken)}`).catch(() => null);
    if (!res?.ok) {
      if (res?.status === 404 && !pathToken) storage.set('wedding-invite', null);
      return;
    }
    invite = await res.json();
    // The language the couple chose for this guest wins, unless the guest switched it themselves.
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

  /* ---------------- envelope: tap to open, tap again to read ---------------- */
  const intro = $('[data-intro]');
  async function onEnvelopeTap() {
    if (intro.classList.contains('ready')) return leaveEnvelope();
    if (intro.classList.contains('opening')) return;
    intro.classList.add('opening');
    await wait(320);
    intro.classList.add('flap-open');
    await wait(560);
    intro.classList.add('flap-behind', 'letter-out');
    await wait(1100);
    // Hold the open envelope; a hand invites the second tap.
    $('[data-intro-hint]').textContent = t('intro.hint2');
    intro.classList.add('ready');
  }
  async function leaveEnvelope() {
    if (intro.classList.contains('leaving')) return;
    intro.classList.add('leaving');
    root.classList.remove('show-intro');
    lockScroll(false);
    storage.set(root.dataset.envelopeKey, 1);
    await wait(900);
    intro.hidden = true;
  }
  $('[data-intro-open]').addEventListener('click', onEnvelopeTap);
  intro.addEventListener('click', (e) => { if (intro.classList.contains('ready') && !e.target.closest('[data-intro-skip]')) leaveEnvelope(); });
  $('[data-intro-skip]').addEventListener('click', (e) => { e.stopPropagation(); leaveEnvelope(); });
  $('[data-reopen]').addEventListener('click', () => {
    intro.hidden = false;
    intro.className = 'intro';
    $('[data-intro-hint]').textContent = t('intro.hint');
    root.classList.add('show-intro');
    lockScroll(true);
    if (lenis) lenis.scrollTo(0, { immediate: true }); else scrollTo(0, 0);
  });

  /* ---------------- gifts ---------------- */
  let catalog = null;
  let payments = { pix: false, card: false };
  const grid = $('[data-gift-grid]');

  function giftImage(src, className = '') {
    const img = new Image();
    img.className = className;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => img.remove());
    img.src = src;
    return img;
  }

  function tile({ image, title, price, badge, onClick, idx }) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'tile';
    el.dataset.reveal = '';
    el.style.setProperty('--d', idx % 4);
    el.innerHTML = `
      <span class="tile__photo">${badge ? '<span class="tile__badge"></span>' : ''}</span>
      <span class="tile__strip">
        <span class="tile__title"></span>
        <span class="tile__row"><span class="tile__price"></span><span class="tile__go"><span></span>${icon('arrow')}</span></span>
      </span>`;
    if (image) $('.tile__photo', el).prepend(giftImage(image));
    if (badge) $('.tile__badge', el).textContent = badge;
    $('.tile__title', el).textContent = title;
    $('.tile__price', el).textContent = price;
    $('.tile__go span', el).textContent = t('gifts.give');
    el.addEventListener('click', onClick);
    return el;
  }

  function renderGifts() {
    const simple = invite?.giftMode === 'simple';
    $('[data-gift-simple]').hidden = !simple;
    $$('[data-gift-list]').forEach((el) => { el.hidden = simple; });
    if (!simple) {
      const tiles = catalog.items.map((item, idx) => tile({
        image: item.image, title: pick(item.title), price: brl(item.price),
        badge: item.tag ? t(`tag.${item.tag}`) : null, onClick: () => openDonate(item), idx,
      }));
      tiles.push(tile({ image: '/img/site/mexico.jpg', title: t('custom.text'), price: t('custom.title'), onClick: () => openDonate(null), idx: tiles.length }));
      grid.replaceChildren(...tiles);
    }
    observeReveals();
  }

  /* ---------------- donate dialog (one step, no cart) ---------------- */
  const dlg = $('[data-donate]');
  const form = $('[data-view="form"]', dlg);
  const pixView = $('[data-view="pix"]', dlg);
  const errorEl = $('[data-donate-error]');
  const amountInput = $('[data-donate-amount]');
  const donate = { item: null, qty: 1, txid: null };
  const SUGGESTED = [100, 200, 300, 500, 1000];

  const donateTotal = () => (donate.item ? donate.item.price * donate.qty : Math.round(Number(amountInput.value || 0) * 100) / 100);
  function refreshTotal() {
    $('[data-donate-qty]').textContent = donate.qty;
    $('[data-donate-total]').textContent = brl(donateTotal());
  }
  function renderAmounts() {
    $('[data-amounts]').replaceChildren(...SUGGESTED.map((v) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'amount';
      b.textContent = brl(v);
      b.dataset.value = v;
      b.addEventListener('click', () => {
        amountInput.value = v;
        $$('.amount', dlg).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        refreshTotal();
      });
      return b;
    }));
  }

  function openDonate(item, coupleGift = false) {
    donate.item = item;
    donate.qty = 1;
    errorEl.textContent = '';
    pixView.hidden = true;
    form.hidden = false;
    const thumb = $('[data-donate-thumb]');
    thumb.innerHTML = item ? '' : icon('gift');
    const img = item?.image || (!item ? '/img/site/mexico.jpg' : null);
    if (img) thumb.append(giftImage(img));
    $('[data-donate-title]').textContent = item ? pick(item.title) : coupleGift ? t('donate.couple') : t('donate.custom');
    $('[data-donate-desc]').textContent = item ? pick(item.description) : coupleGift ? t('donate.coupleText') : t('custom.text');
    $('[data-donate-qty-row]').hidden = !item?.repeatable;
    $('[data-donate-amount-row]').hidden = Boolean(item);
    amountInput.value = '';
    amountInput.min = catalog.customAmount.min;
    if (!item) renderAmounts();
    $$('[data-pay]', form).forEach((b) => { b.hidden = !payments[b.dataset.pay]; b.disabled = false; });
    $('[data-donate-note]').textContent = payments.pix || payments.card ? (payments.pix ? t('donate.pixNote') : '') : t('donate.unavailable');
    refreshTotal();
    dlg.showModal();
    lockScroll(true);
  }
  function closeDonate() {
    if (!dlg.open) return;
    dlg.classList.add('closing');
    setTimeout(() => { dlg.classList.remove('closing'); dlg.close(); }, reduceMotion ? 0 : 260);
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
    $$('.amount', dlg).forEach((x) => x.setAttribute('aria-pressed', String(Number(x.dataset.value) === Number(amountInput.value))));
    refreshTotal();
  });
  $('[data-simple-give]').addEventListener('click', () => openDonate(null, true));

  async function post(url, body) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || t('rsvp.error'));
    return data;
  }
  const payload = () => ({
    items: donate.item ? [{ id: donate.item.id, qty: donate.qty }] : [],
    customAmount: donate.item ? undefined : Number(amountInput.value),
    name: form.name.value, message: form.message.value, invite: inviteToken || undefined, lang,
  });

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
    if (data) { catalog = data; payments = data.payments; }
    applyLanguage();
    if (!invite) {
      showRsvp('nolink');
      $('[data-intro-name]').textContent = t('intro.guest');
    }
    observeReveals();
    startLenis();
    if (root.classList.contains('show-intro')) lockScroll(true);
    onScroll();
  })();
})();
