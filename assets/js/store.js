// ---- Shared data layer: Firebase, products, cart, orders, reviews ----
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc,
  query, orderBy, limit, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { firebaseConfig, WHATSAPP_NUMBER, CURRENCY } from './firebase-config.js';
import { SEED_PRODUCTS } from './catalogue-seed.js';

export const isConfigured = Boolean(firebaseConfig.apiKey) && !firebaseConfig.apiKey.startsWith('PASTE');
export const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;

if (!isConfigured) {
  console.warn('[DelicateStones] Firebase is not configured — showing the built-in catalogue without cart or reviews. See README → Store backend setup.');
}

export const CATEGORIES = {
  necklace: 'Necklace',
  sets: 'Set',
  ring: 'Ring',
  bracelet: 'Bracelet',
  earring: 'Earrings',
  friendship: 'Friendship Bands',
  keychain: 'Keychain',
};

// ---------- Helpers ----------
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function formatPrice(amount) {
  return CURRENCY + ' ' + Number(amount || 0).toLocaleString('en-PK');
}

export function hasPrice(product) {
  return typeof product.price === 'number' && product.price > 0;
}

export function stars(rating) {
  const r = Math.round(rating);
  return '★★★★★'.slice(0, r) + '☆☆☆☆☆'.slice(0, 5 - r);
}

export function waLink(text) {
  return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
}

export function orderCode(orderId) {
  return orderId.slice(0, 6).toUpperCase();
}

// Pakistani numbers are stored as 92XXXXXXXXXX so "0321…", "+92 321…" and "321…" all match.
export function normalizePhone(input) {
  let d = String(input || '').replace(/\D/g, '');
  if (d.startsWith('0092')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = '92' + d.slice(1);
  if (d.length === 10 && d.startsWith('3')) d = '92' + d;
  return d;
}

export function isValidPhone(normalized) {
  return /^[0-9]{10,15}$/.test(normalized);
}

// Purchases and reviews are keyed by a hash of the phone number so the number
// itself never appears in publicly readable data.
export async function phoneHash(normalized) {
  const bytes = new TextEncoder().encode('delicatestones:' + normalized);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

export function purchaseKey(hash, productId) {
  return hash + '_' + productId;
}

// ---------- Products ----------
export function sortProducts(list) {
  return list.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
}

let productsPromise = null;

// Visible products only. Falls back to the built-in catalogue when Firebase isn't set up.
export function loadProducts() {
  if (!productsPromise) {
    productsPromise = (async () => {
      if (!db) return SEED_PRODUCTS;
      const snap = await getDocs(collection(db, 'products'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => p.visible !== false);
      return sortProducts(list);
    })();
  }
  return productsPromise;
}

// ---------- Cart (kept in this browser only) ----------
const CART_KEY = 'dsCart';
const cartListeners = new Set();

export function getCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((l) => l && l.id && l.qty > 0) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  cartListeners.forEach((fn) => fn(cart));
}

export function onCartChange(fn) {
  cartListeners.add(fn);
}

export function addToCart(productId, qty = 1) {
  const cart = getCart();
  const line = cart.find((l) => l.id === productId);
  if (line) line.qty = Math.min(line.qty + qty, 20);
  else cart.push({ id: productId, qty });
  saveCart(cart);
}

export function setCartQty(productId, qty) {
  const cart = getCart()
    .map((l) => (l.id === productId ? { ...l, qty: Math.min(qty, 20) } : l))
    .filter((l) => l.qty > 0);
  saveCart(cart);
}

export function clearCart() {
  saveCart([]);
}

export function cartCount() {
  return getCart().reduce((n, l) => n + l.qty, 0);
}

// Joins cart lines with current product data; drops anything no longer for sale.
export function cartLines(products) {
  const byId = new Map(products.map((p) => [p.id, p]));
  return getCart()
    .map((l) => ({ product: byId.get(l.id), qty: l.qty }))
    .filter((l) => l.product && hasPrice(l.product));
}

// ---------- Orders ----------
export async function placeOrder({ customerName, phone, address, city, notes, paymentMethod, lines }) {
  const items = lines.map(({ product, qty }) => ({
    productId: product.id,
    name: product.name,
    price: product.price,
    qty,
  }));
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const ref = await addDoc(collection(db, 'orders'), {
    customerName, phone, address, city, notes, paymentMethod,
    items, total,
    status: 'pending',
    paid: false,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, total, items };
}

// ---------- Reviews ----------
// A review can only be written once the owner has marked an order containing
// that product as delivered — that's when a purchases/{hash_productId} record appears.
export async function checkReviewEligibility(phone, productId) {
  const key = purchaseKey(await phoneHash(phone), productId);
  const [purchase, existing] = await Promise.all([
    getDoc(doc(db, 'purchases', key)),
    getDoc(doc(db, 'reviews', key)),
  ]);
  return { key, purchased: purchase.exists(), alreadyReviewed: existing.exists() };
}

export async function submitReview(key, { productId, productName, name, rating, text }) {
  await setDoc(doc(db, 'reviews', key), {
    productId, productName, name, rating, text,
    createdAt: serverTimestamp(),
  });
}

export async function loadAllReviews() {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'reviews'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function loadLatestReviews(count) {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(count)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function reviewStats(reviews) {
  const byProduct = new Map();
  for (const r of reviews) {
    const s = byProduct.get(r.productId) || { count: 0, sum: 0, list: [] };
    s.count += 1;
    s.sum += r.rating;
    s.list.push(r);
    byProduct.set(r.productId, s);
  }
  return byProduct;
}

export function formatDate(ts) {
  const d = ts && typeof ts.toDate === 'function' ? ts.toDate() : null;
  return d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}
