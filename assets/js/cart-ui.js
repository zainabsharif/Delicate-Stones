// ---- Cart button, cart drawer and checkout (shared by every shop page) ----
import {
  isConfigured, loadProducts, getCart, onCartChange, addToCart, setCartQty, clearCart,
  cartCount, cartLines, placeOrder, normalizePhone, isValidPhone, formatPrice,
  escapeHtml, waLink, orderCode,
} from './store.js';

const DETAILS_KEY = 'dsCustomer';
let view = 'cart';
let lastOrder = null;
let drawer, body, badge, toastTimer;

export function savedCustomer() {
  try { return JSON.parse(localStorage.getItem(DETAILS_KEY) || '{}') || {}; } catch (e) { return {}; }
}

function rememberCustomer(details) {
  try { localStorage.setItem(DETAILS_KEY, JSON.stringify(details)); } catch (e) {}
}

export function initCart() {
  if (!isConfigured) return;

  const nav = document.querySelector('header nav.wrap');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cart-btn';
  btn.setAttribute('aria-label', 'Open cart');
  btn.innerHTML =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>' +
    '<span class="cart-badge" hidden>0</span>';
  btn.addEventListener('click', () => openCart());
  nav.appendChild(btn);
  badge = btn.querySelector('.cart-badge');

  document.body.insertAdjacentHTML('beforeend', `
    <div class="ds-backdrop" id="cartBackdrop" hidden></div>
    <aside class="ds-drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-label="Your cart" hidden>
      <div class="ds-drawer-head">
        <h3 id="cartTitle">Your cart</h3>
        <button type="button" class="ds-close" aria-label="Close cart">&times;</button>
      </div>
      <div class="ds-drawer-body" id="cartBody"></div>
    </aside>
    <div class="ds-toast" id="dsToast" role="status" hidden></div>
  `);
  drawer = document.getElementById('cartDrawer');
  body = document.getElementById('cartBody');
  drawer.querySelector('.ds-close').addEventListener('click', closeCart);
  document.getElementById('cartBackdrop').addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) closeCart(); });

  body.addEventListener('click', onBodyClick);
  body.addEventListener('submit', onCheckoutSubmit);

  onCartChange(() => { updateBadge(); if (!drawer.hidden && view === 'cart') render(); });
  updateBadge();
}

function updateBadge() {
  const n = cartCount();
  badge.textContent = n;
  badge.hidden = n === 0;
}

export function openCart(startView = 'cart') {
  view = startView;
  document.getElementById('dsToast').hidden = true;
  drawer.hidden = false;
  document.getElementById('cartBackdrop').hidden = false;
  document.body.classList.add('ds-lock');
  requestAnimationFrame(() => drawer.classList.add('open'));
  render();
}

function closeCart() {
  drawer.classList.remove('open');
  document.getElementById('cartBackdrop').hidden = true;
  document.body.classList.remove('ds-lock');
  setTimeout(() => { if (!drawer.classList.contains('open')) drawer.hidden = true; }, 250);
  if (view === 'done') view = 'cart';
}

export function addAndNotify(product) {
  addToCart(product.id);
  const toast = document.getElementById('dsToast');
  toast.innerHTML = `<span>Added <strong>${escapeHtml(product.name)}</strong></span><button type="button">View cart</button>`;
  toast.querySelector('button').onclick = () => { toast.hidden = true; openCart(); };
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

async function render() {
  const title = document.getElementById('cartTitle');
  if (view === 'done') {
    title.textContent = 'Order placed';
    body.innerHTML = renderDone();
    return;
  }
  const products = await loadProducts();
  const lines = cartLines(products);
  const total = lines.reduce((s, l) => s + l.product.price * l.qty, 0);

  if (!lines.length) {
    view = 'cart';
    title.textContent = 'Your cart';
    body.innerHTML = `
      <div class="ds-empty">
        <p>Your cart is empty.</p>
        <a class="btn btn-solid" href="collections.html">Browse the collection</a>
      </div>`;
    return;
  }

  if (view === 'checkout') {
    title.textContent = 'Checkout';
    body.innerHTML = renderCheckout(lines, total);
    return;
  }

  title.textContent = 'Your cart';
  body.innerHTML = `
    <ul class="cart-lines">
      ${lines.map(({ product, qty }) => `
        <li class="cart-line">
          <img src="${escapeHtml(product.image)}" alt="">
          <div class="cart-line-info">
            <div class="cart-line-name">${escapeHtml(product.name)}</div>
            <div class="cart-line-price">${formatPrice(product.price)}</div>
            <div class="qty">
              <button type="button" data-qty="${escapeHtml(product.id)}" data-delta="-1" aria-label="Decrease quantity">−</button>
              <span>${qty}</span>
              <button type="button" data-qty="${escapeHtml(product.id)}" data-delta="1" aria-label="Increase quantity">+</button>
              <button type="button" class="link-btn" data-remove="${escapeHtml(product.id)}">Remove</button>
            </div>
          </div>
          <div class="cart-line-total">${formatPrice(product.price * qty)}</div>
        </li>`).join('')}
    </ul>
    <div class="cart-total"><span>Subtotal</span><strong>${formatPrice(total)}</strong></div>
    <button type="button" class="btn btn-solid btn-block" data-go="checkout">Proceed to checkout</button>
  `;
}

function renderCheckout(lines, total) {
  const c = savedCustomer();
  return `
    <form class="ds-form" id="checkoutForm" novalidate>
      <div class="checkout-summary">
        ${lines.map(({ product, qty }) => `<div><span>${qty} × ${escapeHtml(product.name)}</span><span>${formatPrice(product.price * qty)}</span></div>`).join('')}
        <div class="checkout-summary-total"><span>Total</span><strong>${formatPrice(total)}</strong></div>
      </div>

      <label>Full name<input name="customerName" required maxlength="80" autocomplete="name" value="${escapeHtml(c.customerName)}"></label>
      <label>WhatsApp / phone number<input name="phone" required inputmode="tel" autocomplete="tel" placeholder="0321 1234567" value="${escapeHtml(c.phone)}"></label>
      <label>Delivery address<textarea name="address" required maxlength="300" rows="2" autocomplete="street-address">${escapeHtml(c.address)}</textarea></label>
      <label>City<input name="city" required maxlength="60" autocomplete="address-level2" value="${escapeHtml(c.city)}"></label>
      <label>Notes <span class="opt">(optional — size, colour, gift wrap…)</span><textarea name="notes" maxlength="500" rows="2"></textarea></label>

      <fieldset class="pay-options">
        <legend>Payment</legend>
        <label class="pay-option"><input type="radio" name="paymentMethod" value="cod" checked>
          <span><strong>Cash on delivery</strong><small>Pay in cash when your order arrives.</small></span></label>
        <label class="pay-option"><input type="radio" name="paymentMethod" value="online">
          <span><strong>Online payment</strong><small>After ordering, you'll message Daniya on WhatsApp for account details.</small></span></label>
      </fieldset>

      <p class="ds-error" id="checkoutError" hidden></p>
      <button type="submit" class="btn btn-solid btn-block">Finalise order · ${formatPrice(total)}</button>
      <button type="button" class="link-btn back-link" data-go="cart">← Back to cart</button>
    </form>
  `;
}

function orderMessage(order) {
  const lines = order.items.map((i) => `• ${i.qty} × ${i.name} — ${formatPrice(i.price * i.qty)}`).join('\n');
  const head = `Hi Daniya! I just placed order #${orderCode(order.id)} on the DelicateStones website.`;
  const tail = order.paymentMethod === 'online'
    ? 'I chose online payment — could you please send me your account details?'
    : 'I chose cash on delivery.';
  return `${head}\n\n${lines}\nTotal: ${formatPrice(order.total)}\n\nName: ${order.customerName}\n\n${tail}`;
}

function renderDone() {
  const o = lastOrder;
  const link = escapeHtml(waLink(orderMessage(o)));
  const online = o.paymentMethod === 'online';
  return `
    <div class="ds-done">
      <div class="ds-done-mark">✦</div>
      <h4>Thank you, ${escapeHtml(o.customerName.split(' ')[0])}!</h4>
      <p>Your order <strong>#${orderCode(o.id)}</strong> for <strong>${formatPrice(o.total)}</strong> has been placed.</p>
      ${online ? `
        <p class="ds-done-step">One more step: send Daniya a WhatsApp message to get the account details for your online payment.</p>
        <a class="btn btn-wa btn-block" href="${link}" target="_blank" rel="noopener">Message Daniya for account details</a>
      ` : `
        <p class="ds-done-step">You'll pay in cash when it arrives. Daniya will confirm your order on WhatsApp.</p>
        <a class="btn btn-ghost btn-block" href="${link}" target="_blank" rel="noopener">Send order details on WhatsApp</a>
      `}
    </div>
  `;
}

function onBodyClick(e) {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.qty) {
    const line = getCart().find((l) => l.id === t.dataset.qty);
    if (line) setCartQty(line.id, line.qty + Number(t.dataset.delta));
  } else if (t.dataset.remove) {
    setCartQty(t.dataset.remove, 0);
  } else if (t.dataset.go) {
    view = t.dataset.go;
    render();
  }
}

async function onCheckoutSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const errorEl = form.querySelector('#checkoutError');
  const submit = form.querySelector('button[type="submit"]');
  const f = Object.fromEntries(new FormData(form).entries());
  const details = {
    customerName: f.customerName.trim(),
    phone: normalizePhone(f.phone),
    address: f.address.trim(),
    city: f.city.trim(),
    notes: f.notes.trim(),
    paymentMethod: f.paymentMethod === 'online' ? 'online' : 'cod',
  };

  const problem =
    !details.customerName ? 'Please enter your name.' :
    !isValidPhone(details.phone) ? 'Please enter a valid phone number, e.g. 0321 1234567.' :
    !details.address ? 'Please enter your delivery address.' :
    !details.city ? 'Please enter your city.' : '';
  if (problem) {
    errorEl.textContent = problem;
    errorEl.hidden = false;
    return;
  }

  errorEl.hidden = true;
  submit.disabled = true;
  submit.textContent = 'Placing order…';
  try {
    const lines = cartLines(await loadProducts());
    if (!lines.length) throw new Error('Your cart is empty.');
    const placed = await placeOrder({ ...details, lines });
    rememberCustomer({ customerName: details.customerName, phone: f.phone.trim(), address: details.address, city: details.city });
    lastOrder = { ...details, ...placed };
    clearCart();
    view = 'done';
    render();
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Sorry, the order could not be placed. Please check your connection and try again, or message Daniya on WhatsApp.';
    errorEl.hidden = false;
    submit.disabled = false;
    submit.textContent = 'Finalise order';
  }
}
