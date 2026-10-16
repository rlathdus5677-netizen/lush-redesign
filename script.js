'use strict';

const track = document.querySelector('#best-track');
const progress = document.querySelector('#best-progress');
const previous = document.querySelector('#best-prev');
const next = document.querySelector('#best-next');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollBehavior = () => reducedMotion.matches ? 'instant' : 'smooth';

function updateCarousel() {
  const maximum = track.scrollWidth - track.clientWidth;
  const percentage = maximum > 0 ? Math.min(100, Math.max(0, track.scrollLeft / maximum * 100)) : 0;
  progress.value = percentage;
  progress.style.setProperty('--progress', `${percentage}%`);
  progress.setAttribute('aria-valuetext', `${Math.round(percentage)}%`);
  progress.disabled = maximum <= 1;
  previous.disabled = track.scrollLeft <= 1;
  next.disabled = maximum <= 1 || track.scrollLeft >= maximum - 2;
}
function moveCarousel(direction) {
  const card = track.querySelector('.product-card');
  const step = card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
  track.scrollBy({ left: direction * step, behavior: scrollBehavior() });
}
previous.addEventListener('click', () => moveCarousel(-1));
next.addEventListener('click', () => moveCarousel(1));
track.addEventListener('scroll', updateCarousel, { passive: true });
track.addEventListener('keydown', event => {
  if (event.target !== track) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    moveCarousel(event.key === 'ArrowRight' ? 1 : -1);
  }
});
progress.addEventListener('input', () => {
  // Avoid scroll snapping overriding a precise position chosen on the progress bar.
  track.style.scrollSnapType = 'none';
  track.scrollLeft = (track.scrollWidth - track.clientWidth) * Number(progress.value) / 100;
  updateCarousel();
});
progress.addEventListener('change', () => { track.style.scrollSnapType = ''; });
new ResizeObserver(updateCarousel).observe(track);
updateCarousel();


// Product details and collections are assembled from the cards already shown on the page.
const productCards = [...document.querySelectorAll('.product-card, .new-card')];
const productCategories = ['hair', 'hair', 'body', 'body', 'body', 'body', 'body', 'fragrance'];
const products = productCards.map((card, index) => ({
  id: String(index),
  name: card.querySelector('h3').textContent,
  description: card.querySelector('.product-info > p, div > p').textContent,
  image: card.querySelector('img').getAttribute('src'),
  alt: card.querySelector('img').alt,
  price: card.querySelector('strong').textContent,
  category: productCategories[index],
  isNew: index >= 4,
  isBest: index < 4,
}));
const productById = new Map(products.map(product => [product.id, product]));

const searchDialog = document.querySelector('#search-dialog');
const cartDialog = document.querySelector('#cart-dialog');
const productDialog = document.querySelector('#product-dialog');
const accountDialog = document.querySelector('#account-dialog');
const brandDialog = document.querySelector('#brand-dialog');
const catalogDialog = document.querySelector('#catalog-dialog');
const disclaimerDialog = document.querySelector('#disclaimer-dialog');
const dialogTriggers = new WeakMap();
function openDialog(dialog, trigger) {
  for (const current of document.querySelectorAll('dialog[open]')) current.close();
  dialogTriggers.set(dialog, trigger);
  dialog.showModal();
}
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); if (dialog !== disclaimerDialog) dialog.close(); }
  }, true);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (!document.querySelector('dialog[open]')) {
      const trigger = dialogTriggers.get(dialog);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    }
  });
}
const disclaimerStorageKey = 'lush-redesign-disclaimer-accepted';
let disclaimerAccepted = false;
try { disclaimerAccepted = localStorage.getItem(disclaimerStorageKey) === 'true'; } catch { /* Keep this visit usable when browser storage is unavailable. */ }
if (!disclaimerAccepted) disclaimerDialog.showModal();
disclaimerDialog.addEventListener('cancel', event => event.preventDefault());
document.querySelector('#disclaimer-continue').addEventListener('click', () => {
  try { localStorage.setItem(disclaimerStorageKey, 'true'); } catch { /* The current visit can still proceed. */ }
  disclaimerDialog.close();
});

// Hero arrows reuse the page's real campaign imagery and existing editorial copy.
const heroSlides = [
  { image: 'assets/images/hero-shampoo-bar-model.jpg', alt: '초록 식물 사이에서 빨간 러쉬 샴푸 바를 든 모델', title: '작아서, 어디든 함께', description: '55g으로 시작하는 가벼운 샴푸 루틴' },
  { image: 'assets/images/brand-orange-products-orchard.jpg', alt: '오렌지 과수원과 바다를 배경으로 한 신선한 오렌지 보디 케어', title: '자연에서 시작되는 생생한 에너지', description: '오렌지의 상큼함을 담은 러쉬의 바디 케어' },
  { image: 'assets/images/brand-natural-products-coast.jpg', alt: '자연의 원료와 해안 풍경을 담은 러쉬 헤어 케어', title: '상쾌함을 깨우는 세 가지 원료', description: '로즈마리 · 쐐기풀 · 페퍼민트' },
];
let heroIndex = 0;
function showHeroSlide(index) {
  heroIndex = (index + heroSlides.length) % heroSlides.length;
  const slide = heroSlides[heroIndex];
  const image = document.querySelector('.hero-image');
  image.src = slide.image;
  image.alt = slide.alt;
  document.querySelector('#hero-title').textContent = slide.title;
  document.querySelector('.hero-copy p').textContent = slide.description;
}
document.querySelector('#hero-prev').addEventListener('click', () => showHeroSlide(heroIndex - 1));
document.querySelector('#hero-next').addEventListener('click', () => showHeroSlide(heroIndex + 1));

const categoryNames = { all: '전체 카테고리', hair: 'HAIR', body: 'BODY', face: 'FACE', fragrance: 'FRAGRANCE' };
const collectionDetails = {
  all: ['전체 카테고리', '러쉬의 헤어, 바디, 페이스, 프래그런스 카테고리와 페이지에 소개된 상품을 살펴보세요.', products],
  best: ['BEST SELLER', '지금 가장 사랑받는 러쉬 케어를 만나보세요.', products.filter(product => product.isBest)],
  new: ['NEW & FRESH', '새롭게 만나는 러쉬의 신제품을 소개합니다.', products.filter(product => product.isNew)],
  orange: ['FRESH ORANGE', '오렌지의 상큼함과 바디 케어에서 영감을 받은 상품을 모았습니다.', products.filter(product => product.category === 'body')],
  hair: ['HAIR CARE', '두피와 머릿결을 위한 헤어 케어 상품입니다.', products.filter(product => product.category === 'hair')],
  body: ['BODY CARE', '상쾌한 바디 케어와 입욕 제품을 만나보세요.', products.filter(product => product.category === 'body')],
  face: ['FACE CARE', '페이스 카테고리입니다. 준비된 상품이 아직 없어 다른 카테고리도 둘러보세요.', []],
  fragrance: ['FRAGRANCE', '일상을 특별하게 만드는 향기와 입욕 상품입니다.', products.filter(product => product.category === 'fragrance')],
  set: ['GIFT SETS', '현재 프로토타입에 세트 상품 데이터가 없어, 선물로 고를 수 있는 인기 제품을 모았습니다.', products.slice(0, 4)],
  gift: ['GIFT IDEAS', '러쉬를 처음 만나는 분께 선물하기 좋은 인기 제품을 모았습니다.', products.slice(0, 4)],
};
const catalogFilters = [
  ['all', '전체'], ['hair', '헤어'], ['body', '바디'], ['face', '페이스'], ['fragrance', '프래그런스'],
];
let activeCollection = 'all';
function renderCatalogProducts(collection) {
  const [title, description, items] = collectionDetails[collection] || collectionDetails.all;
  activeCollection = collection;
  document.querySelector('#catalog-title').textContent = title;
  document.querySelector('#catalog-description').textContent = description;
  const grid = document.querySelector('#catalog-products');
  grid.replaceChildren();
  document.querySelector('#catalog-empty').hidden = items.length > 0;
  for (const product of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'catalog-product';
    button.setAttribute('aria-label', `${product.name}, ${product.price}, 상세 보기`);
    const image = document.createElement('img');
    image.src = product.image;
    image.alt = product.alt;
    image.loading = 'lazy';
    const info = document.createElement('span');
    info.className = 'catalog-product-info';
    const name = document.createElement('strong');
    name.textContent = product.name;
    const category = document.createElement('span');
    category.textContent = `${categoryNames[product.category]} · ${product.description}`;
    const price = document.createElement('b');
    price.textContent = product.price;
    info.append(name, category, price);
    button.append(image, info);
    button.addEventListener('click', () => showProduct(product, button));
    grid.append(button);
  }
  document.querySelectorAll('.catalog-filter').forEach(filter => {
    filter.setAttribute('aria-pressed', String(filter.dataset.collection === collection));
  });
}
for (const [collection, label] of catalogFilters) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'catalog-filter';
  button.dataset.collection = collection;
  button.textContent = label;
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => renderCatalogProducts(collection));
  document.querySelector('#catalog-filters').append(button);
}
function openCatalog(collection, trigger) {
  renderCatalogProducts(collection);
  openDialog(catalogDialog, trigger);
  catalogDialog.focus({ preventScroll: true });
}
for (const link of document.querySelectorAll('[data-collection]')) {
  link.addEventListener('click', event => {
    event.preventDefault();
    openCatalog(link.dataset.collection, link);
  });
}
for (const link of document.querySelectorAll('[data-category]')) {
  link.addEventListener('click', event => {
    event.preventDefault();
    const card = document.querySelector(`#category-${link.dataset.category}`);
    document.querySelectorAll('.category-card').forEach(item => {
      item.classList.toggle('is-highlighted', item === card);
      if (item === card) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    });
    document.querySelector('#category-status').textContent = `${categoryNames[link.dataset.category]} 카테고리를 열었습니다.`;
    openCatalog(link.dataset.category, link);
  });
}
document.querySelector('#best-view-all').addEventListener('click', event => {
  event.preventDefault();
  openCatalog('best', event.currentTarget);
});

const searchInput = document.querySelector('#search-input');
const searchResults = document.querySelector('#search-results');
const searchStatus = document.querySelector('#search-status');
function searchProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase().replaceAll(' ', '');
  searchResults.replaceChildren();
  if (!query) { searchStatus.textContent = '상품명이나 종류를 입력해주세요.'; return; }
  const matches = products.filter(product => `${product.name}${product.description}${product.image}`.toLocaleLowerCase().replaceAll(' ', '').replaceAll('-', '').replaceAll('/', '').includes(query));
  searchStatus.textContent = matches.length ? `${matches.length}개의 상품을 찾았습니다.` : '검색 결과가 없습니다. 다른 검색어를 입력해주세요.';
  for (const product of matches) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-result';
    button.setAttribute('aria-label', `${product.name} 상세 보기`);
    const image = document.createElement('img');
    image.src = product.image;
    image.alt = product.alt;
    const text = document.createElement('span');
    text.textContent = `${product.name} · ${product.price}`;
    button.append(image, text);
    button.addEventListener('click', () => showProduct(product, document.querySelector('#search-open')));
    searchResults.append(button);
  }
}
searchInput.addEventListener('input', searchProducts);
document.querySelector('#search-form').addEventListener('submit', event => { event.preventDefault(); searchProducts(); });
searchProducts();

document.querySelector('#search-open').addEventListener('click', event => {
  searchProducts();
  openDialog(searchDialog, event.currentTarget);
  searchInput.focus();
});
document.querySelector('#cart-open').addEventListener('click', event => {
  renderCart();
  openDialog(cartDialog, event.currentTarget);
});
document.querySelector('#account-open').addEventListener('click', event => {
  event.preventDefault();
  openDialog(accountDialog, event.currentTarget);
});
document.querySelector('#brand-open').addEventListener('click', event => {
  event.preventDefault();
  openDialog(brandDialog, event.currentTarget);
});

function showProduct(product, trigger) {
  document.querySelector('#product-detail-title').textContent = product.name;
  const image = document.querySelector('#product-detail-image');
  image.src = product.image;
  image.alt = product.alt;
  document.querySelector('#product-detail-description').textContent = product.description;
  document.querySelector('#product-detail-price').textContent = product.price;
  document.querySelector('#product-add-status').textContent = '';
  document.querySelector('#product-add').dataset.productId = product.id;
  openDialog(productDialog, trigger);
}
productCards.forEach((card, index) => card.addEventListener('click', event => {
  event.preventDefault();
  showProduct(products[index], card);
}));
document.addEventListener('keydown', event => {
  if (event.key === ' ' && event.target.matches('a[role="button"]')) {
    event.preventDefault();
    event.target.click();
  }
});

let accountMode = 'login';
const accountForm = document.querySelector('#account-form');
for (const tab of document.querySelectorAll('[data-account-mode]')) {
  tab.addEventListener('click', () => {
    accountMode = tab.dataset.accountMode;
    document.querySelectorAll('[data-account-mode]').forEach(button => button.setAttribute('aria-pressed', String(button === tab)));
    document.querySelector('#account-title').textContent = accountMode === 'login' ? '로그인' : '회원가입';
    document.querySelector('#account-submit').textContent = accountMode === 'login' ? '로그인 체험' : '회원가입 체험';
    document.querySelector('#account-name-field').hidden = accountMode !== 'signup';
    document.querySelector('#account-name').required = accountMode === 'signup';
    accountForm.reset();
    document.querySelector('#account-status').textContent = '';
  });
}
accountForm.addEventListener('submit', event => {
  event.preventDefault();
  document.querySelector('#account-status').textContent = accountMode === 'login'
    ? '로그인 화면 체험이 완료되었습니다. 실제 계정에는 로그인되지 않습니다.'
    : '회원가입 화면 체험이 완료되었습니다. 실제 계정은 생성되지 않습니다.';
  accountForm.reset();
});
accountDialog.addEventListener('close', () => {
  accountForm.reset();
  document.querySelector('#account-status').textContent = '';
});

let cart = [];
try {
  const savedCart = JSON.parse(localStorage.getItem('lush-prototype-cart') || '[]');
  if (Array.isArray(savedCart)) cart = savedCart.filter(item => productById.has(item.id) && Number.isInteger(item.quantity) && item.quantity > 0);
} catch { cart = []; }
function saveCart() {
  localStorage.setItem('lush-prototype-cart', JSON.stringify(cart));
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const badge = document.querySelector('.cart-dot');
  badge.hidden = count === 0;
  badge.textContent = count > 9 ? '9+' : String(count);
  document.querySelector('#cart-open').setAttribute('aria-label', count ? `장바구니, ${count}개 상품` : '장바구니');
}
function renderCart() {
  const container = document.querySelector('#cart-items');
  container.replaceChildren();
  if (!cart.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-cart';
    empty.textContent = '장바구니가 비어 있습니다. 상품 상세에서 마음에 드는 제품을 담아보세요.';
    container.append(empty);
    return;
  }
  for (const item of cart) {
    const product = productById.get(item.id);
    const row = document.createElement('div');
    row.className = 'cart-item';
    const image = document.createElement('img'); image.src = product.image; image.alt = product.alt;
    const info = document.createElement('div'); info.className = 'cart-item-info';
    const name = document.createElement('strong'); name.textContent = product.name;
    const price = document.createElement('span'); price.textContent = product.price;
    const quantity = document.createElement('div'); quantity.className = 'cart-quantity'; quantity.setAttribute('aria-label', `${product.name} 수량`);
    const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `${product.name} 수량 감소`);
    const number = document.createElement('span'); number.textContent = String(item.quantity);
    const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `${product.name} 수량 증가`);
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'cart-remove'; remove.textContent = '삭제';
    minus.addEventListener('click', () => changeQuantity(item.id, -1));
    plus.addEventListener('click', () => changeQuantity(item.id, 1));
    remove.addEventListener('click', () => { cart = cart.filter(entry => entry.id !== item.id); saveCart(); renderCart(); });
    quantity.append(minus, number, plus, remove);
    info.append(name, price, quantity); row.append(image, info); container.append(row);
  }
  const total = document.createElement('p'); total.className = 'cart-total';
  total.textContent = `상품 ${cart.reduce((sum, item) => sum + item.quantity, 0)}개 · 소계 ${cart.reduce((sum, item) => sum + Number(productById.get(item.id).price.replace(/[^0-9]/g, '')) * item.quantity, 0).toLocaleString('ko-KR')}원`;
  container.append(total);
}
function changeQuantity(id, delta) {
  const item = cart.find(entry => entry.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) cart = cart.filter(entry => entry.id !== id);
  saveCart(); renderCart();
}
document.querySelector('#product-add').addEventListener('click', event => {
  const id = event.currentTarget.dataset.productId;
  const item = cart.find(entry => entry.id === id);
  if (item) item.quantity += 1;
  else cart.push({ id, quantity: 1 });
  saveCart();
  document.querySelector('#product-add-status').textContent = '장바구니에 담았습니다.';
});
saveCart();
document.querySelector('#cart-shop').addEventListener('click', event => {
  event.preventDefault();
  cartDialog.close();
  openCatalog('best', document.querySelector('#best-view-all'));
});
