// ---- Home page: cart button + latest verified reviews ----
import { isConfigured, loadLatestReviews, loadProducts, escapeHtml, stars } from './store.js';
import { initCart } from './cart-ui.js';

initCart();

const AVATAR_COLORS = [
  'background:var(--gold-light);',
  'background:var(--blush);',
  'background:var(--gold);',
  'background:var(--teal); color:var(--ivory);',
];

async function renderReviews() {
  const row = document.getElementById('reviewsRow');
  if (!isConfigured || !row) return;
  try {
    const [reviews, products] = await Promise.all([loadLatestReviews(12), loadProducts()]);
    const images = new Map(products.map((p) => [p.id, p.image]));
    row.innerHTML = reviews.length ? reviews.map((r, i) => {
      const img = images.get(r.productId);
      return `
        <div class="scroll-item review-card">
          <div class="review-stars">${stars(r.rating)}</div>
          <p class="review-quote">"${escapeHtml(r.text)}"</p>
          <div class="review-meta">
            <div class="review-avatar" style="${AVATAR_COLORS[i % AVATAR_COLORS.length]}">${escapeHtml(r.name.charAt(0).toUpperCase())}</div>
            <div>
              <div class="review-name">${escapeHtml(r.name)}</div>
              <div class="review-item">
                ${img ? `<img src="${escapeHtml(img)}" alt="">` : ''}
                Purchased: ${escapeHtml(r.productName)}
              </div>
            </div>
          </div>
        </div>`;
    }).join('') : `
      <div class="scroll-item review-card">
        <p class="review-quote">Reviews from customers appear here once their orders have been delivered. Ordered a piece? Find it in the <a href="collections.html" style="color:var(--gold-dark); text-decoration:underline;">collection</a> and tap its reviews to share your thoughts.</p>
      </div>`;
  } catch (err) {
    console.error('Reviews failed to load', err);
  }
}

renderReviews();
