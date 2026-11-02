(() => {
  const cfg = window.WEDDING;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const brl = (cents) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
  const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const people = (n) => `${n} ${n === 1 ? 'pessoa' : 'pessoas'}`;
  const phoneFmt = (digits) => {
    const m = String(digits).match(/^55(\d{2})(\d{4,5})(\d{4})$/);
    return m ? `(${m[1]}) ${m[2]}-${m[3]}` : `+${digits}`;
  };

  // Small DOM builder: h('td', { className: 'x' }, 'text', childNode)
  function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null && v !== false) el[k] = v;
    }
    for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) el.append(c);
    return el;
  }

  let toastTimer;
  function toast(text) {
    const el = $('[data-toast]');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  async function api(path, { method = 'GET', body } = {}) {
    const res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });
    if (res.status === 401 && path !== '/api/admin/login') { show('login'); throw new Error('Faça login.'); }
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Algo deu errado.');
    return data;
  }

  const couple = `${cfg.couple.first} & ${cfg.couple.second}`;
  $$('[data-couple]').forEach((el) => (el.textContent = couple));

  function show(view) {
    $$('[data-view]').forEach((el) => (el.hidden = el.dataset.view !== view));
  }

  /* ---------------- login ---------------- */
  $('[data-login-form]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const err = $('[data-login-error]');
    err.textContent = '';
    try {
      await api('/api/admin/login', { method: 'POST', body: { password: form.password.value } });
      form.reset();
      await boot();
    } catch (error) {
      err.textContent = error.message;
    }
  });
  $('[data-logout]').addEventListener('click', async () => {
    await api('/api/admin/logout', { method: 'POST' }).catch(() => {});
    show('login');
  });

  /* ---------------- tabs ---------------- */
  $$('[data-tab]').forEach((tab) =>
    tab.addEventListener('click', () => {
      $$('[data-tab]').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      $$('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== tab.dataset.tab));
    }),
  );

  /* ---------------- summary ---------------- */
  async function loadSummary() {
    const { invites: i, money: m } = await api('/api/admin/summary');
    const set = (key, value) => { const el = $(`[data-s="${key}"]`); if (el) el.textContent = value; };
    set('confirmedPeople', i.confirmedPeople);
    set('seats', i.seats);
    set('confirmedInvites', i.confirmedInvites);
    set('pendingSeats', i.pendingSeats);
    set('declinedSeats', i.declinedSeats);
    set('total', i.total);
    set('opened', i.opened);
    set('pendingInvites', i.pendingInvites);
    set('received', brl(m.receivedCents));
    set('card', brl(m.cardCents));
    set('pix', brl(m.pixCents));
    set('manual', brl(m.manualCents));
    set('pendingPix', brl(m.pendingPixCents));
    set('pendingPixText', m.pendingPixCount
      ? `${m.pendingPixCount} ${m.pendingPixCount === 1 ? 'aviso' : 'avisos'} de Pix — confira no app do banco`
      : 'Nenhum aviso de Pix pendente');
    const pct = (n) => (i.seats ? `${Math.min(100, (n / i.seats) * 100)}%` : '0%');
    $('[data-bar="yes"]').style.width = pct(i.confirmedPeople);
    $('[data-bar="no"]').style.width = pct(i.declinedSeats);
  }

  /* ---------------- invites ---------------- */
  let invites = [];
  let filter = 'all';
  let search = '';

  function inviteMessage(inv) {
    return [
      `Olá, ${inv.name}! 💍`,
      `${couple} vão se casar no dia ${cfg.dateLabel.replace(/^\w+,\s*/, '')}, em ${cfg.city.split(' · ').slice(0, 2).join(' - ')}.`,
      `Seu convite é para ${people(inv.seats)}. Confirme sua presença aqui:`,
      inv.link,
    ].join('\n');
  }

  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); toast(msg); } catch { prompt('Copie:', text); }
  }

  function statusBadge(inv) {
    if (inv.status === 'yes') return h('span', { className: 'badge badge--yes', textContent: `✓ ${people(inv.confirmed_count)}` });
    if (inv.status === 'no') return h('span', { className: 'badge badge--no', textContent: 'Não vai' });
    return h('span', { className: 'badge badge--pending', textContent: 'Aguardando' });
  }

  function renderInvites() {
    const q = search.toLowerCase();
    const rows = invites.filter((inv) => {
      if (filter === 'unopened' ? inv.opened_at : filter !== 'all' && inv.status !== filter) return false;
      return !q || [inv.name, inv.guest_names, inv.phone, inv.notes].some((v) => String(v || '').toLowerCase().includes(q));
    });
    const tbody = $('[data-invite-rows]');
    tbody.replaceChildren(
      ...rows.map((inv) =>
        h('tr', {},
          h('td', {},
            h('div', { className: 'cell-title', textContent: inv.name }),
            h('div', { className: 'cell-sub', textContent: [inv.phone && phoneFmt(inv.phone), inv.notes].filter(Boolean).join(' · ') })),
          h('td', { dataset: { label: 'Lugares' }, textContent: inv.seats }),
          h('td', { dataset: { label: 'Resposta' } },
            statusBadge(inv),
            h('div', { className: 'cell-sub', textContent: inv.opened_at ? '👀 abriu o convite' : 'ainda não abriu' })),
          h('td', { dataset: { label: 'Quem vai' } },
            inv.guest_names ? h('div', { textContent: inv.guest_names }) : null,
            inv.dietary ? h('div', { className: 'cell-sub', textContent: `🍽️ ${inv.dietary}` }) : null,
            inv.message ? h('div', { className: 'cell-msg', textContent: `“${inv.message}”` }) : null,
            !inv.guest_names && !inv.dietary && !inv.message ? h('span', { className: 'cell-sub', textContent: '—' }) : null),
          h('td', { dataset: { label: 'Presentes' }, className: 'money', textContent: inv.gift_cents ? brl(inv.gift_cents) : '—' }),
          h('td', {},
            h('div', { className: 'actions' },
              h('button', { className: 'act', type: 'button', textContent: 'Copiar link', onclick: () => copy(inv.link, 'Link copiado!') }),
              h('a', {
                className: 'act act--wa', target: '_blank', rel: 'noopener', textContent: 'Enviar no WhatsApp',
                href: `https://wa.me/${inv.phone || ''}?text=${encodeURIComponent(inviteMessage(inv))}`,
              }),
              h('button', { className: 'act', type: 'button', textContent: 'Editar', onclick: () => editInvite(inv) }),
              h('button', {
                className: 'act act--danger', type: 'button', textContent: 'Excluir',
                onclick: async () => {
                  if (!confirm(`Excluir o convite de ${inv.name}?`)) return;
                  await api(`/api/admin/invites/${inv.id}`, { method: 'DELETE' });
                  toast('Convite excluído');
                  refresh();
                },
              }))),
        ),
      ),
    );
    $('[data-invite-empty]').hidden = rows.length > 0;
    $('[data-invite-empty]').textContent = invites.length ? 'Nenhum convite com esse filtro.' : 'Nenhum convite ainda. Adicione o primeiro acima 👆';
  }

  $('[data-invite-search]').addEventListener('input', (e) => { search = e.target.value; renderInvites(); });
  $$('[data-invite-filters] [data-filter]').forEach((chip) =>
    chip.addEventListener('click', () => {
      filter = chip.dataset.filter;
      $$('[data-invite-filters] [data-filter]').forEach((c) => c.setAttribute('aria-selected', String(c === chip)));
      renderInvites();
    }),
  );

  $('[data-add-invite]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    try {
      const inv = await api('/api/admin/invites', {
        method: 'POST',
        body: { name: form.name.value, seats: form.seats.value, phone: form.phone.value },
      });
      form.name.value = '';
      form.phone.value = '';
      form.name.focus();
      toast(`Convite criado: ${inv.name}`);
      refresh();
    } catch (err) { toast(err.message); }
  });

  $('[data-import-form]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const out = $('[data-import-result]');
    try {
      const { created, errors } = await api('/api/admin/invites/import', { method: 'POST', body: { text: form.text.value } });
      out.textContent = `${created} convite(s) importado(s).${errors.length ? ' Problemas: ' + errors.join(' · ') : ''}`;
      if (!errors.length) form.text.value = '';
      refresh();
    } catch (err) { out.textContent = err.message; }
  });

  const dialog = $('[data-edit-dialog]');
  const editForm = $('[data-edit-form]');
  let editing = null;
  function editInvite(inv) {
    editing = inv;
    editForm.name.value = inv.name;
    editForm.seats.value = inv.seats;
    editForm.phone.value = inv.phone || '';
    editForm.notes.value = inv.notes || '';
    editForm.status.value = inv.status;
    editForm.confirmed_count.value = inv.confirmed_count;
    $('[data-edit-error]').textContent = '';
    dialog.showModal();
  }
  editForm.addEventListener('submit', async (e) => {
    if (e.submitter?.value !== 'save') return;
    e.preventDefault();
    try {
      await api(`/api/admin/invites/${editing.id}`, {
        method: 'PATCH',
        body: {
          name: editForm.name.value,
          seats: editForm.seats.value,
          phone: editForm.phone.value,
          notes: editForm.notes.value,
          status: editForm.status.value,
          confirmed_count: editForm.confirmed_count.value,
        },
      });
      dialog.close();
      toast('Convite atualizado');
      refresh();
    } catch (err) { $('[data-edit-error]').textContent = err.message; }
  });

  /* ---------------- gifts ---------------- */
  const methodLabel = { pix: 'Pix', card: 'Cartão', manual: 'Outro' };

  async function loadGifts() {
    const gifts = await api('/api/admin/gifts');
    const tbody = $('[data-gift-rows]');
    tbody.replaceChildren(
      ...gifts.map((g) =>
        h('tr', {},
          h('td', { dataset: { label: 'Data' }, textContent: dateFmt.format(new Date(g.created_at)) }),
          h('td', {},
            h('div', { className: 'cell-title', textContent: g.guest_name || '—' }),
            g.invite_name && g.invite_name !== g.guest_name ? h('div', { className: 'cell-sub', textContent: `convite: ${g.invite_name}` }) : null,
            g.message ? h('div', { className: 'cell-msg', textContent: `“${g.message}”` }) : null),
          h('td', { dataset: { label: 'Presente' }, textContent: g.items || '—' }),
          h('td', { dataset: { label: 'Forma' }, textContent: methodLabel[g.method] || g.method }),
          h('td', { className: 'right money', textContent: brl(Number(g.amount_cents)) }),
          h('td', { dataset: { label: 'Status' } },
            g.status === 'paid'
              ? h('span', { className: 'badge badge--paid', textContent: '✓ Recebido' })
              : h('span', { className: 'badge badge--pending', textContent: g.method === 'pix' ? 'Conferir no banco' : 'Pendente' })),
          h('td', {},
            h('div', { className: 'actions' },
              g.status !== 'paid'
                ? h('button', { className: 'act act--ok', type: 'button', textContent: 'Confirmar recebimento', onclick: () => setGift(g, 'paid') })
                : g.method !== 'card'
                  ? h('button', { className: 'act', type: 'button', textContent: 'Desfazer', onclick: () => setGift(g, 'pending') })
                  : null,
              h('button', {
                className: 'act act--danger', type: 'button', textContent: 'Excluir',
                onclick: async () => {
                  if (!confirm('Excluir este registro de presente?')) return;
                  await api(`/api/admin/gifts/${g.id}`, { method: 'DELETE' });
                  refresh();
                },
              }))),
        ),
      ),
    );
    $('[data-gift-empty]').hidden = gifts.length > 0;
  }

  async function setGift(g, status) {
    await api(`/api/admin/gifts/${g.id}`, { method: 'PATCH', body: { status } });
    toast(status === 'paid' ? '💰 Presente confirmado!' : 'Marcado como pendente');
    refresh();
  }

  $('[data-add-gift]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    try {
      await api('/api/admin/gifts', {
        method: 'POST',
        body: { guest_name: form.guest_name.value, amount: form.amount.value, message: form.message.value },
      });
      form.reset();
      toast('Presente registrado 💛');
      refresh();
    } catch (err) { toast(err.message); }
  });

  /* ---------------- boot ---------------- */
  async function refresh() {
    const [list] = await Promise.all([api('/api/admin/invites'), loadSummary(), loadGifts()]);
    invites = list;
    renderInvites();
  }

  async function boot() {
    try {
      await api('/api/admin/me');
    } catch {
      show('login');
      return;
    }
    show('dashboard');
    await refresh();
  }

  boot();
})();
