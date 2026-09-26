// ---- Collections page: product grid, category filter, reviews ----
import {
  isConfigured, SUBCATEGORIES, categoryLabel, loadProducts, loadAllReviews, reviewStats, hasPrice,
  formatPrice, escapeHtml, stars, waLink, formatDate, normalizePhone, isValidPhone,
  checkReviewEligibility, submitReview,
} from './store.js';
import { initCart, addAndNotify, savedCustomer } from './cart-ui.js';

const grid = document.querySelector('#collection .grid-4');
const buttons = document.querySelectorAll('.category-list button');
let products = [];
let stats = new Map();
let currentCategory = 'all';
let currentSub = 'all';

initCart();
init();

async function init() {
  grid.innerHTML = '<p class="ds-loading">Loading the collection…</p>';
  try {
    products = await loadProducts();
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="ds-loading">The collection couldn't load right now. Please refresh, or <a href="${escapeHtml(waLink('Hi Daniya! I have a question.'))}" target="_blank" rel="noopener">message Daniya on WhatsApp</a>.</p>`;
    return;
  }
  renderGrid();
  setupFilter();
  if (isConfigured) {
    try {
      stats = reviewStats(await loadAllReviews());
      renderGrid();
    } catch (err) {
      console.error('Reviews failed to load', err);
    }
  }
}

function ratingHtml(p) {
  if (!isConfigured) return '';
  const s = stats.get(p.id);
  if (!s) return `<button type="button" class="rating-link muted" data-reviews="${escapeHtml(p.id)}">No reviews yet</button>`;
  const avg = s.sum / s.count;
  return `<button type="button" class="rating-link" data-reviews="${escapeHtml(p.id)}">
    <span class="rating-stars">${stars(avg)}</span> ${avg.toFixed(1)} · ${s.count} review${s.count === 1 ? '' : 's'}
  </button>`;
}

function cardHtml(p) {
  const ask = waLink(`Hi! I'm interested in ${p.name}.`);
  const buy = isConfigured && hasPrice(p)
    ? `<button type="button" class="btn btn-solid btn-sm" data-add="${escapeHtml(p.id)}">Add to cart</button>`
    : '';
  const price = hasPrice(p)
    ? `<div class="price">${formatPrice(p.price)}</div>`
    : (isConfigured ? '<div class="price muted">Price on request</div>' : '');
  return `
    <div class="card" data-category="${escapeHtml(p.category)}" data-sub="${escapeHtml(p.subcategory || '')}">
      <div class="card-art"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy"></div>
      <div class="card-body">
        <div class="eyebrow">${escapeHtml(categoryLabel(p))}</div>
        <h3>${escapeHtml(p.name)}</h3>
        ${ratingHtml(p)}
        <p class="desc">${escapeHtml(p.description)}</p>
        <div class="card-foot">
          ${price}
          <div class="card-actions">
            ${buy}
            <a class="ask" href="${escapeHtml(ask)}" target="_blank" rel="noopener">Ask about this piece</a>
          </div>
        </div>
      </div>
    </div>`;
}

function renderGrid() {
  grid.innerHTML = products.length
    ? products.map(cardHtml).join('')
    : '<p class="ds-loading">New pieces are on their way — check back soon.</p>';
  applyFilter(currentCategory, currentSub);
}

grid.addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  if (add) {
    const p = products.find((x) => x.id === add.dataset.add);
    if (p) addAndNotify(p);
    return;
  }
  const rev = e.target.closest('[data-reviews]');
  if (rev) openReviews(rev.dataset.reviews);
});

// ---------- Category + sub-category filter ----------
// Bracelets and friendship bands get a second row: All / Single / Grouped.
const subList = document.createElement('div');
subList.className = 'category-list subcategory-list';
subList.setAttribute('aria-label', 'Sub-categories');
subList.hidden = true;
document.querySelector('.category-list').after(subList);

function renderSubFilter(category) {
  const subs = SUBCATEGORIES[category];
  subList.hidden = !subs;
  if (!subs) return;
  const all = { all: 'All ' + document.querySelector(`.category-list button[data-category="${category}"]`).textContent };
  subList.innerHTML = Object.entries({ ...all, ...subs }).map(([key, label]) =>
    `<button type="button" data-sub="${key}" class="${key === currentSub ? 'active' : ''}">${escapeHtml(label)}</button>`).join('');
}

function applyFilter(category, sub = 'all') {
  currentCategory = category;
  currentSub = SUBCATEGORIES[category] && (sub === 'all' || SUBCATEGORIES[category][sub]) ? sub : 'all';
  buttons.forEach((btn) => btn.classList.toggle('active', btn.dataset.category === category));
  renderSubFilter(category);
  grid.querySelectorAll('.card').forEach((card) => {
    const inCategory = category === 'all' || card.dataset.category === category;
    const inSub = currentSub === 'all' || card.dataset.sub === currentSub;
    card.style.display = inCategory && inSub ? '' : 'none';
  });
}

function animateFilter(category, sub) {
  if (window.__pt && window.__pt.playInPage) window.__pt.playInPage(() => applyFilter(category, sub));
  else applyFilter(category, sub);
}

function setupFilter() {
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.classList.contains('active')) return;
      animateFilter(button.dataset.category);
    });
  });
  subList.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sub]');
    if (!b || b.classList.contains('active')) return;
    animateFilter(currentCategory, b.dataset.sub);
  });
  // Links like collections.html#bracelet or collections.html#bracelet-grouped
  const [requested, requestedSub] = window.location.hash.replace('#', '').split('-');
  const valid = Array.from(buttons).map((b) => b.dataset.category);
  applyFilter(valid.includes(requested) ? requested : 'all', requestedSub || 'all');
}

// ---------- Reviews modal ----------
document.body.insertAdjacentHTML('beforeend', `
  <div class="ds-backdrop" id="reviewBackdrop" hidden></div>
  <div class="ds-modal" id="reviewModal" role="dialog" aria-modal="true" aria-labelledby="reviewTitle" hidden>
    <div class="ds-drawer-head">
      <h3 id="reviewTitle">Reviews</h3>
      <button type="button" class="ds-close" aria-label="Close reviews">&times;</button>
    </div>
    <div class="ds-drawer-body" id="reviewBody"></div>
  </div>
`);
const modal = document.getElementById('reviewModal');
const modalBody = document.getElementById('reviewBody');
const modalBackdrop = document.getElementById('reviewBackdrop');
let activeProduct = null;
let chosenRating = 0;

function closeReviews() {
  modal.hidden = true;
  modalBackdrop.hidden = true;
  document.body.classList.remove('ds-lock');
}
modal.querySelector('.ds-close').addEventListener('click', closeReviews);
modalBackdrop.addEventListener('click', closeReviews);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeReviews(); });

function openReviews(productId) {
  activeProduct = products.find((p) => p.id === productId);
  if (!activeProduct) return;
  chosenRating = 0;
  renderReviews();
  modal.hidden = false;
  modalBackdrop.hidden = false;
  document.body.classList.add('ds-lock');
}

function renderReviews() {
  const p = activeProduct;
  const s = stats.get(p.id);
  const list = s ? s.list : [];
  document.getElementById('reviewTitle').textContent = p.name;
  const c = savedCustomer();
  modalBody.innerHTML = `
    ${s ? `<div class="review-summary"><span class="rating-stars">${stars(s.sum / s.count)}</span> ${(s.sum / s.count).toFixed(1)} out of 5 · ${s.count} review${s.count === 1 ? '' : 's'}</div>` : ''}
    <div class="review-list">
      ${list.length ? list.map((r) => `
        <div class="review-entry">
          <div class="rating-stars">${stars(r.rating)}</div>
          <p>${escapeHtml(r.text)}</p>
          <div class="review-by">${escapeHtml(r.name)}${r.createdAt ? ' · ' + formatDate(r.createdAt) : ''} · <span class="verified">Verified purchase</span></div>
        </div>`).join('') : '<p class="muted">No reviews yet for this piece.</p>'}
    </div>

    <form class="ds-form review-form" id="reviewForm" novalidate>
      <h4>Write a review</h4>
      <p class="muted small">Reviews are open to customers whose order of this piece has been delivered. Use the phone number you ordered with.</p>
      <label>Phone number used for your order<input name="phone" required inputmode="tel" placeholder="0321 1234567" value="${escapeHtml(c.phone)}"></label>
      <label>Your name (shown with the review)<input name="name" required maxlength="60" value="${escapeHtml(c.customerName)}"></label>
      <div class="star-input" role="radiogroup" aria-label="Rating">
        ${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="false" aria-label="${n} star${n > 1 ? 's' : ''}" data-star="${n}">★</button>`).join('')}
      </div>
      <label>Your review<textarea name="text" required maxlength="1000" rows="3"></textarea></label>
      <p class="ds-error" id="reviewError" hidden></p>
      <button type="submit" class="btn btn-solid btn-block">Submit review</button>
    </form>
  `;
}

modalBody.addEventListener('click', (e) => {
  const star = e.target.closest('[data-star]');
  if (!star) return;
  chosenRating = Number(star.dataset.star);
  modalBody.querySelectorAll('[data-star]').forEach((b) => {
    const on = Number(b.dataset.star) <= chosenRating;
    b.classList.toggle('on', on);
    b.setAttribute('aria-checked', String(Number(b.dataset.star) === chosenRating));
  });
});

modalBody.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const errorEl = form.querySelector('#reviewError');
  const submit = form.querySelector('button[type="submit"]');
  const f = Object.fromEntries(new FormData(form).entries());
  const phone = normalizePhone(f.phone);
  const name = f.name.trim();
  const text = f.text.trim();
  const showError = (msg) => { errorEl.textContent = msg; errorEl.hidden = false; };

  if (!isValidPhone(phone)) return showError('Please enter the phone number you ordered with.');
  if (!name) return showError('Please enter your name.');
  if (!chosenRating) return showError('Please choose a star rating.');
  if (!text) return showError('Please write a few words about the piece.');

  errorEl.hidden = true;
  submit.disabled = true;
  submit.textContent = 'Checking your order…';
  try {
    const check = await checkReviewEligibility(phone, activeProduct.id);
    if (!check.purchased) {
      showError("We couldn't find a delivered order of this piece for that phone number. Reviews open once your order has been delivered.");
    } else if (check.alreadyReviewed) {
      showError("You've already reviewed this piece — thank you!");
    } else {
      await submitReview(check.key, {
        productId: activeProduct.id,
        productName: activeProduct.name,
        name, rating: chosenRating, text,
      });
      stats = reviewStats(await loadAllReviews());
      renderGrid();
      renderReviews();
      return;
    }
  } catch (err) {
    console.error(err);
    showError('Sorry, the review could not be saved. Please try again.');
  }
  submit.disabled = false;
  submit.textContent = 'Submit review';
});
