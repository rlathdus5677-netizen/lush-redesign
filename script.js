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


// All navigation stays in this prototype; product data comes from the visible cards.
const productCards = [...document.querySelectorAll('.product-card, .new-card')];
const products = productCards.map((card, index) => ({
  id: index,
  name: card.querySelector('h3').textContent,
  description: card.querySelector('.product-info > p, div > p').textContent,
  image: card.querySelector('img').getAttribute('src'),
  alt: card.querySelector('img').alt,
  price: card.querySelector('strong').textContent,
  keywords: card.querySelector('img').getAttribute('src').replace(/[-/]/g, ' '),
}));

function selectCategory(category) {
  for (const card of document.querySelectorAll('.category-card')) {
    const selected = card.id === `category-${category}`;
    card.classList.toggle('is-highlighted', selected);
    if (selected) card.setAttribute('aria-current', 'true');
    else card.removeAttribute('aria-current');
  }
  const selected = document.querySelector(`#category-${category}`);
  selected.focus({ preventScroll: true });
  document.querySelector('#category-status').textContent = `${selected.querySelector('h3').textContent} 카테고리를 선택했습니다.`;
}
for (const link of document.querySelectorAll('[data-category]')) {
  link.addEventListener('click', () => selectCategory(link.dataset.category));
}
document.querySelector('#categories-view-all').addEventListener('click', () => {
  document.querySelectorAll('.category-card').forEach(card => {
    card.classList.remove('is-highlighted');
    card.removeAttribute('aria-current');
  });
  document.querySelector('#category-status').textContent = '전체 카테고리를 표시합니다.';
});
document.querySelector('#best-view-all').addEventListener('click', () => {
  track.scrollTo({ left: 0, behavior: scrollBehavior() });
  track.focus({ preventScroll: true });
});

const searchDialog = document.querySelector('#search-dialog');
const cartDialog = document.querySelector('#cart-dialog');
const productDialog = document.querySelector('#product-dialog');
const accountDialog = document.querySelector('#account-dialog');
const brandDialog = document.querySelector('#brand-dialog');
const dialogTriggers = new WeakMap();
function openDialog(dialog, trigger) {
  for (const current of document.querySelectorAll('dialog[open]')) current.close();
  dialogTriggers.set(dialog, trigger);
  dialog.showModal();
  if (dialog === searchDialog) document.querySelector('#search-input').focus();
}
for (const [selector, dialog] of [['#search-open', searchDialog], ['#cart-open', cartDialog], ['#account-open', accountDialog], ['#brand-open', brandDialog]]) {
  document.querySelector(selector).addEventListener('click', event => {
    event.preventDefault();
    openDialog(dialog, event.currentTarget);
  });
}
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
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
document.querySelector('#cart-shop').addEventListener('click', () => cartDialog.close());

function showProduct(product, trigger) {
  document.querySelector('#product-detail-title').textContent = product.name;
  const image = document.querySelector('#product-detail-image');
  image.src = product.image;
  image.alt = product.alt;
  document.querySelector('#product-detail-description').textContent = product.description;
  document.querySelector('#product-detail-price').textContent = product.price;
  openDialog(productDialog, trigger);
}
productCards.forEach((card, index) => card.addEventListener('click', event => {
  event.preventDefault();
  showProduct(products[index], card);
}));
// Anchors styled as cards retain their appearance and support button keyboard behavior.
document.addEventListener('keydown', event => {
  if (event.key === ' ' && event.target.matches('a[role="button"]')) {
    event.preventDefault();
    event.target.click();
  }
});

const searchInput = document.querySelector('#search-input');
const searchResults = document.querySelector('#search-results');
const searchStatus = document.querySelector('#search-status');
function searchProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase().replace(/\s+/g, '');
  searchResults.replaceChildren();
  if (!query) { searchStatus.textContent = '상품명이나 종류를 입력해주세요.'; return; }
  const matches = products.filter(product => `${product.name}${product.description}${product.keywords}`.toLocaleLowerCase().replace(/\s+/g, '').includes(query));
  searchStatus.textContent = matches.length ? `${matches.length}개의 상품을 찾았습니다.` : '검색 결과가 없습니다. 다른 검색어를 입력해주세요.';
  for (const product of matches) {
    const link = document.createElement('a');
    link.className = 'search-result';
    link.href = '#product-dialog';
    link.setAttribute('role', 'button');
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      event.preventDefault();
      showProduct(product, document.querySelector('#search-open'));
    });
    const image = document.createElement('img');
    image.src = product.image;
    image.alt = product.alt;
    const text = document.createElement('span');
    text.textContent = product.name;
    link.append(image, text);
    searchResults.append(link);
  }
}
searchInput.addEventListener('input', searchProducts);
document.querySelector('#search-form').addEventListener('submit', event => { event.preventDefault(); searchProducts(); });
searchProducts();

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
