(() => {
  const cfg = window.WEDDING;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

  const brl = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value);

  const storage = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
    },
  };

  /* ---------------- personalize from config ---------------- */
  const monogram = `${cfg.couple.first[0]}&${cfg.couple.second[0]}`;
  const bindings = { ...cfg, first: cfg.couple.first, second: cfg.couple.second, monogram };
  $$('[data-bind]').forEach((el) => {
    const value = get(bindings, el.dataset.bind);
    if (value != null) el.textContent = value;
  });
  $$('[data-href]').forEach((el) => {
    const value = get(cfg, el.dataset.href);
    if (value) el.href = value;
  });
  document.title = `${cfg.couple.first} & ${cfg.couple.second} · Vamos casar!`;

  /* ---------------- countdown ---------------- */
  const target = new Date(cfg.date).getTime();
  const cd = Object.fromEntries($$('[data-cd]').map((el) => [el.dataset.cd, el]));
  function tick() {
    const diff = Math.max(0, target - Date.now());
    const s = Math.floor(diff / 1000);
    cd.days.textContent = String(Math.floor(s / 86400));
    cd.hours.textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
    cd.minutes.textContent = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    cd.seconds.textContent = String(s % 60).padStart(2, '0');
  }
  tick();
  setInterval(tick, 1000);

  /* ---------------- reveal on scroll ---------------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
    { threshold: 0.12 },
  );
  $$('.reveal').forEach((el) => io.observe(el));

  /* ---------------- toast ---------------- */
  let toastTimer;
  function toast(text) {
    const el = $('[data-toast]');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  /* ---------------- personalized invite + RSVP ---------------- */
  // The invite token comes from the personalized link (/c/<token>) and is remembered,
  // so gifts bought later from the same browser are still linked to the invite.
  const pathToken = (location.pathname.match(/^\/c\/([a-z0-9]{4,20})\/?$/i) || [])[1];
  const inviteToken = pathToken || storage.get('wedding-invite', null);
  if (pathToken) storage.set('wedding-invite', pathToken);
  let invite = null;

  const helpMsg = `Oi! Não achei meu link de confirmação do casamento de ${cfg.couple.first} & ${cfg.couple.second}.`;
  $('[data-whatsapp-help]').href = `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(helpMsg)}`;

  const rsvpForm = $('[data-rsvp-form]');
  const peopleLabel = (n) => `${n} ${n === 1 ? 'pessoa' : 'pessoas'}`;

  function renderRsvpStatus() {
    const el = $('[data-rsvp-status]');
    if (invite.status === 'pending') { el.hidden = true; return; }
    el.hidden = false;
    el.className = `rsvp__status rsvp__status--${invite.status}`;
    el.textContent = invite.status === 'yes'
      ? `✓ Presença confirmada para ${peopleLabel(invite.confirmedCount)}. Mudou algo? É só enviar de novo.`
      : '✓ Recebemos sua resposta. Vamos sentir sua falta! Mudou de ideia? Envie de novo.';
    $('[data-rsvp-title]').textContent = invite.status === 'yes' ? 'Te esperamos lá! 🥂' : 'Obrigado por avisar 💛';
  }

  function toggleRsvpYes() {
    $('[data-rsvp-yes]').hidden = new FormData(rsvpForm).get('attending') !== 'yes';
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
    greeting.textContent = `Olá, ${invite.name}!`;
    greeting.classList.add('eyebrow--greeting');
    $('[data-rsvp-nolink]').hidden = true;
    $('[data-rsvp-invite]').hidden = false;
    $('[data-invite-seats]').textContent = peopleLabel(invite.seats);

    const select = $('[data-rsvp-count]');
    select.innerHTML = '';
    for (let n = 1; n <= invite.seats; n++) select.add(new Option(peopleLabel(n), n));
    select.value = String(invite.confirmedCount || invite.seats);

    if (invite.status !== 'pending') {
      rsvpForm.attending.value = invite.status;
      rsvpForm.guestNames.value = invite.guestNames || '';
      rsvpForm.dietary.value = invite.dietary || '';
      rsvpForm.message.value = invite.message || '';
    }
    const nameInput = $('[data-details-form] input[name=name]');
    if (!nameInput.value) nameInput.value = invite.name;
    toggleRsvpYes();
    renderRsvpStatus();
  }

  rsvpForm.addEventListener('change', toggleRsvpYes);
  rsvpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('button[type=submit]', rsvpForm);
    const errorEl = $('[data-rsvp-error]');
    const f = new FormData(rsvpForm);
    btn.disabled = true;
    errorEl.textContent = '';
    try {
      const res = await fetch(`/api/invite/${encodeURIComponent(inviteToken)}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attending: f.get('attending'),
          count: f.get('count'),
          guestNames: f.get('guestNames'),
          dietary: f.get('dietary'),
          message: f.get('message'),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar.');
      invite.status = data.status;
      invite.confirmedCount = data.confirmedCount;
      renderRsvpStatus();
      $('[data-rsvp-status]').scrollIntoView({ block: 'center', behavior: 'smooth' });
      toast(data.status === 'yes' ? '🥂 Presença confirmada!' : '💛 Resposta enviada. Obrigado!');
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });

  loadInvite();

  /* ---------------- gift shop ---------------- */
  const state = {
    catalog: null,
    filter: 'all',
    sort: 'featured',
    cart: new Map(Object.entries(storage.get('wedding-cart', {}))),
    custom: storage.get('wedding-custom', null),
    step: 'cart',
  };
  const grid = $('[data-gift-grid]');

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
    for (const qty of state.cart.values()) n += qty;
    return n;
  }

  function renderFilters() {
    const wrap = $('[data-filters]');
    const cats = [{ id: 'all', label: 'Todos' }, ...state.catalog.categories];
    wrap.innerHTML = '';
    for (const c of cats) {
      const b = document.createElement('button');
      b.className = 'chip';
      b.type = 'button';
      b.role = 'tab';
      b.textContent = c.label;
      b.setAttribute('aria-selected', String(state.filter === c.id));
      b.addEventListener('click', () => { state.filter = c.id; renderFilters(); renderGrid(); });
      wrap.append(b);
    }
  }

  // Real photo with graceful fallback: if it fails to load, the emoji tile underneath stays visible.
  function photo(item, className) {
    const img = new Image();
    img.className = className;
    img.alt = item.title;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('load', () => img.classList.add('loaded'));
    img.addEventListener('error', () => img.remove());
    img.src = item.image;
    return img;
  }

  function renderGrid() {
    let items = state.catalog.items.filter((i) => state.filter === 'all' || i.category === state.filter);
    if (state.sort === 'asc') items = [...items].sort((a, b) => a.price - b.price);
    if (state.sort === 'desc') items = [...items].sort((a, b) => b.price - a.price);

    grid.innerHTML = '';
    items.forEach((item, idx) => {
      const card = document.createElement('article');
      card.className = 'gift';
      card.style.setProperty('--tile', `var(--tile-${item.category})`);
      card.style.animationDelay = `${Math.min(idx, 12) * 35}ms`;
      card.innerHTML = `
        <div class="gift__media">
          ${item.tag ? `<span class="gift__tag"></span>` : ''}
          <span class="gift__emoji" aria-hidden="true"></span>
        </div>
        <div class="gift__body">
          <h3 class="gift__title"></h3>
          <p class="gift__desc"></p>
          <div class="gift__foot">
            <span class="gift__price"></span>
            <button class="btn btn--primary gift__add" type="button">Presentear</button>
          </div>
        </div>`;
      if (item.tag) $('.gift__tag', card).textContent = item.tag;
      $('.gift__emoji', card).textContent = item.emoji;
      if (item.image) $('.gift__media', card).append(photo(item, 'gift__img'));
      $('.gift__title', card).textContent = item.title;
      $('.gift__desc', card).textContent = item.description;
      $('.gift__price', card).textContent = brl(item.price);
      const btn = $('.gift__add', card);
      if (state.cart.has(item.id)) { btn.classList.add('added'); btn.textContent = 'Na sacola ✓'; }
      btn.addEventListener('click', () => {
        addToCart(item.id);
        btn.classList.add('added');
        btn.textContent = 'Na sacola ✓';
      });
      grid.append(card);
    });
  }

  function addToCart(id) {
    const item = state.catalog.itemsById.get(id);
    const max = item.repeatable ? 20 : 5;
    state.cart.set(id, Math.min(max, (state.cart.get(id) || 0) + 1));
    persist();
    renderCart();
    const btn = $('.cart-btn');
    btn.classList.remove('bump');
    void btn.offsetWidth;
    btn.classList.add('bump');
    toast(`${item.emoji} Adicionado à sacola`);
  }

  function renderCart() {
    const list = $('[data-cart-list]');
    list.innerHTML = '';
    const entries = [...state.cart].filter(([id]) => state.catalog.itemsById.has(id));
    for (const [id, qty] of entries) {
      const item = state.catalog.itemsById.get(id);
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.style.setProperty('--tile', `var(--tile-${item.category})`);
      li.innerHTML = `
        <span class="cart-item__emoji" aria-hidden="true"></span>
        <div><p class="cart-item__title"></p><p class="cart-item__price"></p></div>
        <div class="qty">
          <button type="button" aria-label="Diminuir">−</button><span></span><button type="button" aria-label="Aumentar">+</button>
        </div>`;
      $('.cart-item__emoji', li).textContent = item.emoji;
      if (item.image) $('.cart-item__emoji', li).append(photo(item, 'cart-item__img'));
      $('.cart-item__title', li).textContent = item.title;
      $('.cart-item__price', li).textContent = brl(item.price);
      $('.qty span', li).textContent = qty;
      const [minus, plus] = $$('.qty button', li);
      minus.addEventListener('click', () => updateQty(id, qty - 1));
      plus.addEventListener('click', () => updateQty(id, qty + 1));
      list.append(li);
    }
    if (state.custom) {
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        <span class="cart-item__emoji" aria-hidden="true">💝</span>
        <div><p class="cart-item__title">Presente com valor livre</p><p class="cart-item__price"></p></div>
        <button class="icon-btn" type="button" aria-label="Remover">✕</button>`;
      $('.cart-item__price', li).textContent = brl(Number(state.custom));
      $('button', li).addEventListener('click', () => { state.custom = null; persist(); renderCart(); });
      list.append(li);
    }

    const count = cartCount();
    const badge = $('[data-cart-count]');
    badge.hidden = count === 0;
    badge.textContent = count;
    $('[data-cart-empty]').hidden = count > 0;
    $('[data-cart-total]').textContent = brl(cartTotal());
    if (state.step === 'cart') $('[data-next]').disabled = count === 0;
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

  $('[data-custom-form]').addEventListener('submit', (e) => {
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
  });

  /* ---------------- drawer + checkout flow ---------------- */
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
  }
  function closeDrawer() {
    overlay.hidden = true;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (state.step === 'pix') setStep('cart');
  }
  $$('[data-open-cart]').forEach((b) => b.addEventListener('click', openDrawer));
  $('[data-close]').addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => e.key === 'Escape' && drawer.classList.contains('open') && closeDrawer());

  function selectedMethod() {
    return new FormData(detailsForm).get('method');
  }

  function setStep(step) {
    state.step = step;
    $$('[data-step]', drawer).forEach((el) => (el.hidden = el.dataset.step !== step));
    backBtn.hidden = step === 'cart';
    nextBtn.disabled = false;
    errorEl.textContent = '';
    $('.drawer__head h2').textContent = { cart: 'Sua sacola', details: 'Quase lá', pix: 'Pague com Pix' }[step];
    if (step === 'cart') { nextBtn.textContent = 'Presentear'; nextBtn.disabled = cartCount() === 0; }
    if (step === 'details') nextBtn.textContent = selectedMethod() === 'card' ? 'Ir para pagamento seguro' : 'Gerar Pix';
    if (step === 'pix') nextBtn.textContent = 'Já fiz o Pix 💛';
  }
  detailsForm.addEventListener('change', () => state.step === 'details' && setStep('details'));

  function cartPayload() {
    const f = new FormData(detailsForm);
    return {
      items: [...state.cart].map(([id, qty]) => ({ id, qty })),
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
    try {
      sessionStorage.setItem('wedding-guest', JSON.stringify({ name: f.get('name'), message: f.get('message'), total: cartTotal() }));
    } catch { /* ignore */ }
  }

  function clearCart() {
    state.cart.clear();
    state.custom = null;
    persist();
  }

  nextBtn.addEventListener('click', async () => {
    if (state.step === 'cart') return setStep('details');

    if (state.step === 'details') {
      if (!detailsForm.reportValidity()) return;
      nextBtn.disabled = true;
      errorEl.textContent = '';
      rememberGuest();
      try {
        if (selectedMethod() === 'card') {
          nextBtn.textContent = 'Abrindo pagamento…';
          const { url } = await post('/api/checkout', cartPayload());
          window.location.href = url;
          return;
        }
        nextBtn.textContent = 'Gerando Pix…';
        const pix = await post('/api/pix', cartPayload());
        $('[data-pix-total]').textContent = brl(pix.total);
        $('[data-pix-qr]').innerHTML = pix.qrSvg;
        $('[data-pix-payload]').value = pix.payload;
        $('[data-pix-receiver]').textContent = `Recebedor: ${pix.receiver} · Chave: ${pix.key}`;
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
      try {
        // Tell the couple a Pix is on its way (shows as "aguardando confirmação" in the admin panel).
        await post('/api/pix/sent', { ...cartPayload(), txid: state.pixTxid });
      } catch { /* the Pix itself already happened; don't block the guest */ }
      clearCart();
      window.location.href = '/obrigado?metodo=pix';
    }
  });

  backBtn.addEventListener('click', () => setStep(state.step === 'pix' ? 'details' : 'cart'));

  $('[data-copy-pix]').addEventListener('click', async () => {
    const input = $('[data-pix-payload]');
    try {
      await navigator.clipboard.writeText(input.value);
    } catch {
      input.select();
      document.execCommand('copy');
    }
    toast('Código Pix copiado! Agora é só colar no app do banco.');
  });

  /* ---------------- boot ---------------- */
  fetch('/api/gifts')
    .then((r) => r.json())
    .then((catalog) => {
      catalog.itemsById = new Map(catalog.items.map((i) => [i.id, i]));
      state.catalog = catalog;
      $('.custom-gift input').min = catalog.customAmount.min;

      const { pix, card } = catalog.payments;
      const pixOpt = $('[data-method-pix]');
      const cardOpt = $('[data-method-card]');
      if (!pix) { pixOpt.classList.add('disabled'); $('small', pixOpt).textContent = 'Indisponível no momento'; $('input', pixOpt).disabled = true; }
      if (!card) { cardOpt.classList.add('disabled'); $('small', cardOpt).textContent = 'Indisponível no momento'; $('input', cardOpt).disabled = true; }
      if (!pix && card) $('input', cardOpt).checked = true;

      renderFilters();
      renderGrid();
      renderCart();
      setStep('cart');
      if (new URLSearchParams(location.search).has('sacola')) openDrawer();
    })
    .catch(() => {
      grid.innerHTML = '<p class="cart-empty">Não conseguimos carregar a lista agora. Recarregue a página 🙏</p>';
    });
})();
