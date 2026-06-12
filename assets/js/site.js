const CART_KEY = "caily-cart";
const products = window.CAILY_PRODUCTS || [];

const formatPrice = (price) => `NT$${price.toLocaleString("zh-TW")}`;
const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || "{}");
const saveCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));
const cartCount = () => Object.values(getCart()).reduce((total, qty) => total + qty, 0);

const updateCartCount = () => {
  document.querySelectorAll("[data-cart-count]").forEach((item) => {
    item.textContent = cartCount();
  });
};

const addToCart = (id) => {
  const cart = getCart();
  cart[id] = (cart[id] || 0) + 1;
  saveCart(cart);
  updateCartCount();
};

const addCornerCat = () => {
  if (document.querySelector(".walking-cat")) return;
  const cat = document.createElement("a");
  cat.className = "walking-cat";
  cat.href = "about.html";
  cat.setAttribute("aria-label", "認識凱莉日嚐的布偶貓主題");
  cat.innerHTML = `
    <span class="cat-art"><img src="assets/images/ragdoll-cat-corner.svg" alt="布偶貓裝飾"></span>
    <span class="cat-label">喵喵巡店中</span>
  `;
  document.body.appendChild(cat);
};

const productCard = (product) => `
  <article class="product-card">
    <a class="product-card-link" href="product.html?id=${product.id}" aria-label="查看 ${product.name} 詳細介紹">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-card-content">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-meta">
          <span>${formatPrice(product.price)}</span>
          <span>${product.label}</span>
        </div>
      </div>
    </a>
    <div class="product-card-actions">
      <button class="add-cart" type="button" data-add-cart="${product.id}">加入購物車</button>
    </div>
  </article>
`;

const renderProducts = () => {
  const featured = document.querySelector("[data-featured-products]");
  if (featured) {
    featured.innerHTML = products.filter((product) => product.featured).slice(0, 4).map(productCard).join("");
  }

  const list = document.querySelector("[data-product-list]");
  if (list) {
    const category = document.body.dataset.category;
    list.innerHTML = products.filter((product) => product.category === category).map(productCard).join("");
  }
};

const setupCarousel = () => {
  const slides = [...document.querySelectorAll(".slide")];
  const dots = document.querySelector("[data-carousel-dots]");
  if (!slides.length || !dots) return;

  let activeIndex = 0;
  dots.innerHTML = slides.map((_, index) => `<button type="button" aria-label="切換到第 ${index + 1} 張"></button>`).join("");
  const dotButtons = [...dots.querySelectorAll("button")];

  const activate = (index) => {
    activeIndex = index;
    slides.forEach((slide, slideIndex) => slide.classList.toggle("is-active", slideIndex === activeIndex));
    dotButtons.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === activeIndex));
  };

  dotButtons.forEach((dot, index) => dot.addEventListener("click", () => activate(index)));
  activate(0);
  setInterval(() => activate((activeIndex + 1) % slides.length), 4200);
};

const renderProductDetail = () => {
  const host = document.querySelector("[data-product-detail]");
  if (!host) return;

  const params = new URLSearchParams(window.location.search);
  const product = products.find((item) => item.id === params.get("id")) || products[0];

  document.title = `${product.name}｜凱莉日嚐`;
  host.innerHTML = `
    <div class="product-detail-media">
      <img src="${product.image}" alt="${product.name}">
    </div>
    <div class="product-detail-info">
      <p class="eyebrow">${product.label}</p>
      <h1>${product.name}</h1>
      <p class="detail-price">${formatPrice(product.price)}</p>
      <p class="detail-description">${product.detail}</p>
      <div class="detail-actions">
        <button class="button no-margin" type="button" data-add-cart="${product.id}">加入購物車</button>
        <a class="button light no-margin" href="cart.html">查看購物車</a>
      </div>
      <section class="detail-panel">
        <h2>商品規格</h2>
        <ul>${product.specs.map((spec) => `<li>${spec}</li>`).join("")}</ul>
      </section>
      <section class="detail-panel">
        <h2>訂購提醒</h2>
        <p>蛋糕皆為新鮮製作，建議提前私訊確認取貨日期、口味與客製需求。實際裝飾會依當季水果與現場材料微調。</p>
      </section>
    </div>
  `;
};

const renderCart = () => {
  const cartHost = document.querySelector("[data-cart-items]");
  if (!cartHost) return;

  const cart = getCart();
  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find((item) => item.id === id), qty }))
    .filter((line) => line.product);

  if (!lines.length) {
    cartHost.innerHTML = `<div class="empty-cart"><h2>購物車目前是空的</h2><p>先到商品頁把想詢問的蛋糕加入購物車。</p></div>`;
  } else {
    cartHost.innerHTML = lines.map(({ product, qty }) => `
      <article class="cart-item">
        <a href="product.html?id=${product.id}"><img src="${product.image}" alt="${product.name}"></a>
        <div>
          <h3><a href="product.html?id=${product.id}">${product.name}</a></h3>
          <p>${formatPrice(product.price)} / ${product.label}</p>
        </div>
        <div class="qty-controls">
          <button type="button" data-cart-minus="${product.id}">-</button>
          <strong>${qty}</strong>
          <button type="button" data-cart-plus="${product.id}">+</button>
          <button class="remove-item" type="button" data-cart-remove="${product.id}">移除</button>
        </div>
      </article>
    `).join("");
  }

  const total = lines.reduce((sum, { product, qty }) => sum + product.price * qty, 0);
  const totalNode = document.querySelector("[data-cart-total]");
  if (totalNode) totalNode.textContent = formatPrice(total);
};

document.querySelector(".menu-toggle")?.addEventListener("click", (event) => {
  const nav = document.querySelector(".site-nav");
  const isOpen = nav.classList.toggle("is-open");
  event.currentTarget.setAttribute("aria-expanded", String(isOpen));
});

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-cart]");
  if (addButton) addToCart(addButton.dataset.addCart);

  const cart = getCart();
  const minus = event.target.closest("[data-cart-minus]");
  const plus = event.target.closest("[data-cart-plus]");
  const remove = event.target.closest("[data-cart-remove]");

  if (minus) {
    const id = minus.dataset.cartMinus;
    cart[id] = Math.max((cart[id] || 1) - 1, 0);
    if (cart[id] === 0) delete cart[id];
    saveCart(cart);
    renderCart();
    updateCartCount();
  }

  if (plus) {
    const id = plus.dataset.cartPlus;
    cart[id] = (cart[id] || 0) + 1;
    saveCart(cart);
    renderCart();
    updateCartCount();
  }

  if (remove) {
    delete cart[remove.dataset.cartRemove];
    saveCart(cart);
    renderCart();
    updateCartCount();
  }
});

document.querySelector("[data-clear-cart]")?.addEventListener("click", () => {
  saveCart({});
  renderCart();
  updateCartCount();
});

renderProducts();
setupCarousel();
renderProductDetail();
renderCart();
updateCartCount();
addCornerCat();
