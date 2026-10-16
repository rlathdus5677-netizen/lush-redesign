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

for (const link of document.querySelectorAll('[data-category]')) {
  link.addEventListener('click', () => {
    document.querySelectorAll('.category-card').forEach(card => card.classList.remove('is-highlighted'));
    const card = document.querySelector(`#category-${link.dataset.category}`);
    card.classList.add('is-highlighted');
    // Move keyboard focus without replacing the page's anchor navigation.
    card.focus({ preventScroll: true });
  });
}

const searchDialog = document.querySelector('#search-dialog');
const cartDialog = document.querySelector('#cart-dialog');
let dialogTrigger;
function openDialog(dialog, trigger) {
  dialogTrigger = trigger;
  dialog.showModal();
  if (dialog === searchDialog) document.querySelector('#search-input').focus();
}
document.querySelector('#search-open').addEventListener('click', event => openDialog(searchDialog, event.currentTarget));
document.querySelector('#cart-open').addEventListener('click', event => openDialog(cartDialog, event.currentTarget));
for (const dialog of [searchDialog, cartDialog]) {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
  }, true);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => dialogTrigger?.focus());
}
document.querySelector('#cart-shop').addEventListener('click', () => cartDialog.close());

const products = [...document.querySelectorAll('.product-card, .new-card')].map(card => ({
  name: card.querySelector('h3').textContent,
  description: card.querySelector('.product-info > p, div > p').textContent,
  image: card.querySelector('img').getAttribute('src'),
  alt: card.querySelector('img').alt,
  href: card.href,
}));
const searchInput = document.querySelector('#search-input');
const searchResults = document.querySelector('#search-results');
const searchStatus = document.querySelector('#search-status');
function searchProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase().replace(/\s+/g, '');
  searchResults.replaceChildren();
  if (!query) { searchStatus.textContent = '상품명이나 종류를 입력해주세요.'; return; }
  const matches = products.filter(product => `${product.name}${product.description}${product.href}`.toLocaleLowerCase().replace(/\s+/g, '').includes(query));
  searchStatus.textContent = matches.length ? `${matches.length}개의 상품을 찾았습니다.` : '검색 결과가 없습니다. 다른 검색어를 입력해주세요.';
  for (const product of matches) {
    const link = document.createElement('a');
    link.className = 'search-result';
    link.href = product.href;
    link.target = '_blank';
    link.rel = 'noopener';
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
