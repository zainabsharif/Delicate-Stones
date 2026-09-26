// ---- Store Owner page: orders, products, reviews ----
import {
  app, db, isConfigured, CATEGORIES, SUBCATEGORIES, SUBCATEGORY_SHORT, categoryLabel, escapeHtml, formatPrice, formatDate, orderCode,
  phoneHash, purchaseKey, sortProducts, stars,
} from './store.js';
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  collection, doc, getDoc, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc,
  writeBatch, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { SEED_PRODUCTS } from './catalogue-seed.js';

const root = document.getElementById('app');
const state = {
  tab: 'orders',
  orderFilter: 'active',
  orders: [],
  products: [],
  reviews: [],
  editingId: null,
  formImage: '',
  search: '',
};
let unsubscribers = [];
let productListDirty = false;

const ORDER_FILTERS = {
  active: { label: 'To do', test: (o) => o.status === 'pending' || o.status === 'confirmed' },
  pending: { label: 'New', test: (o) => o.status === 'pending' },
  confirmed: { label: 'Approved', test: (o) => o.status === 'confirmed' },
  delivered: { label: 'Delivered', test: (o) => o.status === 'delivered' },
  unpaid: { label: 'Unpaid', test: (o) => !o.paid && o.status !== 'cancelled' },
  cancelled: { label: 'Cancelled', test: (o) => o.status === 'cancelled' },
  all: { label: 'All', test: () => true },
};
const STATUS_LABELS = { pending: 'New', confirmed: 'Approved', delivered: 'Delivered', cancelled: 'Cancelled' };

if (!isConfigured) {
  root.innerHTML = `
    <div class="panel notice">
      <h2>Connect the database first</h2>
      <p>This page needs a Firebase project. Follow <strong>README → Store backend setup</strong>, then paste your project's config into <code>assets/js/firebase-config.js</code>.</p>
    </div>`;
} else {
  const auth = getAuth(app);
  document.getElementById('signOutBtn').addEventListener('click', () => signOut(auth));
  onAuthStateChanged(auth, (user) => onUser(auth, user));
}

async function onUser(auth, user) {
  unsubscribers.forEach((u) => u());
  unsubscribers = [];
  const who = document.getElementById('who');

  if (!user) {
    who.hidden = true;
    renderLogin(auth);
    return;
  }

  who.hidden = false;
  document.getElementById('whoEmail').textContent = user.email;
  root.innerHTML = '<p class="empty">Checking access…</p>';

  let isAdmin = false;
  try {
    isAdmin = (await getDoc(doc(db, 'admins', user.uid))).exists();
  } catch (err) {
    console.error(err);
  }
  if (!isAdmin) {
    root.innerHTML = `
      <div class="panel notice">
        <h2>This account isn't a store owner yet</h2>
        <p>In Firebase console → Firestore Database, create a collection called <code>admins</code> and add a document whose ID is:</p>
        <p><code>${escapeHtml(user.uid)}</code></p>
        <p>Give it any field (e.g. <code>name</code> = <code>Daniya</code>), then reload this page. If you've already done that, check that the rules from <code>firestore.rules</code> are published.</p>
      </div>`;
    return;
  }

  renderDashboard();
  unsubscribers.push(
    onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
      state.orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderOrders();
    }, (err) => showListenError('orderList', err)),
    onSnapshot(collection(db, 'products'), (snap) => {
      state.products = sortProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      renderProducts();
      renderOrders();
    }, (err) => showListenError('prodList', err)),
    onSnapshot(query(collection(db, 'reviews'), orderBy('createdAt', 'desc')), (snap) => {
      state.reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderReviews();
    }, (err) => showListenError('revList', err)),
  );
}

function showListenError(id, err) {
  console.error(err);
  const el = document.getElementById(id);
  if (el) el.innerHTML = '<p class="ds-error">Could not load this list. Check your connection and that firestore.rules is published.</p>';
}

// ---------- Login ----------
function renderLogin(auth) {
  root.innerHTML = `
    <form class="panel ds-form login" id="loginForm" novalidate>
      <h2>Store owner sign in</h2>
      <label>Email<input name="email" type="email" autocomplete="username" required></label>
      <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
      <p class="ds-error" id="loginError" hidden></p>
      <p class="ds-success" id="loginNote" hidden></p>
      <button type="submit" class="btn btn-solid btn-block">Sign in</button>
      <button type="button" class="link-btn back-link" id="forgotBtn">Forgot password?</button>
    </form>`;
  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError');
  const noteEl = document.getElementById('loginNote');

  document.getElementById('forgotBtn').addEventListener('click', async (e) => {
    const email = form.email.value.trim();
    errorEl.hidden = true;
    noteEl.hidden = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorEl.textContent = 'Type your email address above first, then tap "Forgot password?" again.';
      errorEl.hidden = false;
      form.email.focus();
      return;
    }
    e.target.disabled = true;
    try {
      await sendPasswordResetEmail(auth, email);
      // Firebase doesn't reveal whether the address has an account, so the message is the same either way.
      noteEl.textContent = `If ${email} is a store owner account, a password reset link is on its way. Check the inbox (and spam folder), set a new password, then sign in here.`;
      noteEl.hidden = false;
    } catch (err) {
      errorEl.textContent = err.code === 'auth/too-many-requests'
        ? 'Too many attempts. Please wait a few minutes and try again.'
        : 'Could not send the reset email: ' + (err.code || err.message);
      errorEl.hidden = false;
    }
    e.target.disabled = false;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form).entries());
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    errorEl.hidden = true;
    noteEl.hidden = true;
    try {
      await signInWithEmailAndPassword(auth, f.email.trim(), f.password);
    } catch (err) {
      errorEl.textContent = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
        ? 'Wrong email or password.'
        : 'Could not sign in: ' + (err.code || err.message);
      errorEl.hidden = false;
      btn.disabled = false;
    }
  });
}

// ---------- Dashboard shell ----------
function renderDashboard() {
  root.innerHTML = `
    <nav class="tabs" role="tablist">
      <button type="button" data-tab="orders" class="active">Orders <span class="tab-count" id="pendingCount" hidden></span></button>
      <button type="button" data-tab="products">Products</button>
      <button type="button" data-tab="reviews">Reviews</button>
    </nav>

    <section id="tab-orders">
      <div class="chips" id="orderChips"></div>
      <div class="orders" id="orderList"><p class="empty">Loading orders…</p></div>
    </section>

    <section id="tab-products" hidden>
      <div class="prod-layout">
        <form class="panel ds-form prod-form" id="prodForm" novalidate>
          <h3 id="prodFormTitle">Add a new piece</h3>
          <label>Name<input name="name" required maxlength="120"></label>
          <div class="row2">
            <label>Category<select name="category">
              ${Object.entries(CATEGORIES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
            </select></label>
            <label>Price (Rs.)<input name="price" type="number" min="0" step="1" placeholder="e.g. 1200"></label>
          </div>
          <label id="subField" hidden>Type<select name="subcategory"></select></label>
          <label>Description<textarea name="description" rows="4" maxlength="1000"></textarea></label>
          <label>Photo<input name="photo" type="file" accept="image/*"></label>
          <label>…or image path / URL<input name="imageUrl" placeholder="./assets/Items/Bracelets/…jpeg"></label>
          <img class="img-preview" id="imgPreview" alt="" hidden>
          <label class="check"><input name="visible" type="checkbox" checked> Show on the website</label>
          <p class="ds-error" id="prodError" hidden></p>
          <button type="submit" class="btn btn-solid btn-block" id="prodSubmit">Add piece</button>
          <button type="button" class="link-btn back-link" id="prodCancel" hidden>Cancel editing</button>
        </form>
        <div>
          <div id="importBanner"></div>
          <div class="prod-toolbar">
            <span id="prodCount"></span>
            <input type="search" id="prodSearch" placeholder="Search pieces…" aria-label="Search pieces">
          </div>
          <div class="prod-list" id="prodList"><p class="empty">Loading products…</p></div>
        </div>
      </div>
    </section>

    <section id="tab-reviews" hidden>
      <div class="rev-list" id="revList"><p class="empty">Loading reviews…</p></div>
    </section>
  `;

  root.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    state.tab = b.dataset.tab;
    root.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('active', x === b));
    ['orders', 'products', 'reviews'].forEach((t) => { document.getElementById('tab-' + t).hidden = t !== state.tab; });
  });

  document.getElementById('orderChips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-filter]');
    if (!b) return;
    state.orderFilter = b.dataset.filter;
    renderOrders();
  });
  document.getElementById('orderList').addEventListener('click', onOrderAction);

  setupProductForm();
  const list = document.getElementById('prodList');
  list.addEventListener('click', onProductAction);
  list.addEventListener('change', onPriceChange);
  list.addEventListener('change', onSubChange);
  list.addEventListener('change', onCatChange);
  list.addEventListener('focusout', () => {
    setTimeout(() => {
      if (productListDirty && !list.contains(document.activeElement)) renderProducts();
    }, 0);
  });
  document.getElementById('prodSearch').addEventListener('input', (e) => {
    state.search = e.target.value.trim().toLowerCase();
    renderProducts();
  });
  document.getElementById('revList').addEventListener('click', onReviewAction);
}

// ---------- Orders ----------
function renderOrders() {
  const list = document.getElementById('orderList');
  if (!list) return;

  const pending = state.orders.filter((o) => o.status === 'pending').length;
  const countEl = document.getElementById('pendingCount');
  countEl.textContent = pending;
  countEl.hidden = pending === 0;
  document.title = (pending ? `(${pending}) ` : '') + 'Store Owner — DelicateStones';

  document.getElementById('orderChips').innerHTML = Object.entries(ORDER_FILTERS).map(([key, f]) => {
    const n = state.orders.filter(f.test).length;
    return `<button type="button" data-filter="${key}" class="${key === state.orderFilter ? 'active' : ''}">${f.label} (${n})</button>`;
  }).join('');

  const shown = state.orders.filter(ORDER_FILTERS[state.orderFilter].test);
  list.innerHTML = shown.length
    ? shown.map(orderHtml).join('')
    : '<p class="empty">No orders here.</p>';
}

function orderHtml(o) {
  const products = new Map(state.products.map((p) => [p.id, p]));
  const open = o.status === 'pending' || o.status === 'confirmed';
  const items = Array.isArray(o.items) ? o.items : [];
  const itemsSum = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);

  const rows = items.map((i) => {
    const current = products.get(i.productId);
    const warn = open && current && current.price !== i.price
      ? `<span class="warn">Catalogue price is ${current.price ? formatPrice(current.price) : 'not set'}</span>` : '';
    return `<tr><td>${Number(i.qty)} × ${escapeHtml(i.name)}${warn}</td><td>${formatPrice(i.price * i.qty)}</td></tr>`;
  }).join('');
  const totalWarn = itemsSum !== o.total ? `<span class="warn">Items add up to ${formatPrice(itemsSum)}</span>` : '';

  const act = (name, label, cls = 'btn-ghost') => `<button type="button" class="btn ${cls}" data-act="${name}" data-id="${o.id}">${label}</button>`;
  const actions = [
    o.status === 'pending' && act('approve', 'Approve order', 'btn-solid'),
    o.status === 'confirmed' && act('deliver', 'Mark delivered', 'btn-solid'),
    o.status !== 'cancelled' && (o.paid ? act('unpaid', 'Mark unpaid') : act('paid', 'Mark paid')),
    open && act('cancel', 'Cancel', 'btn-danger'),
    o.status === 'cancelled' && act('restore', 'Restore'),
  ].filter(Boolean).join('');

  return `
    <article class="order">
      <div class="order-head">
        <div class="order-code">#${orderCode(o.id)}<span class="order-date">${formatDate(o.createdAt)}${o.createdAt ? ', ' + o.createdAt.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}</span></div>
        <div class="badges">
          <span class="badge b-${o.status}">${STATUS_LABELS[o.status] || escapeHtml(o.status)}</span>
          ${o.status !== 'cancelled' ? `<span class="badge ${o.paid ? 'b-paid' : 'b-unpaid'}">${o.paid ? 'Paid' : 'Unpaid'}</span>` : ''}
          <span class="badge b-method">${o.paymentMethod === 'online' ? 'Online payment' : 'Cash on delivery'}</span>
        </div>
      </div>
      <div class="order-grid">
        <div class="order-cust">
          <strong>${escapeHtml(o.customerName)}</strong>
          <a href="https://wa.me/${escapeHtml(o.phone)}" target="_blank" rel="noopener">+${escapeHtml(o.phone)} · WhatsApp</a>
          <span>${escapeHtml(o.address)}</span>
          <span>${escapeHtml(o.city)}</span>
          ${o.notes ? `<div class="order-notes">“${escapeHtml(o.notes)}”</div>` : ''}
        </div>
        <table class="order-items">
          ${rows}
          <tr class="total"><td>Total${totalWarn}</td><td>${formatPrice(o.total)}</td></tr>
        </table>
      </div>
      ${actions ? `<div class="order-actions">${actions}</div>` : ''}
    </article>`;
}

async function onOrderAction(e) {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const o = state.orders.find((x) => x.id === b.dataset.id);
  if (!o) return;
  const ref = doc(db, 'orders', o.id);
  const code = '#' + orderCode(o.id);

  b.disabled = true;
  try {
    switch (b.dataset.act) {
      case 'approve':
        await updateDoc(ref, { status: 'confirmed', confirmedAt: serverTimestamp() });
        break;
      case 'deliver':
        if (!confirm(`Mark order ${code} as delivered?\n\n${o.customerName} will then be able to review these pieces.`)) break;
        await markDelivered(o);
        break;
      case 'paid':
        await updateDoc(ref, { paid: true, paidAt: serverTimestamp() });
        break;
      case 'unpaid':
        await updateDoc(ref, { paid: false, paidAt: null });
        break;
      case 'cancel':
        if (!confirm(`Cancel order ${code}?`)) break;
        await updateDoc(ref, { status: 'cancelled', cancelledAt: serverTimestamp() });
        break;
      case 'restore':
        await updateDoc(ref, { status: 'pending', cancelledAt: null });
        break;
    }
  } catch (err) {
    console.error(err);
    alert('That change could not be saved: ' + (err.code || err.message));
  }
  b.disabled = false;
}

// Delivery unlocks reviews: one purchases/{phoneHash_productId} record per piece.
async function markDelivered(o) {
  const hash = await phoneHash(o.phone);
  const batch = writeBatch(db);
  batch.update(doc(db, 'orders', o.id), { status: 'delivered', deliveredAt: serverTimestamp() });
  const seen = new Set();
  for (const item of o.items) {
    if (seen.has(item.productId)) continue;
    seen.add(item.productId);
    batch.set(doc(db, 'purchases', purchaseKey(hash, item.productId)), {
      productId: item.productId,
      productName: item.name,
      orderId: o.id,
      createdAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

// ---------- Products ----------
function renderProducts() {
  const list = document.getElementById('prodList');
  if (!list) return;
  if (list.contains(document.activeElement)) {
    productListDirty = true;
    return;
  }
  productListDirty = false;

  const all = state.products;
  const unpriced = all.filter((p) => !(p.price > 0)).length;
  const untyped = all.filter((p) => SUBCATEGORIES[p.category] && !SUBCATEGORY_SHORT[p.subcategory]).length;
  document.getElementById('prodCount').textContent =
    `${all.length} piece${all.length === 1 ? '' : 's'}` +
    (unpriced ? ` · ${unpriced} without a price (not buyable yet)` : '') +
    (untyped ? ` · ${untyped} not marked single/grouped` : '');

  document.getElementById('importBanner').innerHTML = all.length === 0 ? `
    <div class="import-banner">
      <span>The database has no products yet. Import the ${SEED_PRODUCTS.length} pieces from the original site, then set their prices.</span>
      <button type="button" class="btn btn-solid" id="importBtn">Import starter catalogue</button>
    </div>` : '';
  const importBtn = document.getElementById('importBtn');
  if (importBtn) importBtn.onclick = importSeed;

  const q = state.search;
  const shown = q ? all.filter((p) => (p.name + ' ' + categoryLabel(p)).toLowerCase().includes(q)) : all;
  list.innerHTML = shown.length ? shown.map((p) => `
    <div class="prod-row ${p.visible === false ? 'hidden-prod' : ''}">
      <img src="${escapeHtml(p.image)}" alt="">
      <div>
        <div class="prod-name">${escapeHtml(p.name)}</div>
        <div class="prod-cat">${catSelectHtml(p)}${SUBCATEGORIES[p.category] ? subSelectHtml(p) : ''}${p.visible === false ? ' · hidden' : ''}</div>
      </div>
      <label class="price-edit">Rs.
        <input type="number" min="0" step="1" data-price="${escapeHtml(p.id)}" value="${p.price > 0 ? p.price : ''}" class="${p.price > 0 ? '' : 'need'}" aria-label="Price for ${escapeHtml(p.name)}">
      </label>
      <div class="prod-btns">
        <button type="button" class="btn btn-ghost" data-edit="${escapeHtml(p.id)}">Edit details</button>
        <button type="button" class="btn btn-ghost" data-toggle="${escapeHtml(p.id)}">${p.visible === false ? 'Show' : 'Hide'}</button>
        <button type="button" class="btn btn-danger" data-delete="${escapeHtml(p.id)}">Delete</button>
      </div>
    </div>`).join('') : `<p class="empty">${all.length ? 'No pieces match that search.' : 'No products yet.'}</p>`;
}

function subOptions(category, selected) {
  const set = SUBCATEGORY_SHORT[selected] ? selected : '';
  return `<option value="" ${set ? '' : 'selected'}>Choose…</option>` +
    Object.entries(SUBCATEGORIES[category]).map(([k, v]) =>
      `<option value="${k}" ${k === set ? 'selected' : ''}>${v}</option>`).join('');
}

function subSelectHtml(p) {
  const set = Boolean(SUBCATEGORY_SHORT[p.subcategory]);
  return `<select class="sub-edit ${set ? '' : 'need'}" data-sub="${escapeHtml(p.id)}" aria-label="Single or grouped: ${escapeHtml(p.name)}">${subOptions(p.category, p.subcategory)}</select>`;
}

function catSelectHtml(p) {
  return `<select class="sub-edit cat-edit" data-cat="${escapeHtml(p.id)}" aria-label="Category: ${escapeHtml(p.name)}">` +
    Object.entries(CATEGORIES).map(([k, v]) => `<option value="${k}" ${k === p.category ? 'selected' : ''}>${v}</option>`).join('') +
    '</select>';
}

// Moving a piece to another category: keep its single/grouped type only if the new category has one.
async function onCatChange(e) {
  const select = e.target.closest('[data-cat]');
  if (!select) return;
  const p = state.products.find((x) => x.id === select.dataset.cat);
  if (!p) return;
  const category = select.value;
  const subcategory = SUBCATEGORIES[category] && SUBCATEGORY_SHORT[p.subcategory] ? p.subcategory : null;
  try {
    await updateDoc(doc(db, 'products', p.id), { category, subcategory, updatedAt: serverTimestamp() });
    select.blur();
  } catch (err) {
    console.error(err);
    alert('Could not be moved: ' + (err.code || err.message));
    select.value = p.category;
  }
}

async function onSubChange(e) {
  const select = e.target.closest('[data-sub]');
  if (!select) return;
  select.classList.toggle('need', !select.value);
  try {
    await updateDoc(doc(db, 'products', select.dataset.sub), { subcategory: select.value || null });
  } catch (err) {
    console.error(err);
    alert('Could not be saved: ' + (err.code || err.message));
  }
}

async function importSeed() {
  const btn = document.getElementById('importBtn');
  btn.disabled = true;
  btn.textContent = 'Importing…';
  try {
    const batch = writeBatch(db);
    for (const s of SEED_PRODUCTS) {
      batch.set(doc(db, 'products', s.id), {
        name: s.name, category: s.category, subcategory: s.subcategory, description: s.description, image: s.image,
        price: null, visible: true, sortOrder: s.sortOrder, createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (err) {
    console.error(err);
    alert('Import failed: ' + (err.code || err.message));
    btn.disabled = false;
    btn.textContent = 'Import starter catalogue';
  }
}

function parsePrice(value) {
  const n = Math.round(Number(value));
  return value !== '' && Number.isFinite(n) && n > 0 ? n : null;
}

async function onPriceChange(e) {
  const input = e.target.closest('[data-price]');
  if (!input) return;
  const price = parsePrice(input.value);
  input.classList.toggle('need', !price);
  try {
    await updateDoc(doc(db, 'products', input.dataset.price), { price });
    const tick = document.createElement('span');
    tick.className = 'saved';
    tick.textContent = 'Saved';
    input.after(tick);
    setTimeout(() => tick.remove(), 1500);
  } catch (err) {
    console.error(err);
    alert('Price could not be saved: ' + (err.code || err.message));
  }
}

async function onProductAction(e) {
  const b = e.target.closest('button');
  if (!b) return;
  const id = b.dataset.edit || b.dataset.toggle || b.dataset.delete;
  const p = state.products.find((x) => x.id === id);
  if (!p) return;

  if (b.dataset.edit) {
    startEditing(p);
    return;
  }
  try {
    if (b.dataset.toggle) {
      await updateDoc(doc(db, 'products', p.id), { visible: p.visible === false });
    } else if (b.dataset.delete) {
      if (!confirm(`Delete "${p.name}"? This can't be undone. (Tip: "Hide" removes it from the site but keeps it here.)`)) return;
      await deleteDoc(doc(db, 'products', p.id));
      if (state.editingId === p.id) resetProductForm();
    }
  } catch (err) {
    console.error(err);
    alert('That change could not be saved: ' + (err.code || err.message));
  }
}

function setupProductForm() {
  const form = document.getElementById('prodForm');
  const preview = document.getElementById('imgPreview');

  form.photo.addEventListener('change', async () => {
    const file = form.photo.files[0];
    if (!file) return;
    try {
      state.formImage = await resizeImage(file);
      form.imageUrl.value = '';
      preview.src = state.formImage;
      preview.hidden = false;
    } catch (err) {
      showProdError(err.message);
    }
  });
  let previewTimer;
  form.imageUrl.addEventListener('input', () => {
    state.formImage = form.imageUrl.value.trim();
    form.photo.value = '';
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      preview.src = state.formImage;
      preview.hidden = !state.formImage;
    }, 600);
  });
  document.getElementById('prodCancel').addEventListener('click', resetProductForm);
  form.category.addEventListener('change', () => syncSubField(form, form.subcategory.value));
  syncSubField(form, '');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const hasSubs = Boolean(SUBCATEGORIES[form.category.value]);
    const data = {
      name: form.elements.name.value.trim(),
      category: form.category.value,
      subcategory: hasSubs ? (form.subcategory.value || null) : null,
      price: parsePrice(form.price.value),
      description: form.description.value.trim(),
      image: state.formImage,
      visible: form.visible.checked,
    };
    if (!data.name) return showProdError('Please give the piece a name.');
    if (hasSubs && !data.subcategory) return showProdError('Please choose whether it is single or grouped.');
    if (!data.image) return showProdError('Please add a photo or an image path.');

    const submit = document.getElementById('prodSubmit');
    submit.disabled = true;
    document.getElementById('prodError').hidden = true;
    try {
      if (state.editingId) {
        await updateDoc(doc(db, 'products', state.editingId), { ...data, updatedAt: serverTimestamp() });
      } else {
        const minSort = state.products.reduce((m, p) => Math.min(m, p.sortOrder ?? 0), 0);
        await addDoc(collection(db, 'products'), { ...data, sortOrder: minSort - 1, createdAt: serverTimestamp() });
      }
      resetProductForm();
    } catch (err) {
      console.error(err);
      showProdError('Could not save: ' + (err.code || err.message));
    }
    submit.disabled = false;
  });
}

// The Type (single / grouped) dropdown only appears for categories that have sub-categories.
function syncSubField(form, selected) {
  const subs = SUBCATEGORIES[form.category.value];
  document.getElementById('subField').hidden = !subs;
  form.subcategory.innerHTML = subs ? subOptions(form.category.value, selected) : '';
}

function showProdError(msg) {
  const el = document.getElementById('prodError');
  el.textContent = msg;
  el.hidden = false;
}

function startEditing(p) {
  const form = document.getElementById('prodForm');
  state.editingId = p.id;
  state.formImage = p.image || '';
  form.elements.name.value = p.name || '';
  form.category.value = p.category || 'bracelet';
  syncSubField(form, p.subcategory);
  form.price.value = p.price > 0 ? p.price : '';
  form.description.value = p.description || '';
  form.photo.value = '';
  form.imageUrl.value = state.formImage.startsWith('data:') ? '' : state.formImage;
  form.imageUrl.placeholder = state.formImage.startsWith('data:') ? '(uploaded photo — choose a new one to replace it)' : './assets/Items/Bracelets/…jpeg';
  form.visible.checked = p.visible !== false;
  const preview = document.getElementById('imgPreview');
  preview.src = state.formImage;
  preview.hidden = !state.formImage;
  document.getElementById('prodFormTitle').textContent = 'Edit piece';
  document.getElementById('prodSubmit').textContent = 'Save changes';
  document.getElementById('prodCancel').hidden = false;
  document.getElementById('prodError').hidden = true;
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetProductForm() {
  const form = document.getElementById('prodForm');
  form.reset();
  syncSubField(form, '');
  state.editingId = null;
  state.formImage = '';
  form.imageUrl.placeholder = './assets/Items/Bracelets/…jpeg';
  document.getElementById('imgPreview').hidden = true;
  document.getElementById('prodFormTitle').textContent = 'Add a new piece';
  document.getElementById('prodSubmit').textContent = 'Add piece';
  document.getElementById('prodCancel').hidden = true;
  document.getElementById('prodError').hidden = true;
}

// Photos are stored inside the product record (free Firebase plan has no file storage),
// so they're shrunk to a small JPEG first.
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let size = 800;
      let quality = 0.82;
      let out;
      do {
        const scale = Math.min(1, size / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        out = canvas.toDataURL('image/jpeg', quality);
        size = Math.round(size * 0.8);
        quality = Math.max(0.5, quality - 0.08);
      } while (out.length > 600000 && size > 200);
      resolve(out);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That photo couldn't be read. Try a JPEG or PNG."));
    };
    img.src = url;
  });
}

// ---------- Reviews ----------
function renderReviews() {
  const list = document.getElementById('revList');
  if (!list) return;
  list.innerHTML = state.reviews.length ? state.reviews.map((r) => `
    <div class="rev">
      <div>
        <div class="rating-stars">${stars(r.rating)}</div>
        <p>${escapeHtml(r.text)}</p>
        <div class="rev-meta">${escapeHtml(r.name)} · ${escapeHtml(r.productName)} · ${formatDate(r.createdAt)}</div>
      </div>
      <button type="button" class="btn btn-danger" data-delete-review="${escapeHtml(r.id)}">Delete</button>
    </div>`).join('') : '<p class="empty">No reviews yet. Customers can review a piece once you mark their order as delivered.</p>';
}

async function onReviewAction(e) {
  const b = e.target.closest('[data-delete-review]');
  if (!b || !confirm('Delete this review?')) return;
  try {
    await deleteDoc(doc(db, 'reviews', b.dataset.deleteReview));
  } catch (err) {
    alert('Could not delete: ' + (err.code || err.message));
  }
}
