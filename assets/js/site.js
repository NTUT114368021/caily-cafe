const CART_KEY = "caily-cart-v2";
const LEGACY_CART_KEY = "caily-cart";
const ORDER_SEQ_KEY = "caily-order-seq";
let products = window.CAILY_PRODUCTS || [];

const categoryNames = {
  limited: "限時蛋糕",
  birthday: "生日蛋糕",
  tarts: "6吋塔",
  rolls: "長條捲",
  desserts: "蛋糕甜點"
};

const formatPrice = (price) => `NT$${Number(price || 0).toLocaleString("zh-TW")}`;
const safeText = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#039;"
}[char]));

const parseCsv = (csvText) => {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      field += "\"";
      index += 1;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
};

const truthy = (value) => ["true", "yes", "y", "1", "是"].includes(String(value || "").trim().toLowerCase());

const normalizeProducts = (rows) => {
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.trim());

  return rows.slice(1).map((row) => {
    const record = Object.fromEntries(headers.map((header, index) => [header, (row[index] || "").trim()]));
    return {
      id: record.id,
      category: record.category,
      featured: truthy(record.featured),
      name: record.name,
      description: record.description,
      detail: record.detail || record.description,
      specs: (record.specs || "").split(/[\n;；]/).map((item) => item.trim()).filter(Boolean),
      price: Number(record.price || 0),
      label: record.label || categoryNames[record.category] || "甜點",
      image: record.image,
      visible: record.visible === "" ? true : truthy(record.visible)
    };
  }).filter((product) => (
    product.visible &&
    product.id &&
    product.category &&
    product.name &&
    product.image
  ));
};

const loadProductsFromSheet = async () => {
  const csvUrl = window.CAILY_CONFIG?.productsCsvUrl?.trim();
  if (!csvUrl) return;

  try {
    const response = await fetch(`${csvUrl}${csvUrl.includes("?") ? "&" : "?"}cache=${Date.now()}`, {
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Google Sheet responded ${response.status}`);
    const csvText = await response.text();
    const sheetProducts = normalizeProducts(parseCsv(csvText));
    if (sheetProducts.length) {
      products = sheetProducts;
      window.CAILY_PRODUCTS = sheetProducts;
    }
  } catch (error) {
    console.warn("Google Sheet products could not be loaded. Using fallback data.", error);
  }
};

const makeCartKey = (item) => [
  item.productId,
  item.size,
  item.flavor,
  item.plaque,
  item.candles ? "candles" : "no-candles",
  item.note
].join("|");

const getCart = () => {
  const stored = localStorage.getItem(CART_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  const legacy = JSON.parse(localStorage.getItem(LEGACY_CART_KEY) || "{}");
  const migrated = Object.entries(legacy).map(([productId, quantity]) => {
    const product = products.find((item) => item.id === productId);
    const item = {
      key: "",
      productId,
      size: "6吋",
      flavor: product?.name || "原味",
      quantity: Number(quantity || 1),
      plaque: "",
      candles: false,
      note: ""
    };
    item.key = makeCartKey(item);
    return item;
  });
  if (migrated.length) saveCart(migrated);
  return migrated;
};

const saveCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));
const clearCart = () => {
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(LEGACY_CART_KEY);
};
const cartCount = () => getCart().reduce((total, item) => total + Number(item.quantity || 0), 0);

const updateCartCount = () => {
  document.querySelectorAll("[data-cart-count]").forEach((item) => {
    item.textContent = cartCount();
  });
};

const getCartLines = () => getCart()
  .map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) }))
  .filter((item) => item.product);

const cartTotal = (lines = getCartLines()) => lines.reduce((sum, item) => (
  sum + Number(item.product.price || 0) * Number(item.quantity || 0)
), 0);

const addConfiguredItem = (item) => {
  const cart = getCart();
  const key = makeCartKey(item);
  const existing = cart.find((cartItem) => cartItem.key === key);

  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push({ ...item, key });
  }

  saveCart(cart);
  renderCart();
  updateCartCount();
};

const productCard = (product, mode = "standard") => {
  const cardClass = mode === "romantic" ? "romantic-product-card" : "product-card";
  const category = categoryNames[product.category] || product.label || "甜點";

  return `
    <article class="${cardClass}">
      <button class="${mode === "romantic" ? "romantic-product-link" : "product-card-link"} product-open-button" type="button" data-open-options="${safeText(product.id)}" aria-label="選擇 ${safeText(product.name)}">
        <img src="${safeText(product.image)}" alt="${safeText(product.name)}">
      </button>
      <div class="${mode === "romantic" ? "romantic-product-body" : "product-card-content"}">
        <span class="romantic-product-category">${safeText(category)}</span>
        <h3><button class="product-title-button" type="button" data-open-options="${safeText(product.id)}">${safeText(product.name)}</button></h3>
        <p>${safeText(product.description)}</p>
        <div class="product-meta">
          <strong>${formatPrice(product.price)}</strong>
          <span>${safeText(product.label || category)}</span>
        </div>
        <button class="add-cart dessert-button" type="button" data-open-options="${safeText(product.id)}">加入購物車</button>
      </div>
    </article>
  `;
};

const renderProducts = () => {
  const limitedHost = document.querySelector("[data-limited-products]");
  if (limitedHost) {
    const limitedProducts = products.filter((product) => product.featured).slice(0, 6);
    limitedHost.innerHTML = limitedProducts.map((product) => productCard(product, "romantic")).join("");
  }

  document.querySelectorAll("[data-category-products]").forEach((host) => {
    const category = host.dataset.categoryProducts;
    const categoryProducts = products.filter((product) => product.category === category);
    host.innerHTML = categoryProducts.length
      ? categoryProducts.map((product) => productCard(product, "romantic")).join("")
      : `<div class="empty-cart"><h2>商品準備中</h2><p>店長可以到後台新增這個分類的商品。</p></div>`;
  });

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
  dots.innerHTML = slides.map((_, index) => `<button type="button" aria-label="切換到第 ${index + 1} 張照片"></button>`).join("");
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
  if (!product) return;

  document.title = `${product.name}｜凱莉日嚐`;
  host.innerHTML = `
    <div class="product-detail-media">
      <img src="${safeText(product.image)}" alt="${safeText(product.name)}">
    </div>
    <div class="product-detail-info">
      <p class="eyebrow">${safeText(product.label)}</p>
      <h1>${safeText(product.name)}</h1>
      <p class="detail-price">${formatPrice(product.price)}</p>
      <p class="detail-description">${safeText(product.detail)}</p>
      <div class="detail-actions">
        <button class="button no-margin" type="button" data-open-options="${safeText(product.id)}">加入購物車</button>
        <a class="button light no-margin" href="cart.html">查看購物車</a>
      </div>
      <section class="detail-panel">
        <h2>商品規格</h2>
        <ul>${(product.specs || []).map((spec) => `<li>${safeText(spec)}</li>`).join("")}</ul>
      </section>
      <section class="detail-panel">
        <h2>訂購提醒</h2>
        <p>蛋糕皆為新鮮製作，建議提前預訂。客製文字、蠟燭與特殊需求請在加入購物車時填寫。</p>
      </section>
    </div>
  `;
};

const renderCart = () => {
  const cartHosts = document.querySelectorAll("[data-cart-items]");
  if (!cartHosts.length) return;

  const lines = getCartLines();
  const total = cartTotal(lines);

  cartHosts.forEach((cartHost) => {
    if (!lines.length) {
      cartHost.innerHTML = `
        <div class="empty-cart">
          <h2>購物車目前是空的</h2>
          <p>先到限時蛋糕挑選喜歡的甜點，再回來確認訂單。</p>
        </div>
      `;
      return;
    }

    cartHost.innerHTML = lines.map((item) => {
      const subtotal = Number(item.product.price || 0) * Number(item.quantity || 0);
      return `
        <article class="cart-item">
          <img src="${safeText(item.product.image)}" alt="${safeText(item.product.name)}">
          <div class="cart-item-main">
            <h3>${safeText(item.product.name)}</h3>
            <p>${safeText(item.size)} / ${safeText(item.flavor)} / ${item.candles ? "需要蠟燭" : "不需要蠟燭"}</p>
            ${item.plaque ? `<p>生日牌：${safeText(item.plaque)}</p>` : ""}
            ${item.note ? `<p>備註：${safeText(item.note)}</p>` : ""}
          </div>
          <div class="cart-price">
            <span>單價 ${formatPrice(item.product.price)}</span>
            <strong>小計 ${formatPrice(subtotal)}</strong>
          </div>
          <div class="qty-controls">
            <button type="button" data-cart-minus="${safeText(item.key)}">-</button>
            <strong>${item.quantity}</strong>
            <button type="button" data-cart-plus="${safeText(item.key)}">+</button>
            <button class="remove-item" type="button" data-cart-remove="${safeText(item.key)}">刪除</button>
          </div>
        </article>
      `;
    }).join("");
  });

  document.querySelectorAll("[data-cart-total]").forEach((node) => {
    node.textContent = formatPrice(total);
  });
};

const ensureProductModal = () => {
  let modal = document.querySelector("[data-product-modal]");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "option-modal";
  modal.dataset.productModal = "";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="option-modal-backdrop" data-close-modal></div>
    <form class="option-dialog" data-option-form>
      <button class="modal-close" type="button" data-close-modal aria-label="關閉">×</button>
      <img data-modal-image alt="">
      <div>
        <p class="romantic-kicker" data-modal-category></p>
        <h2 data-modal-name></h2>
        <p data-modal-description></p>
      </div>
      <input name="productId" type="hidden">
      <label>尺寸
        <select name="size" required>
          <option value="4吋">4吋</option>
          <option value="6吋" selected>6吋</option>
          <option value="8吋">8吋</option>
          <option value="長條">長條</option>
        </select>
      </label>
      <label>口味
        <select name="flavor" required>
          <option value="原味鮮奶油">原味鮮奶油</option>
          <option value="草莓">草莓</option>
          <option value="巧克力">巧克力</option>
          <option value="芋泥">芋泥</option>
          <option value="檸檬">檸檬</option>
        </select>
      </label>
      <label>數量<input name="quantity" type="number" min="1" value="1" required></label>
      <label>生日牌文字<input name="plaque" placeholder="例如：生日快樂 Lily"></label>
      <label class="checkbox-line"><input name="candles" type="checkbox"> 需要蠟燭</label>
      <label class="full">備註<textarea name="note" rows="3" placeholder="其他希望店家知道的需求"></textarea></label>
      <button class="romantic-button primary full" type="submit">確認加入購物車</button>
    </form>
  `;
  document.body.appendChild(modal);
  bindOptionForm();
  return modal;
};

const openProductOptions = (productId) => {
  const product = products.find((item) => item.id === productId);
  const modal = ensureProductModal();
  const form = modal.querySelector("[data-option-form]");
  if (!product || !modal || !form) return;

  form.reset();
  form.elements.productId.value = product.id;
  modal.querySelector("[data-modal-image]").src = product.image;
  modal.querySelector("[data-modal-image]").alt = product.name;
  modal.querySelector("[data-modal-category]").textContent = categoryNames[product.category] || product.label || "甜點";
  modal.querySelector("[data-modal-name]").textContent = product.name;
  modal.querySelector("[data-modal-description]").textContent = product.description;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  form.elements.size.focus();
};

const closeProductOptions = () => {
  const modal = document.querySelector("[data-product-modal]");
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
};

const bindOptionForm = () => {
  document.querySelectorAll("[data-option-form]").forEach((form) => {
    if (form.dataset.bound === "true") return;
    form.dataset.bound = "true";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      addConfiguredItem({
        productId: data.get("productId"),
        size: data.get("size"),
        flavor: data.get("flavor"),
        quantity: Number(data.get("quantity") || 1),
        plaque: String(data.get("plaque") || "").trim(),
        candles: Boolean(data.get("candles")),
        note: String(data.get("note") || "").trim()
      });
      closeProductOptions();
      document.getElementById("cart")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
};


const generateOrderNumber = () => {
  const date = new Date();
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("");
  const seqRecord = JSON.parse(localStorage.getItem(ORDER_SEQ_KEY) || "{}");
  const nextSeq = seqRecord.date === datePart ? Number(seqRecord.seq || 0) + 1 : 1;
  localStorage.setItem(ORDER_SEQ_KEY, JSON.stringify({ date: datePart, seq: nextSeq }));
  return `CAKE${datePart}${String(nextSeq).padStart(3, "0")}`;
};

const handleCheckout = (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const errorNode = document.querySelector("[data-checkout-error]");
  const successNode = document.querySelector("[data-order-success]");
  const data = new FormData(form);
  const lines = getCartLines();

  const fail = (message) => {
    if (errorNode) errorNode.textContent = message;
    successNode.hidden = true;
  };

  if (!lines.length) {
    fail("購物車是空的，請先加入商品後再送出訂單。");
    return;
  }

  const requiredFields = [
    ["customerName", "姓名必填"],
    ["phone", "電話必填"],
    ["pickupDate", "取貨日期必填"],
    ["pickupTime", "取貨時間必填"]
  ];
  const missing = requiredFields.find(([field]) => !String(data.get(field) || "").trim());
  if (missing) {
    fail(missing[1]);
    return;
  }

  if (data.get("pickupMethod") === "外送" && !String(data.get("address") || "").trim()) {
    fail("選擇外送時，外送地址必填。");
    return;
  }

  const orderNumber = generateOrderNumber();
  const total = cartTotal(lines);
  const detailRows = lines.map((item) => `
    <li>
      <strong>${safeText(item.product.name)}</strong>
      <span>${safeText(item.size)} / ${safeText(item.flavor)} / ${item.quantity} 份 / 小計 ${formatPrice(item.product.price * item.quantity)}</span>
    </li>
  `).join("");

  successNode.hidden = false;
  successNode.innerHTML = `
    <h3>訂單送出成功！</h3>
    <p>訂單編號：<strong>${orderNumber}</strong></p>
    <p>取貨方式：${safeText(data.get("pickupMethod"))}，取貨時間：${safeText(data.get("pickupDate"))} ${safeText(data.get("pickupTime"))}</p>
    <ul>${detailRows}</ul>
    <p class="order-total">總金額：${formatPrice(total)}</p>
    <a class="romantic-button line" href="https://line.me/R/ti/p/@042msbid" target="_blank" rel="noreferrer">前往官方 LINE 確認</a>
  `;
  if (errorNode) errorNode.textContent = "";
  form.reset();
  clearCart();
  renderCart();
  updateCartCount();
};

const addCornerCat = () => {
  if (document.querySelector(".walking-cat")) return;
  const cat = document.createElement("a");
  cat.className = "walking-cat";
  cat.href = "about.html";
  cat.setAttribute("aria-label", "查看凱莉日嚐關於我們");
  cat.innerHTML = `
    <span class="cat-art"><img src="assets/images/ragdoll-cat-corner.svg" alt="布偶貓"></span>
    <span class="cat-label">店貓散步中</span>
  `;
  document.body.appendChild(cat);
};

document.querySelector(".menu-toggle")?.addEventListener("click", (event) => {
  const nav = document.querySelector(".site-nav");
  const isOpen = nav.classList.toggle("is-open");
  event.currentTarget.setAttribute("aria-expanded", String(isOpen));
});

document.querySelector(".romantic-menu-toggle")?.addEventListener("click", (event) => {
  const nav = document.querySelector(".romantic-nav");
  const isOpen = nav.classList.toggle("is-open");
  event.currentTarget.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".romantic-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    const nav = document.querySelector(".romantic-nav");
    const toggle = document.querySelector(".romantic-menu-toggle");
    nav?.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
  });
});

document.querySelector("[data-reservation-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const messageNode = document.querySelector("[data-reservation-message]");
  messageNode.innerHTML = `
    感謝您的預訂，我們會盡快與您聯絡！
    <a href="https://line.me/R/ti/p/@042msbid" target="_blank" rel="noreferrer">前往官方 LINE</a>
  `;
  event.currentTarget.reset();
});

bindOptionForm();

document.querySelector("[data-checkout-form]")?.addEventListener("submit", handleCheckout);

document.addEventListener("click", (event) => {
  const optionButton = event.target.closest("[data-open-options]");
  if (optionButton) {
    event.preventDefault();
    openProductOptions(optionButton.dataset.openOptions);
    return;
  }

  if (event.target.closest("[data-close-modal]")) {
    closeProductOptions();
    return;
  }

  const cart = getCart();
  const minus = event.target.closest("[data-cart-minus]");
  const plus = event.target.closest("[data-cart-plus]");
  const remove = event.target.closest("[data-cart-remove]");

  if (minus) {
    const item = cart.find((cartItem) => cartItem.key === minus.dataset.cartMinus);
    if (item) item.quantity = Math.max(Number(item.quantity || 1) - 1, 0);
    saveCart(cart.filter((cartItem) => Number(cartItem.quantity || 0) > 0));
    renderCart();
    updateCartCount();
  }

  if (plus) {
    const item = cart.find((cartItem) => cartItem.key === plus.dataset.cartPlus);
    if (item) item.quantity = Number(item.quantity || 0) + 1;
    saveCart(cart);
    renderCart();
    updateCartCount();
  }

  if (remove) {
    saveCart(cart.filter((cartItem) => cartItem.key !== remove.dataset.cartRemove));
    renderCart();
    updateCartCount();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeProductOptions();
});

document.querySelector("[data-clear-cart]")?.addEventListener("click", () => {
  clearCart();
  renderCart();
  updateCartCount();
});

const initSite = async () => {
  await loadProductsFromSheet();
  renderProducts();
  setupCarousel();
  renderProductDetail();
  renderCart();
  updateCartCount();
  addCornerCat();
};

initSite();
