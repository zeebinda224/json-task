/* ============================================================
   script.js — Product Catalogue Logic
   ============================================================

   Flow:
   1. Page loads  →  loadProducts() called
   2. fetch()     →  products.json se data aata hai
   3. render()    →  filtered + sorted list se cards bante hain
   4. User clicks filter/sort  →  render() dobara chalta hai

   ============================================================ */


/* ----------------------------------------------------------
   COLOR MAP
   Har color ka naam  →  uska actual hex code
   Yeh color swatches ke liye use hota hai chips mein
   ---------------------------------------------------------- */
const COLOR_MAP = {
  "Midnight Black": "#1a1a1a",
  "Coral Red":      "#e05a3a",
  "Tan":            "#c8a96e",
  "Dark Brown":     "#5c3a1e",
  "Black":          "#222222",
  "Matte Black":    "#2a2a2a",
  "Pearl White":    "#f0ede8",
  "Navy Blue":      "#1e3a5f",
  "Heather Grey":   "#b0aaa8",
  "Forest Green":   "#3b6b3a",
  "Camel":          "#c19a6b"
};


/* ----------------------------------------------------------
   STATE
   Yeh do variables track karte hain ke abhi kya filter
   aur sort laga hua hai
   ---------------------------------------------------------- */
let allProducts  = [];    // fetch ke baad poora data yahan aata hai
let filterState  = "all"; // "all" | "in" | "out"
let sortState    = null;  // null | "low" | "high" | "name"


/* ----------------------------------------------------------
   HELPER: format price
   1299.99 + "ZAR"  →  "R 1 299,99"  (South African style)
   ---------------------------------------------------------- */
function formatPrice(price, currency) {
  return new Intl.NumberFormat("en-ZA", {
    style:    "currency",
    currency: currency
  }).format(price);
}


/* ----------------------------------------------------------
   HELPER: unique values from an array
   ["Black","Black","Red","Red"]  →  ["Black","Red"]
   ---------------------------------------------------------- */
function unique(arr) {
  return [...new Set(arr)];
}


/* ----------------------------------------------------------
   BUILD IMAGE DOTS HTML
   Agar product ke 2 images hain tou dots banao
   jo click pe image switch karein
   ---------------------------------------------------------- */
function buildImageDots(images, productId) {
  // sirf 1 image hai tou dots ki zaroorat nahi
  if (images.length <= 1) return "";

  const dots = images.map((_, index) => {
    const activeClass = index === 0 ? "active" : "";
    return `<button
      class="img-dot ${activeClass}"
      onclick="switchImage('${productId}', ${index})"
    ></button>`;
  }).join("");

  return `<div class="img-dots">${dots}</div>`;
}


/* ----------------------------------------------------------
   BUILD COLOR CHIPS HTML
   Unique colors ki list → chips with color swatch
   ---------------------------------------------------------- */
function buildColorChips(variants) {
  const colors = unique(variants.map(v => v.color));

  return colors.map(color => {
    // COLOR_MAP mein hai tou swatch banao, warna swatch nahi
    const swatchHtml = COLOR_MAP[color]
      ? `<span class="color-swatch" style="background:${COLOR_MAP[color]}"></span>`
      : "";

    return `<span class="chip">${swatchHtml}${color}</span>`;
  }).join("");
}


/* ----------------------------------------------------------
   BUILD SIZE CHIPS HTML
   Unique sizes ki list → chips
   "One Size" skip karo — chips mein likhne ki zaroorat nahi
   ---------------------------------------------------------- */
function buildSizeChips(variants) {
  const sizes = unique(variants.map(v => v.size))
    .filter(s => s !== "One Size");

  return sizes.map(size => `<span class="chip">${size}</span>`).join("");
}


/* ----------------------------------------------------------
   RENDER ONE CARD
   Ek product object leta hai → HTML string return karta hai
   ---------------------------------------------------------- */
function renderCard(product) {
  // JSON se saari fields nikal lo (destructuring)
  const { id, name, brand, price, currency, in_stock, images, variants, description } = product;

  // stock badge ke liye class aur label
  const stockClass = in_stock ? "in-stock"   : "out-stock";
  const stockLabel = in_stock ? "In Stock"   : "Out of Stock";

  // pehli image (index 0)
  const firstImage = images[0] || "";

  // ek unique ID banao jo HTML element IDs mein safe ho
  // "PRD-001" → "PRD001"
  const safeId = id.replace(/[^a-zA-Z0-9]/g, "");

  // chips aur dots banao
  const colorChips  = buildColorChips(variants);
  const sizeChips   = buildSizeChips(variants);
  const imageDots   = buildImageDots(images, safeId);

  // price format karo
  const formattedPrice = formatPrice(price, currency);

  // poora card HTML return karo (template literal)
  return `
    <article class="card">

      <!-- IMAGE AREA -->
      <div class="card-image">
        <img
          id="img-${safeId}"
          src="${firstImage}"
          alt="${name}"
          loading="lazy"
        />
        <span class="stock-badge ${stockClass}">
          <span class="badge-dot"></span>
          ${stockLabel}
        </span>
        ${imageDots}
      </div>

      <!-- TEXT BODY -->
      <div class="card-body">
        <p class="card-brand">${brand}</p>
        <h2 class="card-name">${name}</h2>
        <p class="card-desc">${description}</p>

        <!-- COLOR + SIZE CHIPS -->
        <div class="chips">
          ${colorChips}
          ${sizeChips}
        </div>

        <!-- PRICE + ID -->
        <div class="card-footer">
          <div class="card-price">
            ${formattedPrice}
            <span class="currency">${currency}</span>
          </div>
          <span class="card-id">${id}</span>
        </div>
      </div>

    </article>
  `;
}


/* ----------------------------------------------------------
   SWITCH IMAGE
   Dot click pe image badlo
   productId = safeId (e.g. "PRD001")
   index     = 0 ya 1
   ---------------------------------------------------------- */
function switchImage(productId, index) {
  // us product ko dhundho jiska safeId match kare
  const product = allProducts.find(
    p => p.id.replace(/[^a-zA-Z0-9]/g, "") === productId
  );
  if (!product) return;

  // image tag update karo
  const imgEl = document.getElementById("img-" + productId);
  if (imgEl) imgEl.src = product.images[index];

  // dots update karo — sirf clicked wala active ho
  const allDots = document.querySelectorAll(`[onclick*="${productId}"]`);
  allDots.forEach((dot, i) => dot.classList.toggle("active", i === index));
}


/* ----------------------------------------------------------
   GET FILTERED + SORTED LIST
   filterState aur sortState ke hisaab se list tayyar karo
   ---------------------------------------------------------- */
function getFilteredList() {
  // pehle copy banao — original array mat chhedo
  let list = [...allProducts];

  // FILTER
  if (filterState === "in")  list = list.filter(p =>  p.in_stock);
  if (filterState === "out") list = list.filter(p => !p.in_stock);

  // SORT
  if (sortState === "low")  list.sort((a, b) => a.price - b.price);
  if (sortState === "high") list.sort((a, b) => b.price - a.price);
  if (sortState === "name") list.sort((a, b) => a.name.localeCompare(b.name));

  return list;
}


/* ----------------------------------------------------------
   RENDER — main display function
   Filter + sort laga ke saare cards page pe daal do
   ---------------------------------------------------------- */
function render() {
  const catalogue = document.getElementById("catalogue");
  const countEl   = document.getElementById("product-count");

  const list = getFilteredList();

  // count update karo
  countEl.textContent = `${list.length} product${list.length !== 1 ? "s" : ""}`;

  // agar list khali hai
  if (list.length === 0) {
    catalogue.innerHTML = `<p class="no-results">Koi product nahi mila.</p>`;
    return;
  }

  // saare cards banao aur grid mein daal do
  catalogue.innerHTML = list.map(renderCard).join("");
}


/* ----------------------------------------------------------
   SETUP FILTER BUTTONS
   Har [data-filter] button pe click listener lagao
   ---------------------------------------------------------- */
function setupFilters() {
  const filterBtns = document.querySelectorAll("[data-filter]");

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // pehle sab se active hata do
      filterBtns.forEach(b => b.classList.remove("active"));
      // clicked wale ko active karo
      btn.classList.add("active");
      // state update karo
      filterState = btn.dataset.filter;
      // dobara render karo
      render();
    });
  });
}


/* ----------------------------------------------------------
   SETUP SORT BUTTONS
   Har [data-sort] button pe click listener lagao
   Same button dobara click karo tou sort hata jata hai
   ---------------------------------------------------------- */
function setupSort() {
  const sortBtns = document.querySelectorAll("[data-sort]");

  sortBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const wasActive = btn.classList.contains("active");

      // pehle sab sort buttons se active hata do
      sortBtns.forEach(b => b.classList.remove("active"));

      if (wasActive) {
        // same button dobara click kiya → sort hata do
        sortState = null;
      } else {
        // naya sort lagao
        btn.classList.add("active");
        sortState = btn.dataset.sort;
      }

      render();
    });
  });
}


/* ----------------------------------------------------------
   LOAD PRODUCTS — main function
   products.json fetch karo, phir sab setup karo
   ---------------------------------------------------------- */
async function loadProducts() {
  const catalogue = document.getElementById("catalogue");

  try {
    // products.json uthao
    const response = await fetch("products.json");

    // agar file mili nahi (404 etc.)
    if (!response.ok) {
      throw new Error(`File nahi mili — HTTP ${response.status}`);
    }

    // JSON parse karo
    allProducts = await response.json();

    // loading class hata do
    catalogue.classList.remove("loading");

    // cards dikhao
    render();

  } catch (error) {
    // kuch gadbad hua
    catalogue.classList.remove("loading");
    catalogue.classList.add("error");
    catalogue.innerHTML = `
      ⚠️ Products load nahi ho sake: ${error.message}
      <br><br>
      <small>
        Tip: Dono files (index.html + products.json) ek hi folder mein honi chahiye
        aur local server se serve karo — e.g. <code>npx serve .</code>
      </small>
    `;
    document.getElementById("product-count").textContent = "error";
  }
}


/* ----------------------------------------------------------
   FOOTER TIMESTAMP
   ---------------------------------------------------------- */
function setFooterTime() {
  const el = document.getElementById("footer-time");
  if (el) {
    el.textContent = new Date().toLocaleString("en-ZA");
  }
}


/* ----------------------------------------------------------
   INIT — jab page load ho tab sab kuch shuru karo
   ---------------------------------------------------------- */
function init() {
  setupFilters();   // filter buttons ready karo
  setupSort();      // sort buttons ready karo
  setFooterTime();  // footer mein time daal do
  loadProducts();   // JSON fetch karo aur cards dikhao
}

// DOMContentLoaded = jab HTML fully load ho jaye tab init() chalo
document.addEventListener("DOMContentLoaded", init);