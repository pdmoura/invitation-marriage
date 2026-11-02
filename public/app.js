(() => {
  document.documentElement.classList.add('js');
  const cfg = window.WEDDING;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const brl = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL',
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2,
    }).format(value);

  const storage = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } },
  };

  /* ---------------- personalize from config ---------------- */
  const bindings = { ...cfg, first: cfg.couple.first, second: cfg.couple.second };
  $$('[data-bind]').forEach((el) => {
    const value = get(bindings, el.dataset.bind);
    if (value != null) el.textContent = value;
  });
  $$('[data-href]').forEach((el) => { const v = get(cfg, el.dataset.href); if (v) el.href = v; });
  document.title = `${cfg.couple.first} & ${cfg.couple.second} · ${cfg.shortDate.replace(/ · /g, '.')}`;

  // Photos: if one can't load, keep the soft placeholder behind it instead of a broken image.
  $$('img[data-photo]').forEach((img) => {
    const fail = () => { img.style.visibility = 'hidden'; };
    if (img.complete && !img.naturalWidth) fail();
    img.addEventListener('error', fail);
  });

  /* ---------------- marquee ---------------- */
  const marquee = $('[data-marquee]');
  const words = [`${cfg.couple.first} & ${cfg.couple.second}`, cfg.shortDate.replace(/ · /g, '.'), cfg.cityShort, 'Vamos nos casar'];
  const chunk = words.map((w) => `<span>${w}</span><span class="dot">✦</span>`).join('');
  marquee.innerHTML = chunk.repeat(4);

  /* ---------------- countdown ---------------- */
  const target = new Date(cfg.date).getTime();
  const cd = Object.fromEntries($$('[data-cd]').map((el) => [el.dataset.cd, el]));
  function tick() {
    const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    cd.days.textContent = String(Math.floor(s / 86400));
    cd.hours.textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
    cd.minutes.textContent = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    cd.seconds.textContent = String(s % 60).padStart(2, '0');
  }
  tick();
  setInterval(tick, 1000);

  /* ---------------- calendar (.ics) ---------------- */
  function downloadIcs() {
    const start = new Date(cfg.date);
    const end = new Date(start.getTime() + 9 * 3600 * 1000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PedroESara//Casamento//PT',
      'BEGIN:VEVENT', `UID:casamento-${fmt(start)}@pedroesara`, `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
      `SUMMARY:Casamento ${cfg.couple.first} & ${cfg.couple.second}`,
      `LOCATION:${cfg.ceremony.place}\\, ${cfg.ceremony.address.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${location.origin}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'casamento-pedro-e-sara.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  $$('[data-add-calendar]').forEach((b) => b.addEventListener('click', downloadIcs));

  /* ---------------- scroll effects ---------------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
    { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
  );
  const observeReveals = (root = document) => $$('[data-reveal]:not(.in)', root).forEach((el) => io.observe(el));
  observeReveals();

  // Statement: words light up one by one as it scrolls through the viewport.
  const statement = $('[data-words]');
  statement.innerHTML = statement.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
  const statementWords = $$('.w', statement);

  const nav = $('[data-nav]');
  const hero = $('.hero');
  const parallax = $$('[data-parallax]');
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY;
    const vh = innerHeight;
    nav.classList.toggle('nav--solid', y > hero.offsetHeight - 90);

    if (!reduceMotion) {
      parallax.forEach((el) => { if (y < vh * 1.2) el.style.transform = `translate3d(0, ${y * Number(el.dataset.parallax)}px, 0)`; });
      const r = statement.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      const lit = Math.round(progress * statementWords.length);
      statementWords.forEach((w, i) => w.classList.toggle('on', i < lit));
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
  if (reduceMotion) statementWords.forEach((w) => w.classList.add('on'));

  /* ---------------- toast ---------------- */
  let toastTimer;
  function toast(text) {
    const el = $('[data-toast]');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  /* ---------------- personalized invite + one-tap RSVP ---------------- */
  // The invite code comes from the personal link (/c/<code>) and is remembered,
  // so gifts bought later from the same phone are still linked to the invite.
  const pathToken = (location.pathname.match(/^\/c\/([a-z0-9]{4,20})\/?$/i) || [])[1];
  const inviteToken = pathToken || storage.get('wedding-invite', null);
  if (pathToken) storage.set('wedding-invite', pathToken);
  let invite = null;

  const helpMsg = `Oi! Não achei meu link de confirmação do casamento de ${cfg.couple.first} & ${cfg.couple.second}.`;
  $('[data-whatsapp-help]').href = `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(helpMsg)}`;

  const people = (n) => `${n} ${n === 1 ? 'lugar' : 'lugares'}`;
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
    $('[data-invite-seats]').textContent = people(invite.seats);
    $('[data-seats]').innerHTML = Array.from({ length: invite.seats }, (_, i) => `<span style="--i:${i}">${personIcon}</span>`).join('');
    const day = cfg.dayLabel || '';
    $('[data-yes-text]').textContent = invite.seats === 1
      ? `Te esperamos no dia ${day}. Vai ser lindo!`
      : `Esperamos vocês ${invite.seats} no dia ${day}. Vai ser lindo!`;
    showRsvp(invite.status === 'pending' ? 'pending' : invite.status);
  }

  async function loadInvite() {
    if (!inviteToken) return;
    const res = await fetch(`/api/invite/${encodeURIComponent(inviteToken)}`).catch(() => null);
    if (!res?.ok) {
      if (res?.status === 404 && !pathToken) storage.set('wedding-invite', null);
      return;
    }
    invite = await res.json();
    const greeting = $('[data-invite-greeting]');
    greeting.textContent = `${invite.name}, este convite é para vocês`;
    greeting.hidden = false;
    const nameInput = $('[data-details-form] input[name=name]');
    if (!nameInput.value) nameInput.value = invite.name;
    renderInvite();
  }

  $$('[data-answer]').forEach((btn) => btn.addEventListener('click', async () => {
    const answer = btn.dataset.answer;
    const errorEl = $('[data-rsvp-error]');
    $$('[data-answer]').forEach((b) => (b.disabled = true));
    errorEl.textContent = '';
    try {
      const res = await fetch(`/api/invite/${encodeURIComponent(inviteToken)}/rsvp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attending: answer }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar. Tente de novo.');
      invite.status = data.status;
      renderInvite();
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      $$('[data-answer]').forEach((b) => (b.disabled = false));
    }
  }));
  $$('[data-change-answer]').forEach((b) => b.addEventListener('click', () => showRsvp('pending')));

  loadInvite();

  /* ---------------- gift shop ---------------- */
  const state = {
    catalog: null,
    filter: 'all',
    sort: 'featured',
    cart: new Map(Object.entries(storage.get('wedding-cart', {}))),
    custom: storage.get('wedding-custom', null),
    step: 'cart',
    pixTxid: null,
  };
  const grid = $('[data-gift-grid]');
  const tiles = { 'lua-de-mel': '#dfe6e6', casa: '#ece3d6', noivo: '#e2e6da', noiva: '#efe0da', zoeira: '#e6e0ea' };
  const plusIcon = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';
  const checkIcon = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function persist() {
    storage.set('wedding-cart', Object.fromEntries(state.cart));
    storage.set('wedding-custom', state.custom);
  }
  function cartTotal() {
    let total = state.custom ? Number(state.custom) : 0;
    for (const [id, qty] of state.cart) {
      const item = state.catalog?.itemsById.get(id);
      if (item) total += item.price * qty;
    }
    return Math.round(total * 100) / 100;
  }
  function cartCount() {
    let n = state.custom ? 1 : 0;
    for (const [id, qty] of state.cart) if (state.catalog?.itemsById.has(id)) n += qty;
    return n;
  }

  function photo(item, className) {
    const img = new Image();
    img.className = className;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('load', () => img.classList.add('loaded'));
    img.addEventListener('error', () => img.remove());
    img.src = item.image;
    return img;
  }

  function renderFilters() {
    const wrap = $('[data-filters]');
    wrap.replaceChildren(...[{ id: 'all', label: 'Todos' }, ...state.catalog.categories].map((c) => {
      const b = document.createElement('button');
      b.className = 'chip';
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.textContent = c.label;
      b.setAttribute('aria-selected', String(state.filter === c.id));
      b.addEventListener('click', () => { state.filter = c.id; renderFilters(); renderGrid(); });
      return b;
    }));
  }

  function setAddButton(btn, added) {
    btn.classList.toggle('added', added);
    btn.innerHTML = `${added ? checkIcon : plusIcon}<span>${added ? 'Na sacola' : 'Presentear'}</span>`;
    btn.setAttribute('aria-label', added ? 'Adicionar mais um' : 'Adicionar à sacola');
  }

  function renderGrid() {
    let items = state.catalog.items.filter((i) => state.filter === 'all' || i.category === state.filter);
    if (state.sort === 'asc') items = [...items].sort((a, b) => a.price - b.price);
    if (state.sort === 'desc') items = [...items].sort((a, b) => b.price - a.price);

    const cards = items.map((item, idx) => {
      const card = document.createElement('article');
      card.className = 'gift';
      card.style.setProperty('--i', Math.min(idx, 12));
      card.style.setProperty('--tile', tiles[item.category] || '');
      card.innerHTML = `
        <div class="gift__media">
          <span class="gift__emoji" aria-hidden="true"></span>
          ${item.tag ? '<span class="gift__tag"></span>' : ''}
          <button class="gift__add" type="button"></button>
        </div>
        <div class="gift__info">
          <div class="gift__row"><h3 class="gift__title"></h3><span class="gift__price"></span></div>
          <p class="gift__desc"></p>
        </div>`;
      $('.gift__emoji', card).textContent = item.emoji;
      if (item.image) $('.gift__media', card).prepend(photo(item, 'gift__img'));
      if (item.tag) $('.gift__tag', card).textContent = item.tag;
      $('.gift__title', card).textContent = item.title;
      $('.gift__price', card).textContent = brl(item.price);
      $('.gift__desc', card).textContent = item.description;
      const btn = $('.gift__add', card);
      setAddButton(btn, state.cart.has(item.id));
      btn.addEventListener('click', () => { addToCart(item.id); setAddButton(btn, true); });
      return card;
    });

    if (state.filter === 'all') cards.push(customCard());
    grid.replaceChildren(...cards);
  }

  function customCard() {
    const card = document.createElement('article');
    card.className = 'gift gift--custom';
    card.style.setProperty('--i', 12);
    card.innerHTML = `
      <div class="gift__media"><div>
        <div><h3>Valor <i>livre</i></h3><p>Sem piada, sem item. Só carinho em forma de Pix ou cartão.</p></div>
        <form class="custom-amount__row">
          <label class="money-input"><span>R$</span><input type="number" inputmode="decimal" min="10" step="1" placeholder="200" required aria-label="Valor em reais"></label>
          <button class="btn" type="submit">Adicionar</button>
        </form>
      </div></div>`;
    $('form', card).addEventListener('submit', (e) => addCustom(e));
    return card;
  }

  function addCustom(e) {
    e.preventDefault();
    const input = $('input', e.currentTarget);
    const value = Math.round(Number(input.value) * 100) / 100;
    const { min, max } = state.catalog.customAmount;
    if (!(value >= min && value <= max)) return toast(`Escolha um valor entre ${brl(min)} e ${brl(max)}`);
    state.custom = (Number(state.custom) || 0) + value;
    input.value = '';
    persist();
    renderCart();
    openDrawer();
  }
  $('[data-custom-form]').addEventListener('submit', addCustom);

  function addToCart(id) {
    const item = state.catalog.itemsById.get(id);
    const max = item.repeatable ? 20 : 5;
    state.cart.set(id, Math.min(max, (state.cart.get(id) || 0) + 1));
    persist();
    renderCart();
    $$('.bag-btn').forEach((b) => { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
    toast(`${item.emoji}  Adicionado à sacola`);
  }

  function renderCart() {
    const list = $('[data-cart-list]');
    const rows = [];
    for (const [id, qty] of state.cart) {
      const item = state.catalog.itemsById.get(id);
      if (!item) continue;
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.style.setProperty('--tile', tiles[item.category] || '');
      li.innerHTML = `
        <span class="cart-item__thumb" aria-hidden="true"></span>
        <div><p class="cart-item__title"></p><p class="cart-item__price"></p></div>
        <div class="qty"><button type="button" aria-label="Diminuir">−</button><span></span><button type="button" aria-label="Aumentar">+</button></div>`;
      $('.cart-item__thumb', li).textContent = item.emoji;
      if (item.image) $('.cart-item__thumb', li).append(photo(item, ''));
      $('.cart-item__title', li).textContent = item.title;
      $('.cart-item__price', li).textContent = brl(item.price);
      $('.qty span', li).textContent = qty;
      const [minus, plus] = $$('.qty button', li);
      minus.addEventListener('click', () => updateQty(id, qty - 1));
      plus.addEventListener('click', () => updateQty(id, qty + 1));
      rows.push(li);
    }
    if (state.custom) {
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        <span class="cart-item__thumb" aria-hidden="true">💝</span>
        <div><p class="cart-item__title">Valor livre</p><p class="cart-item__price"></p></div>
        <button class="icon-btn" type="button" aria-label="Remover"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
      $('.cart-item__price', li).textContent = brl(Number(state.custom));
      $('button', li).addEventListener('click', () => { state.custom = null; persist(); renderCart(); });
      rows.push(li);
    }
    list.replaceChildren(...rows);

    const count = cartCount();
    const total = cartTotal();
    $$('[data-cart-count]').forEach((b) => { b.hidden = count === 0; b.textContent = count; });
    $('[data-cart-empty]').hidden = count > 0;
    $('[data-cart-total]').textContent = brl(total);
    $('[data-float-bag]').hidden = count === 0 || drawer.classList.contains('open');
    $('[data-float-meta]').textContent = `${count} · ${brl(total)}`;
    if (state.step === 'cart') nextBtn.disabled = count === 0;
  }

  function updateQty(id, qty) {
    const item = state.catalog.itemsById.get(id);
    const max = item.repeatable ? 20 : 5;
    if (qty <= 0) state.cart.delete(id);
    else state.cart.set(id, Math.min(max, qty));
    persist();
    renderCart();
    if (qty <= 0) renderGrid();
  }

  $('[data-sort]').addEventListener('change', (e) => { state.sort = e.target.value; renderGrid(); });

  /* ---------------- drawer + checkout ---------------- */
  const drawer = $('[data-drawer]');
  const overlay = $('[data-overlay]');
  const nextBtn = $('[data-next]');
  const backBtn = $('[data-back]');
  const detailsForm = $('[data-details-form]');
  const errorEl = $('[data-error]');

  function openDrawer() {
    overlay.hidden = false;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('[data-float-bag]').hidden = true;
  }
  function closeDrawer() {
    overlay.hidden = true;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (state.step === 'pix') setStep('cart');
    renderCart();
  }
  $$('[data-open-cart]').forEach((b) => b.addEventListener('click', openDrawer));
  $('[data-close]').addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => e.key === 'Escape' && drawer.classList.contains('open') && closeDrawer());

  const selectedMethod = () => new FormData(detailsForm).get('method');

  function setStep(step) {
    state.step = step;
    $$('[data-step]', drawer).forEach((el) => (el.hidden = el.dataset.step !== step));
    backBtn.hidden = step === 'cart';
    nextBtn.disabled = false;
    errorEl.textContent = '';
    $('[data-drawer-title]').textContent = { cart: 'Sua sacola', details: 'Quase lá', pix: 'Pague com Pix' }[step];
    if (step === 'cart') { nextBtn.textContent = 'Presentear'; nextBtn.disabled = cartCount() === 0; }
    if (step === 'details') nextBtn.textContent = selectedMethod() === 'card' ? 'Ir para o pagamento' : 'Gerar Pix';
    if (step === 'pix') nextBtn.textContent = 'Já fiz o Pix';
  }
  detailsForm.addEventListener('change', () => state.step === 'details' && setStep('details'));

  function cartPayload() {
    const f = new FormData(detailsForm);
    return {
      items: [...state.cart].filter(([id]) => state.catalog.itemsById.has(id)).map(([id, qty]) => ({ id, qty })),
      customAmount: state.custom || undefined,
      name: f.get('name'),
      message: f.get('message'),
      invite: inviteToken || undefined,
    };
  }

  async function post(url, body) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Não foi possível continuar.');
    return data;
  }

  function rememberGuest() {
    const f = new FormData(detailsForm);
    try { sessionStorage.setItem('wedding-guest', JSON.stringify({ name: f.get('name'), message: f.get('message') })); } catch { /* ignore */ }
  }

  nextBtn.addEventListener('click', async () => {
    if (state.step === 'cart') return setStep('details');

    if (state.step === 'details') {
      if (!detailsForm.reportValidity()) return;
      nextBtn.disabled = true;
      rememberGuest();
      try {
        if (selectedMethod() === 'card') {
          nextBtn.textContent = 'Abrindo pagamento…';
          const { url } = await post('/api/checkout', cartPayload());
          location.href = url;
          return;
        }
        nextBtn.textContent = 'Gerando Pix…';
        const pix = await post('/api/pix', cartPayload());
        $('[data-pix-qr]').innerHTML = pix.qrSvg;
        $('[data-pix-payload]').value = pix.payload;
        $('[data-pix-receiver]').textContent = `${pix.receiver} · ${pix.key}`;
        $('[data-cart-total]').textContent = brl(pix.total);
        state.pixTxid = pix.txid;
        setStep('pix');
      } catch (err) {
        setStep('details');
        errorEl.textContent = err.message;
      }
      return;
    }

    if (state.step === 'pix') {
      nextBtn.disabled = true;
      try { await post('/api/pix/sent', { ...cartPayload(), txid: state.pixTxid }); } catch { /* the Pix already happened */ }
      state.cart.clear();
      state.custom = null;
      persist();
      location.href = '/obrigado?metodo=pix';
    }
  });
  backBtn.addEventListener('click', () => setStep(state.step === 'pix' ? 'details' : 'cart'));

  $('[data-copy-pix]').addEventListener('click', async () => {
    const input = $('[data-pix-payload]');
    try { await navigator.clipboard.writeText(input.value); } catch { input.select(); document.execCommand('copy'); }
    toast('Código copiado — é só colar no app do banco');
  });

  /* ---------------- boot ---------------- */
  fetch('/api/gifts')
    .then((r) => r.json())
    .then((catalog) => {
      catalog.itemsById = new Map(catalog.items.map((i) => [i.id, i]));
      state.catalog = catalog;
      const { pix, card } = catalog.payments;
      const disable = (el) => { el.classList.add('disabled'); $('small', el).textContent = 'Indisponível no momento'; $('input', el).disabled = true; };
      if (!pix) disable($('[data-method-pix]'));
      if (!card) disable($('[data-method-card]'));
      if (!pix && card) $('[data-method-card] input').checked = true;
      renderFilters();
      renderGrid();
      renderCart();
      setStep('cart');
    })
    .catch(() => { grid.innerHTML = '<p class="muted">Não conseguimos carregar a lista agora. Recarregue a página 🙏</p>'; });
})();
