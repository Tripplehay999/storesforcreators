
"use strict";

const BRAND_NAME = "Browne's Talent Group";
const STORAGE_KEY = "btg-products-complete-v8";

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const IMAGES = {
  jasmine: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&h=1100&fit=crop&crop=faces",

  sofia: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1000&h=1100&fit=crop",

  nia: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1000&h=1100&fit=crop&crop=faces",

  food: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000&h=850&fit=crop",

  study: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000&h=850&fit=crop",

  coaching: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1000&h=850&fit=crop",

  budget: "Template Images/Student Money Planner.png",

  complete: "Template Images/Complete Budget Planner image.png"
};

const creators = {
  jasmine: {
    name: "Jasmine's Financials",
    short: "jasmine's financials.",
    category: "FINANCE / MONEY TIPS",
    description: "Budgeting, money management, and everyday financial confidence.",
    headline: "Your money.<br><em>Your way.</em>",
    bio: "Budget planners and money tools designed to help you feel more confident with your finances.",
    image: IMAGES.jasmine,
    product: "budget",
    products: ["budget", "coaching"],
    label: "MONEY TIPS",
    background: "#f6eaf1"
  },

  sofia: {
    name: "Sofia's Fit Life",
    short: "sofia. fit",
    category: "FITNESS / WELLNESS",
    description: "Fitness routines, meal preparation, and healthy habits.",
    headline: "Feel good.<br><em>Feel stronger.</em>",
    bio: "Meal preparation and fitness tools for building routines that fit your life.",
    image: IMAGES.sofia,
    product: "fitness",
    products: ["fitness"],
    label: "FITNESS & MEALS",
    background: "#eef4eb"
  },

  nia: {
    name: "Notes by Nia",
    short: "notes by nia.",
    category: "STUDY GUIDES / PLANNING",
    description: "Study guides, academic planning, and better organization.",
    headline: "Study smarter.<br><em>Dream bigger.</em>",
    bio: "Study planning and academic organization tools made for busy students.",
    image: IMAGES.nia,
    product: "study",
    products: ["study"],
    label: "📖 STUDY EDIT",
    background: "#f0eaf7"
  }
};

const defaultProducts = [
  {
    id: "budget",
    name: "Budget Planner Collection",
    category: "PERSONAL FINANCE",
    tagline: "Choose a budget planner that works for you.",
    description:
      "Beautiful digital budgeting templates designed to organize income, spending, savings goals, and financial planning. Choose from different planner options to fit your lifestyle.",
    price: 19,
    priceLabel: "$19–$59 USD",
    badge: "DIGITAL BUDGET TEMPLATES",
    creator: "jasmine",
    image: IMAGES.budget,
    gallery: [IMAGES.complete],
    theme: "#f0e0ed",
    layout: "split",
    cta: "Explore budget planners",
    features: [
      "Monthly income and expense tracking",
      "Budget categories and spending summaries",
      "Savings goals and financial planning",
      "Visual charts and dashboards",
      "Student and complete planner options"
    ],
    faqs: [
      [
        "Is this a physical product?",
        "No. This example collection contains digital budget planners."
      ],
      [
        "Are there different planner options?",
        "Yes. The collection can offer different planner versions at different prices."
      ]
    ]
  },

  {
    id: "coaching",
    name: "1:1 Financial Coaching",
    category: "FINANCIAL COACHING",
    tagline: "Personalized support for your money goals.",
    description:
      "An illustrative one-on-one financial coaching offering focused on budgeting habits, savings organization, and practical money planning. Actual availability, qualifications, and service scope must be confirmed before booking.",
    price: 105,
    priceLabel: "$105 USD / hour",
    badge: "PERSONALIZED SUPPORT",
    creator: "jasmine",
    image: IMAGES.coaching,
    gallery: [],
    theme: "#eadcea",
    layout: "split",
    cta: "Explore coaching",
    features: [
      "One-on-one budgeting conversation",
      "Personal money goal planning",
      "Spending and savings organization",
      "Illustrative 60-minute session"
    ],
    faqs: [
      [
        "Can I book right now?",
        "Not through this demonstration. Live booking and payment are not connected."
      ],
      [
        "Is this regulated financial advice?",
        "No regulated advice is represented by this sample. A real provider must operate within their qualifications and applicable rules."
      ]
    ]
  },

  {
    id: "fitness",
    name: "Fitness & Meal Prep Planner",
    category: "FITNESS / WELLNESS",
    tagline: "Plan your meals. Love your routine.",
    description:
      "A digital meal preparation and fitness planning concept featuring weekly meal schedules, grocery lists, workouts, and healthy habit tracking.",
    price: 29,
    priceLabel: "From $29 USD",
    badge: "MEAL PREP & FITNESS",
    creator: "sofia",
    image: IMAGES.food,
    gallery: [],
    theme: "#e4efdf",
    layout: "split",
    cta: "Explore meal planner",
    features: [
      "Weekly meal preparation planner",
      "Grocery list organization",
      "Workout schedule",
      "Habit tracking",
      "Weekly progress pages"
    ],
    faqs: [
      [
        "Is this a personalized nutrition program?",
        "No. This is a general digital planning concept, not individualized medical or nutrition advice."
      ]
    ]
  },

  {
    id: "study",
    name: "Study Guides & Planning",
    category: "STUDY / PRODUCTIVITY",
    tagline: "Less chaos. More clarity.",
    description:
      "Digital study guides and academic planning resources to help organize assignments, deadlines, study sessions, and exam preparation.",
    price: 19,
    priceLabel: "From $19 USD",
    badge: "STUDY SMARTER",
    creator: "nia",
    image: IMAGES.study,
    gallery: [],
    theme: "#ece3f3",
    layout: "split",
    cta: "Explore study guides",
    features: [
      "Assignment and deadline tracking",
      "Weekly study planning",
      "Exam preparation schedules",
      "Study guide templates",
      "Academic organization"
    ],
    faqs: []
  }
];

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function money(value, decimals = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

function number(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function safeColor(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value))
    ? value
    : "#eee3f0";
}

function safeImage(value) {
  const image = String(value || "").trim();

  if (/^https:\/\//i.test(image)) {
    return image;
  }

  if (/^data:image\/(png|jpeg|webp);base64,/i.test(image)) {
    return image;
  }

  if (
    /^(?:\.\/)?Template Images\/[a-z0-9 _().-]+\.(png|jpg|jpeg|webp)$/i.test(image) &&
    !image.includes("..")
  ) {
    return image;
  }

  return "";
}

function normalizeProduct(product) {
  return {
    id: String(product.id || "new-product")
      .replace(/[^a-z0-9-]/gi, "")
      .toLowerCase(),

    name: String(product.name || "New product").slice(0, 120),

    category: String(product.category || "DIGITAL PRODUCT").slice(0, 100),

    tagline: String(product.tagline || "").slice(0, 250),

    description: String(product.description || "").slice(0, 3000),

    price: Math.max(0, Math.min(9999, Number(product.price) || 0)),

    priceLabel: String(product.priceLabel || "").slice(0, 100),

    badge: String(product.badge || "").slice(0, 100),

    creator: creators[product.creator]
      ? product.creator
      : "jasmine",

    image: safeImage(product.image),

    gallery: Array.isArray(product.gallery)
      ? product.gallery.map(safeImage).filter(Boolean).slice(0, 8)
      : [],

    theme: safeColor(product.theme),

    layout: product.layout === "center" ? "center" : "split",

    cta: String(product.cta || "Explore product").slice(0, 100),

    features: Array.isArray(product.features)
      ? product.features.map(String).slice(0, 25)
      : [],

    faqs: Array.isArray(product.faqs)
      ? product.faqs
          .filter(Array.isArray)
          .map(pair => [
            String(pair[0] || ""),
            String(pair[1] || "")
          ])
          .slice(0, 15)
      : []
  };
}

function loadProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (Array.isArray(saved) && saved.length) {
      return saved.map(normalizeProduct);
    }
  } catch (error) {}

  return defaultProducts.map(normalizeProduct);
}

let products = loadProducts();
let editingId = "budget";
let draft = null;
let applicationText = "";
let toastTimer;

function getProduct(id) {
  return products.find(product => product.id === id);
}

function saveProducts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return true;
  } catch (error) {
    toast("Browser storage is unavailable or full.");
    return false;
  }
}

function productPrice(product) {
  return product.priceLabel || money(product.price) + " USD";
}

function productImage(product) {
  return safeImage(product.image) || IMAGES.budget;
}

function productLink(product, creator) {
  return `#/product/${encodeURIComponent(product.id)}` +
    (creator ? `?creator=${encodeURIComponent(creator)}` : "");
}

function renderCreatorCards() {
  const grid = $("#creator-grid");

  if (!grid) return;

  grid.innerHTML = Object.entries(creators).map(([slug, creator]) => {
    const product = getProduct(creator.product);

    if (!product) return "";

    return `
      <article class="creator-card reveal">

        <a class="creator-photo" href="#/store/${slug}">

          <img
            src="${escapeHTML(creator.image)}"
            alt="Illustrative ${escapeHTML(creator.category.toLowerCase())} creator portrait"
            loading="lazy"
          >

          <span class="creator-photo-badge">
            ${escapeHTML(creator.label)}
          </span>

          <span class="creator-photo-title">
            ${escapeHTML(creator.short)}
          </span>

        </a>

        <div class="creator-card-body">

          <span class="creator-category">
            ${escapeHTML(creator.category)}
          </span>

          <h3>${escapeHTML(creator.name)}</h3>

          <p class="creator-card-description">
            ${escapeHTML(creator.description)}
          </p>

          <a
            class="creator-product"
            href="${productLink(product, slug)}"
          >

            <div class="creator-product-photo">
              <img
                src="${escapeHTML(productImage(product))}"
                alt="${escapeHTML(product.name)} preview"
                loading="lazy"
              >
            </div>

            <div class="creator-product-info">
              <small>FEATURED PRODUCT</small>

              <strong>${escapeHTML(product.name)}</strong>

              <span>${escapeHTML(productPrice(product))}</span>

              <b>View product ↗</b>
            </div>

          </a>

          <a class="creator-store-link" href="#/store/${slug}">
            Visit example storefront
            <span>↗</span>
          </a>

        </div>

      </article>
    `;
  }).join("");

  observeReveals();
}

function updateCalculator() {
  const followers = Number($("#calc-followers").value);
  const reach = Number($("#calc-reach").value);
  const rate = Number($("#calc-rate").value);
  const price = Number($("#calc-price").value);
  const split = Number($("#calc-split").value) / 100;

  const visits = Math.round(followers * reach / 100);
  const orders = Math.round(visits * rate / 100);
  const gross = orders * price;
  const creatorCut = gross * split;
  const btgCut = gross * (1 - split);

  $("#followers-value").textContent = number(followers);
  $("#reach-value").textContent = reach.toFixed(1) + "%";
  $("#rate-value").textContent = rate.toFixed(1) + "%";
  $("#price-value").textContent = money(price);
  $("#split-value").textContent = Math.round(split * 100) + "%";

  $("#creator-earnings-big").textContent = money(creatorCut, 2);
  $("#calc-visits-result").textContent = number(visits);
  $("#calc-orders").textContent = number(orders);
  $("#calc-gross").textContent = money(gross, 2);
  $("#calc-company").textContent = money(btgCut, 2);

  const scenarios = [
    { key: "low", factor: 0.6 },
    { key: "mid", factor: 1 },
    { key: "high", factor: 1.4 }
  ];

  const results = scenarios.map(scenario => {
    const scenarioVisits = Math.round(visits * scenario.factor);
    const scenarioOrders = Math.round(scenarioVisits * rate / 100);

    return {
      key: scenario.key,
      earnings: scenarioOrders * price * split
    };
  });

  const maximum = Math.max(
    1,
    ...results.map(result => result.earnings)
  );

  results.forEach(result => {
    $(`#scenario-${result.key}-value`).textContent =
      money(result.earnings, 2);

    $(`#scenario-${result.key}-bar`).style.height =
      `${result.earnings / maximum * 100}%`;
  });

  [
    "calc-followers",
    "calc-reach",
    "calc-rate",
    "calc-price",
    "calc-split"
  ].forEach(id => {
    const slider = $("#" + id);

    const progress =
      (Number(slider.value) - Number(slider.min)) /
      (Number(slider.max) - Number(slider.min)) * 100;

    slider.style.setProperty("--progress", `${progress}%`);
  });

  $$("[data-followers]").forEach(button => {
    const active = Number(button.dataset.followers) === followers;

    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

const dashboardData = {
  weeks: {
    labels: ["W1", "W2", "W3", "W4"],
    orders: [5, 4, 7, 9],
    earnings: 612.50,
    title: "Weekly orders",
    note: "4-WEEK OVERVIEW"
  },

  months: {
    labels: ["JUL", "AUG", "SEP", "OCT"],
    orders: [12, 17, 18, 25],
    earnings: 1764.00,
    title: "Monthly orders",
    note: "LAST 4 MONTHS"
  }
};

function updateDashboard(period = "weeks") {
  const data = dashboardData[period] || dashboardData.weeks;

  const orders = data.orders.reduce(
    (sum, value) => sum + value,
    0
  );

  const maximum = Math.max(...data.orders, 1);

  $("#dash-earnings").textContent = money(data.earnings, 2);
  $("#dash-orders").textContent = number(orders);
  $("#dash-chart-title").textContent = data.title;
  $("#dash-period-note").textContent = data.note;

  $("#dash-bars").innerHTML = data.orders.map((value, index) => `
    <div class="dash-bar-item">

      <strong>${value}</strong>

      <div class="dash-bar-track">
        <b
          style="height:${Math.max(8, value / maximum * 100)}%"
          title="${value} sample orders"
        ></b>
      </div>

      <span>${data.labels[index]}</span>

    </div>
  `).join("");

  $$("[data-dash-period]").forEach(button => {
    const active = button.dataset.dashPeriod === period;

    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function demoRibbon() {
  return `
    <div class="demo-ribbon">
      <span>✳ STOREFRONT DESIGN PREVIEW — NOT A LIVE CHECKOUT</span>
      <a href="#home">← Back to Browne's Talent Group</a>
    </div>
  `;
}

function innerTop(back = "#home") {
  return `
    <div class="container inner-top">

      <a class="back-link" href="${back}">
        ← Back
      </a>

      <a class="brand" href="#home">
        <span class="brand-mark">BTG<span>✳</span></span>

        <span class="brand-copy">
          <strong>Browne's Talent Group</strong>
          <small>CREATOR COMMERCE & TALENT</small>
        </span>
      </a>

    </div>
  `;
}

function creatorProducts(slug) {
  const creator = creators[slug];

  const ids = [
    ...new Set([
      ...creator.products,
      ...products
        .filter(product => product.creator === slug)
        .map(product => product.id)
    ])
  ];

  return ids.map(getProduct).filter(Boolean);
}

function renderStore(slug) {
  const creator = creators[slug];

  if (!creator) return false;

  $("#subpage").innerHTML = `
    <div
      class="store-page"
      style="--store-bg:${creator.background}"
    >

      ${demoRibbon()}
      ${innerTop("#stores")}

      <section class="container store-hero">

        <div>
          <span class="eyebrow">
            ${escapeHTML(creator.category)}
          </span>

          <h1>${creator.headline}</h1>

          <p>${escapeHTML(creator.bio)}</p>

          <a class="btn btn-dark" href="#store-collection">
            Shop the collection ↗
          </a>
        </div>

        <div class="store-hero-photo">
          <img
            src="${escapeHTML(creator.image)}"
            alt="Illustrative creator portrait"
          >
        </div>

      </section>

      <section class="store-collection" id="store-collection">

        <div class="container">
          <span class="eyebrow">THE DIGITAL COLLECTION</span>

          <h2>Made for <em>your everyday.</em></h2>

          <div class="store-product-grid">

            ${creatorProducts(slug).map(product => `
              <article class="store-product-card">

                <a href="${productLink(product, slug)}">
                  <div class="store-product-image">
                    <img
                      src="${escapeHTML(productImage(product))}"
                      alt="${escapeHTML(product.name)}"
                      loading="lazy"
                    >
                  </div>
                </a>

                <div class="store-product-copy">

                  <small>${escapeHTML(product.category)}</small>

                  <h3>${escapeHTML(product.name)}</h3>

                  <p>${escapeHTML(product.tagline)}</p>

                  <strong>${escapeHTML(productPrice(product))}</strong>

                  <a href="${productLink(product, slug)}">
                    Explore product ↗
                  </a>

                </div>

              </article>
            `).join("")}

          </div>

          <p class="calculator-disclaimer">
            Fictional creator storefront and illustrative product offerings.
          </p>
        </div>

      </section>

    </div>
  `;

  document.title = `${creator.name} | Example Store`;
  return true;
}

function productGallery(product, active = 0) {
  const gallery = [
    productImage(product),
    ...product.gallery
  ].filter(Boolean);

  const selected = gallery[active] || gallery[0];

  return `
    <div class="product-gallery-main" style="background:${product.theme}">

      <img
        src="${escapeHTML(selected)}"
        alt="${escapeHTML(product.name)} product preview"
      >

    </div>

    <div class="gallery-thumbs">

      ${gallery.map((image, index) => `
        <button
          class="${index === active ? "active" : ""}"
          type="button"
          data-gallery="${index}"
          aria-label="View image ${index + 1}"
        >
          <img
            src="${escapeHTML(image)}"
            alt="Product thumbnail ${index + 1}"
          >
        </button>
      `).join("")}

    </div>
  `;
}

function renderProduct(id, creatorSlug) {
  const product = getProduct(id);

  if (!product) return false;

  const creator = creators[creatorSlug];

  $("#subpage").innerHTML = `
    <div class="product-page">

      ${demoRibbon()}

      ${innerTop(creator ? `#/store/${creatorSlug}` : "#stores")}

      <div class="container product-detail product-layout-${product.layout}">

        <div class="product-gallery" id="product-gallery">
          ${productGallery(product)}
        </div>

        <div class="product-info">

          <span class="eyebrow">
            ${escapeHTML(product.category)}
          </span>

          <h1>${escapeHTML(product.name)}</h1>

          <p>${escapeHTML(product.tagline)}</p>

          <div class="product-price">
            ${escapeHTML(productPrice(product))}
            <small>Illustrative product pricing</small>
          </div>

          <p>${escapeHTML(product.description)}</p>

          <button class="btn btn-dark" data-buy>
            ${escapeHTML(product.cta)} ↗
          </button>

          <p class="product-note">
            Storefront demonstration — checkout is not connected.
          </p>

          <ul class="feature-list">
            ${product.features.map(feature => `
              <li>${escapeHTML(feature)}</li>
            `).join("")}
          </ul>

          <div class="product-faq">

            <h3>Questions, answered.</h3>

            ${product.faqs.map(pair => `
              <details>
                <summary>${escapeHTML(pair[0])}</summary>
                <p>${escapeHTML(pair[1])}</p>
              </details>
            `).join("")}

          </div>

          <a
            class="back-link"
            href="#/studio?product=${encodeURIComponent(product.id)}"
          >
            Customize this product design ↗
          </a>

        </div>

      </div>

    </div>
  `;

  document.title = `${product.name} | ${BRAND_NAME}`;
  return true;
}

function editorFields(product) {
  return `
    <div class="editor-fields">

      <label class="full">
        Choose product

        <select id="studio-selected">
          ${products.map(item => `
            <option
              value="${escapeHTML(item.id)}"
              ${item.id === editingId ? "selected" : ""}
            >
              ${escapeHTML(item.name)}
            </option>
          `).join("")}
        </select>
      </label>

      <label class="full">
        Product name

        <input
          name="name"
          value="${escapeHTML(product.name)}"
        >
      </label>

      <label>
        Price (USD)

        <input
          name="price"
          type="number"
          min="0"
          max="9999"
          value="${product.price}"
        >
      </label>

      <label>
        Display price

        <input
          name="priceLabel"
          value="${escapeHTML(product.priceLabel)}"
          placeholder="From $19 USD"
        >
      </label>

      <label class="full">
        Category

        <input
          name="category"
          value="${escapeHTML(product.category)}"
        >
      </label>

      <label class="full">
        Short headline

        <input
          name="tagline"
          value="${escapeHTML(product.tagline)}"
        >
      </label>

      <label class="full">
        Description

        <textarea
          name="description"
          rows="4"
        >${escapeHTML(product.description)}</textarea>
      </label>

      <label>
        Product badge

        <input
          name="badge"
          value="${escapeHTML(product.badge)}"
        >
      </label>

      <label>
        Button text

        <input
          name="cta"
          value="${escapeHTML(product.cta)}"
        >
      </label>

      <label>
        Background color

        <input
          name="theme"
          type="color"
          value="${product.theme}"
        >
      </label>

      <label>
        Page layout

        <select name="layout">
          <option
            value="split"
            ${product.layout === "split" ? "selected" : ""}
          >
            Gallery and details
          </option>

          <option
            value="center"
            ${product.layout === "center" ? "selected" : ""}
          >
            Centered editorial
          </option>
        </select>
      </label>

      <label class="full">
        Assign to creator

        <select name="creator">
          ${Object.entries(creators).map(([slug, creator]) => `
            <option
              value="${slug}"
              ${product.creator === slug ? "selected" : ""}
            >
              ${escapeHTML(creator.name)}
            </option>
          `).join("")}
        </select>
      </label>

      <label class="full">
        Cover image URL or relative path

        <input
          name="image"
          value="${escapeHTML(product.image.startsWith("data:") ? "" : product.image)}"
          placeholder="Template Images/Student Money Planner.png"
        >
      </label>

      <label class="full">
        Upload cover image (under 1 MB)

        <input
          id="editor-upload"
          type="file"
          accept="image/png,image/jpeg,image/webp"
        >
      </label>

      <label class="full">
        Gallery images — one path or URL per line

        <textarea
          name="gallery"
          rows="4"
        >${escapeHTML(product.gallery.join("\n"))}</textarea>
      </label>

      <label class="full">
        Features — one per line

        <textarea
          name="features"
          rows="5"
        >${escapeHTML(product.features.join("\n"))}</textarea>
      </label>

      <label class="full">
        FAQs — Question | Answer, one per line

        <textarea
          name="faqs"
          rows="5"
        >${escapeHTML(product.faqs.map(pair => pair.join(" | ")).join("\n"))}</textarea>
      </label>

    </div>
  `;
}

function editorPreview(product) {
  return `
    <div class="preview-image" style="background:${product.theme}">

      <img
        src="${escapeHTML(productImage(product))}"
        alt="${escapeHTML(product.name)} preview"
      >

    </div>

    <div class="preview-copy">

      <span class="eyebrow">
        ${escapeHTML(product.category)}
      </span>

      <h3>${escapeHTML(product.name)}</h3>

      <p><strong>${escapeHTML(productPrice(product))}</strong></p>

      <p>${escapeHTML(product.tagline)}</p>

      <p>${escapeHTML(product.description)}</p>

      <ul>
        ${product.features.map(feature => `
          <li>${escapeHTML(feature)}</li>
        `).join("")}
      </ul>

      <button class="btn btn-dark" data-buy>
        ${escapeHTML(product.cta)} ↗
      </button>

    </div>
  `;
}

function renderStudio(id) {
  editingId = getProduct(id)
    ? id
    : products[0].id;

  draft = structuredClone(getProduct(editingId));

  $("#subpage").innerHTML = `
    <div class="studio-page">

      ${demoRibbon()}
      ${innerTop("#stores")}

      <div class="container studio-heading">

        <span class="eyebrow">
          PRODUCT DESIGN STUDIO / LOCAL DEMO
        </span>

        <h1>Make every product <em>your own.</em></h1>

        <p>
          Customize product photos, pricing, descriptions,
          features, FAQs, layouts, and branding.
        </p>

      </div>

      <div class="container studio-layout">

        <section class="editor-panel">

          <h2>Product settings</h2>

          <div class="editor-actions">

            <button class="small-button" type="button" data-new>
              + New product
            </button>

            <button class="small-button" type="button" data-duplicate>
              Duplicate
            </button>

            <button class="small-button" type="button" data-delete>
              Delete
            </button>

            <button class="small-button" type="button" data-reset>
              Reset all
            </button>

          </div>

          <form id="studio-form">

            ${editorFields(draft)}

            <div class="editor-footer">

              <button class="btn btn-dark" type="button" data-save>
                Save locally ↗
              </button>

              <button class="btn btn-soft" type="button" data-export>
                Export JSON ↓
              </button>

              <button class="small-button" type="button" data-import>
                Import JSON ↑
              </button>

              <input
                id="json-import"
                type="file"
                accept=".json,application/json"
                hidden
              >

            </div>

          </form>

          <div class="editor-warning">
            ✳ Product changes are saved only in this browser.
            Publishing changes for everyone requires a secure
            admin system, database, and hosted image storage.
          </div>

        </section>

        <aside class="preview-panel">

          <div class="preview-heading">
            <h2>Live preview</h2>

            <a
              class="small-button"
              href="#/product/${encodeURIComponent(draft.id)}"
            >
              Full product page ↗
            </a>
          </div>

          <div id="editor-preview">
            ${editorPreview(draft)}
          </div>

        </aside>

      </div>

    </div>
  `;

  document.title = `Product Studio | ${BRAND_NAME}`;
}

function updateDraft() {
  const form = $("#studio-form");

  if (!form || !draft) return;

  const data = new FormData(form);
  const enteredImage = String(data.get("image") || "").trim();

  draft = normalizeProduct({
    ...draft,

    name: data.get("name"),
    price: data.get("price"),
    priceLabel: data.get("priceLabel"),
    category: data.get("category"),
    tagline: data.get("tagline"),
    description: data.get("description"),
    badge: data.get("badge"),
    cta: data.get("cta"),
    theme: data.get("theme"),
    layout: data.get("layout"),
    creator: data.get("creator"),

    image: enteredImage
      ? safeImage(enteredImage)
      : draft.image,

    gallery: String(data.get("gallery") || "")
      .split("\n")
      .map(safeImage)
      .filter(Boolean),

    features: String(data.get("features") || "")
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean),

    faqs: String(data.get("faqs") || "")
      .split("\n")
      .map(line => line.split("|").map(item => item.trim()))
      .filter(pair => pair.length >= 2 && pair[0] && pair[1])
  });

  $("#editor-preview").innerHTML = editorPreview(draft);
}

function showCompany() {
  $("#company-view").hidden = false;
  $("#subpage").hidden = true;
  $("#site-footer").hidden = false;

  document.title =
    `${BRAND_NAME} | Your Audience. Our Expertise.`;
}

function showSubpage() {
  $("#company-view").hidden = true;
  $("#subpage").hidden = false;
  $("#site-footer").hidden = true;

  window.scrollTo(0, 0);
}

function route() {
  let hash = location.hash || "#home";

  try {
    hash = decodeURIComponent(hash);
  } catch (error) {
    hash = "#home";
  }

  if (hash.startsWith("#/store/")) {
    const slug = hash.slice("#/store/".length).split("?")[0];

    if (renderStore(slug)) {
      showSubpage();
      return;
    }
  }

  if (hash.startsWith("#/product/")) {
    const path = hash.slice("#/product/".length);
    const [id, query] = path.split("?");

    const params = new URLSearchParams(query || "");

    if (renderProduct(id, params.get("creator"))) {
      showSubpage();
      return;
    }
  }

  if (hash.startsWith("#/studio")) {
    const query = hash.split("?")[1] || "";
    const params = new URLSearchParams(query);

    renderStudio(params.get("product"));
    showSubpage();
    return;
  }

  showCompany();

  if (hash.length > 1 && !hash.startsWith("#/")) {
    requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({
        behavior: "smooth"
      });
    });
  }

  observeReveals();
}

function observeReveals() {
  const elements = $$(".reveal:not(.visible)");

  if (!("IntersectionObserver" in window)) {
    elements.forEach(element => element.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  elements.forEach(element => observer.observe(element));
}

function toast(message) {
  const element = $("#toast");

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    element.classList.remove("show");
  }, 3200);
}

function showInfo(title, label, message) {
  $("#info-title").textContent = title;
  $("#info-label").textContent = label;
  $("#info-body").textContent = message;

  $("#info-dialog").showModal();
}

function newProductId() {
  return "product-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 7);
}

document.addEventListener("click", event => {
  const close = event.target.closest("[data-close]");

  if (close) {
    close.closest("dialog")?.close();
    return;
  }

  if (event.target.closest("[data-apply]")) {
    $("#apply-dialog").showModal();
    return;
  }

  if (event.target.closest("[data-login]")) {
    showInfo(
      "Creator portal",
      "CREATOR LOGIN",
      "Secure creator authentication is not connected to this frontend demonstration."
    );
    return;
  }

  if (event.target.closest("[data-buy]")) {
    showInfo(
      "Product preview",
      "CHECKOUT NOT CONNECTED",
      "This is a customizable storefront preview. Live payments, booking, and digital product delivery are not yet connected."
    );
    return;
  }

  if (event.target.closest("[data-policy]")) {
    showInfo(
      "Privacy & terms",
      "FINAL POLICIES REQUIRED",
      "The final privacy policy, terms of service, refund policy, and applicable disclosures must be completed before accepting live transactions."
    );
    return;
  }

  const preset = event.target.closest("[data-followers]");

  if (preset) {
    $("#calc-followers").value = preset.dataset.followers;
    updateCalculator();
    return;
  }

  const periodButton = event.target.closest("[data-dash-period]");

  if (periodButton) {
    updateDashboard(periodButton.dataset.dashPeriod);
    return;
  }

  const galleryButton = event.target.closest("[data-gallery]");

  if (galleryButton) {
    const hash = decodeURIComponent(location.hash);
    const id = hash.slice("#/product/".length).split("?")[0];
    const product = getProduct(id);

    if (product) {
      $("#product-gallery").innerHTML = productGallery(
        product,
        Number(galleryButton.dataset.gallery)
      );
    }

    return;
  }

  if (event.target.closest("[data-save]")) {
    updateDraft();

    products = products.map(product =>
      product.id === editingId
        ? structuredClone(draft)
        : product
    );

    if (saveProducts()) {
      renderCreatorCards();
      renderStudio(editingId);
      toast("Product saved in this browser.");
    }

    return;
  }

  if (event.target.closest("[data-new]")) {
    const id = newProductId();

    products.push(normalizeProduct({
      ...defaultProducts[0],
      id,
      name: "New digital product",
      price: 29,
      priceLabel: "$29 USD",
      badge: "NEW PRODUCT",
      image: "",
      gallery: [],
      features: ["Feature one", "Feature two"]
    }));

    saveProducts();

    location.hash = `#/studio?product=${id}`;
    renderStudio(id);
    return;
  }

  if (event.target.closest("[data-duplicate]")) {
    updateDraft();

    const id = newProductId();

    products.push({
      ...structuredClone(draft),
      id,
      name: draft.name + " (copy)"
    });

    saveProducts();

    location.hash = `#/studio?product=${id}`;
    renderStudio(id);
    return;
  }

  if (event.target.closest("[data-delete]")) {
    if (products.length <= 1) {
      toast("Keep at least one product.");
      return;
    }

    if (confirm("Delete this product from the local catalog?")) {
      products = products.filter(product => product.id !== editingId);

      saveProducts();
      renderCreatorCards();

      const nextId = products[0].id;

      location.hash = `#/studio?product=${nextId}`;
      renderStudio(nextId);
    }

    return;
  }

  if (event.target.closest("[data-reset]")) {
    if (confirm("Reset all products to the original examples?")) {
      products = defaultProducts.map(normalizeProduct);

      saveProducts();
      renderCreatorCards();

      location.hash = "#/studio?product=budget";
      renderStudio("budget");

      toast("Product catalog reset.");
    }

    return;
  }

  if (event.target.closest("[data-export]")) {
    updateDraft();

    const catalog = products.map(product =>
      product.id === editingId
        ? draft
        : product
    );

    const blob = new Blob(
      [JSON.stringify(catalog, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "btg-products.json";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast("Product catalog exported.");
    return;
  }

  if (event.target.closest("[data-import]")) {
    $("#json-import")?.click();
    return;
  }

  if (event.target.closest("#menu-toggle")) {
    const nav = $("#main-nav");
    const opened = nav.classList.toggle("open");

    $("#menu-toggle").setAttribute(
      "aria-expanded",
      String(opened)
    );

    return;
  }

  if (event.target.closest("#main-nav a")) {
    $("#main-nav").classList.remove("open");
    $("#menu-toggle").setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("input", event => {
  const calculatorIds = [
    "calc-followers",
    "calc-reach",
    "calc-rate",
    "calc-price",
    "calc-split"
  ];

  if (calculatorIds.includes(event.target.id)) {
    updateCalculator();
  }

  if (
    event.target.closest("#studio-form") &&
    event.target.id !== "studio-selected" &&
    event.target.id !== "editor-upload"
  ) {
    updateDraft();
  }
});

document.addEventListener("change", async event => {
  if (event.target.id === "studio-selected") {
    renderStudio(event.target.value);
    return;
  }

  if (event.target.id === "editor-upload") {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowed = [
      "image/png",
      "image/jpeg",
      "image/webp"
    ];

    if (!allowed.includes(file.type) || file.size > 1024 * 1024) {
      toast("Choose a PNG, JPG, or WebP image under 1 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      draft.image = String(reader.result);

      $("#editor-preview").innerHTML = editorPreview(draft);

      const input = $('#studio-form [name="image"]');

      if (input) input.value = "";

      toast("Cover updated. Save locally to keep it.");
    };

    reader.readAsDataURL(file);
    return;
  }

  if (event.target.id === "json-import") {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const imported = JSON.parse(await file.text());

      if (
        !Array.isArray(imported) ||
        imported.length === 0 ||
        imported.length > 200
      ) {
        throw new Error("Invalid catalog");
      }

      const cleaned = imported.map(normalizeProduct);

      if (
        new Set(cleaned.map(product => product.id)).size !==
        cleaned.length
      ) {
        throw new Error("Duplicate product IDs");
      }

      products = cleaned;

      if (!saveProducts()) return;

      renderCreatorCards();

      const firstId = products[0].id;

      location.hash = `#/studio?product=${firstId}`;
      renderStudio(firstId);

      toast("Product catalog imported.");
    } catch (error) {
      toast("Import failed. Choose a valid product JSON file.");
    }
  }
});

document.addEventListener("error", event => {
  const image = event.target;

  if (!(image instanceof HTMLImageElement)) return;

  if (image.dataset.fallbackApplied) return;

  image.dataset.fallbackApplied = "true";

  if (
    image.src.includes("Student%20Money%20Planner") ||
    image.src.includes("Complete%20Budget%20Planner")
  ) {
    image.style.objectFit = "contain";
    image.style.background = "#f0e3ed";
    image.alt = "Budget planner image unavailable. Check the Template Images folder.";
  }
}, true);

$("#apply-form").addEventListener("submit", event => {
  event.preventDefault();

  if (!event.currentTarget.reportValidity()) return;

  const data = new FormData(event.currentTarget);

  applicationText =
    `${BRAND_NAME} — Creator Application\n\n` +
    [...data.entries()]
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

  $("#apply-status").textContent =
    "Your application is ready to copy. It has not been sent.";

  $("#copy-application").hidden = false;
});

$("#copy-application").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(applicationText);

    toast("Application copied. It has not been submitted.");
  } catch (error) {
    const blob = new Blob(
      [applicationText],
      { type: "text/plain" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "btg-creator-application.txt";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast("Application saved as a text file.");
  }
});

$$("dialog").forEach(dialog => {
  dialog.addEventListener("click", event => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
});

window.addEventListener("hashchange", route);

$("#year").textContent = new Date().getFullYear();

renderCreatorCards();
updateCalculator();
updateDashboard("weeks");
route();
