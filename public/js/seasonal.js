import { initDemoUser, getCurrentUser, onDemoUserChange } from "./demo-user.js";
const productsContainer = document.querySelector("#seasonal-products");
const upcomingContainer = document.querySelector("#upcoming-products");
const seasonTitle = document.querySelector("#in-season-title");
const monthFilter = document.querySelector("#month-filter");
const seasonFilter = document.querySelector("#season-filter");
const monthLabel = document.querySelector("#selected-month-label");
const monthNote = document.querySelector("#selected-month-note");
const pageSizeSelect = document.querySelector("#page-size");
const pagination = document.querySelector("#pagination");
const searchInput = document.querySelector("#product-search");
const addProductButton = document.querySelector("#add-product-button");
const addProductDialog = document.querySelector("#add-product-dialog");
const closeProductDialog = document.querySelector("#close-product-dialog");
const addProductForm = document.querySelector("#add-product-form");
const saveProductButton = document.querySelector("#save-product-button");
const today = new Date();
const currentMonth = today.getMonth() + 1;

const SEASONS = {
  Spring: { emoji: "🌸", months: [3, 4, 5] },
  Summer: { emoji: "☀️", months: [6, 7, 8] },
  Fall: { emoji: "🍂", months: [9, 10, 11] },
  Winter: { emoji: "❄️", months: [12, 1, 2] },
};

let filterMode = "month";
let selectedMonth = currentMonth;
let selectedSeason = null;
let pageSize = Number(pageSizeSelect.value) || 6;
let currentPage = 1;
const productDialogTitle = document.querySelector("#add-product-title");
let editingProductId = null;
initDemoUser();
let activeDemoUser = getCurrentUser() ?? "";

const productsRequest = fetch("/api/seasonal").then((response) => {
  if (!response.ok) {
    throw new Error("Failed to retrieve products");
  }

  return response.json();
});

function monthName(month) {
  return new Date(today.getFullYear(), month - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
}

function monthShortName(month) {
  return new Date(today.getFullYear(), month - 1, 1).toLocaleString("en-US", {
    month: "short",
  });
}

function buildMonthFilter() {
  for (let month = 1; month <= 12; month++) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.month = String(month);
    button.classList.add("btn", "btn-sm", "month-chip");

    const full = document.createElement("span");
    full.classList.add("month-chip-full");
    full.textContent = monthName(month);

    const short = document.createElement("span");
    short.classList.add("month-chip-short");
    short.textContent = monthShortName(month);

    button.append(full, short);

    button.addEventListener("click", () => {
      filterMode = "month";
      selectedMonth = month;
      selectedSeason = null;
      currentPage = 1;
      loadSeasonalProducts();
    });
    monthFilter.appendChild(button);
  }
}

function buildSeasonFilter() {
  for (const [season, info] of Object.entries(SEASONS)) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.season = season;
    button.classList.add("btn", "btn-sm", "season-chip");

    const emoji = document.createElement("span");
    emoji.classList.add("season-chip-emoji");
    emoji.textContent = info.emoji;
    emoji.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.classList.add("season-chip-label");
    label.textContent = season;

    button.append(emoji, label);
    button.setAttribute("aria-label", season);

    button.addEventListener("click", () => {
      filterMode = "season";
      selectedSeason = season;
      selectedMonth = info.months.includes(currentMonth)
        ? currentMonth
        : info.months[0];
      currentPage = 1;
      loadSeasonalProducts();
    });
    seasonFilter.appendChild(button);
  }
}

function updateMonthFilter() {
  for (const button of monthFilter.querySelectorAll("button")) {
    const isActive =
      filterMode === "month" && Number(button.dataset.month) === selectedMonth;
    button.classList.toggle("btn-primary", isActive);
    button.classList.toggle("btn-outline-secondary", !isActive);
    if (isActive) {
      button.setAttribute("aria-current", "true");
    } else {
      button.removeAttribute("aria-current");
    }
  }

  for (const button of seasonFilter.querySelectorAll("button")) {
    const isActive =
      filterMode === "season" && button.dataset.season === selectedSeason;
    button.classList.toggle("btn-primary", isActive);
    button.classList.toggle("btn-outline-secondary", !isActive);
    if (isActive) {
      button.setAttribute("aria-current", "true");
    } else {
      button.removeAttribute("aria-current");
    }
  }

  if (filterMode === "season") {
    monthLabel.textContent = `${SEASONS[selectedSeason].emoji} ${selectedSeason}`;
    monthNote.textContent = SEASONS[selectedSeason].months.includes(
      currentMonth,
    )
      ? "this season"
      : "";
  } else {
    monthLabel.textContent = monthName(selectedMonth);
    monthNote.textContent = selectedMonth === currentMonth ? "this month" : "";
  }
}

function nextAvailableMonth(product) {
  const months = Array.isArray(product.availableMonths)
    ? product.availableMonths
    : [];

  if (months.length === 0 || months.includes(selectedMonth)) {
    return null;
  }

  const sorted = months
    .map((month) => (month - selectedMonth + 12) % 12 || 12)
    .sort((a, b) => a - b);

  return ((selectedMonth + sorted[0] - 1) % 12) + 1;
}

function matchesSearch(product, searchTerm) {
  return [product.name, product.brand].some((value) =>
    (value ?? "").toLowerCase().includes(searchTerm),
  );
}

function createProductCard(product) {
  const col = document.createElement("div");
  col.classList.add("col");

  const card = document.createElement("article");
  card.classList.add("card", "h-100", "shadow-sm", "product-card");

  const body = document.createElement("div");
  body.classList.add("card-body", "d-flex", "flex-column");

  const name = document.createElement("h3");
  name.classList.add("card-title", "h6");
  name.textContent = product.name;

  const season = SEASONS[product.season]
    ? document.createElement("span")
    : null;
  if (season) {
    season.classList.add("badge", "season-badge", "mb-2");
    season.textContent = `${SEASONS[product.season].emoji} ${product.season}`;
  }

  const details = document.createElement("p");
  details.classList.add("card-text", "mb-1");
  details.textContent = `${product.brand} · ${product.category}`;

  const meta = document.createElement("p");
  meta.classList.add("card-text", "small", "text-body-secondary", "mb-1");
  const upcoming = nextAvailableMonth(product);
  const availability =
    product.seasonStatus === "estimated"
      ? "Estimated availability"
      : "Seasonal availability";
  meta.textContent = upcoming
    ? `${availability} · Back in ${monthName(upcoming)}`
    : availability;

  const source = document.createElement("p");
  source.classList.add("card-text", "small", "text-body-secondary", "mb-1");
  source.textContent = `Original source: ${product.source ?? "Unknown"}`;

  const lastEdited = document.createElement("p");
  lastEdited.classList.add("card-text", "small", "text-body-secondary");
  lastEdited.textContent = product.lastEditedBy
    ? `Last edited by: ${product.lastEditedBy}`
    : "No community edits yet";

  body.append(name);
  if (season) {
    body.append(season);
  }
  body.append(details, meta, source, lastEdited);

  const actions = document.createElement("div");
  actions.classList.add("mt-auto", "pt-2", "card-actions");

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.classList.add(
    "btn",
    "btn-sm",
    "btn-outline-primary",
    "edit-product-button",
  );
  editButton.textContent = "Edit";
  editButton.classList.toggle("d-none", activeDemoUser === "");

  editButton.addEventListener("click", () => {
    editingProductId = product._id;

    const fields = addProductForm.elements;

    fields.namedItem("name").value = product.name ?? "";
    fields.namedItem("brand").value = product.brand ?? "";
    fields.namedItem("category").value = product.category ?? "";
    fields.namedItem("season").value = product.season ?? "";
    fields.namedItem("notes").value = product.notes ?? "";

    const months = new Set(product.availableMonths ?? []);

    const monthCheckboxes = addProductForm.querySelectorAll(
      'input[name="availableMonths"]',
    );

    for (const checkbox of monthCheckboxes) {
      checkbox.checked = months.has(Number(checkbox.value));
    }

    productDialogTitle.textContent = "Edit Seasonal Product";
    saveProductButton.textContent = "Save Changes";
    saveProductButton.disabled = false;

    addProductDialog.showModal();
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.classList.add(
    "btn",
    "btn-sm",
    "btn-outline-danger",
    "delete-product-button",
  );
  deleteButton.textContent = "Delete";
  deleteButton.classList.toggle("d-none", activeDemoUser === "");

  deleteButton.addEventListener("click", async () => {
    if (!activeDemoUser) {
      alert("Please select a demo user.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    deleteButton.disabled = true;

    try {
      const response = await fetch(`/api/seasonal/${product._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      const products = await productsRequest;

      const index = products.findIndex((item) => item._id === product._id);

      if (index !== -1) {
        products.splice(index, 1);
      }

      await loadSeasonalProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(error.message);
      deleteButton.disabled = false;
    }
  });

  actions.append(editButton, deleteButton);
  body.appendChild(actions);
  card.appendChild(body);
  col.appendChild(card);

  return col;
}

function renderGrid(container, products, emptyMessage) {
  container.replaceChildren();

  if (products.length === 0) {
    const empty = document.createElement("p");
    empty.classList.add("text-body-secondary");
    empty.textContent = emptyMessage;
    container.appendChild(empty);
    return;
  }

  const grid = document.createElement("div");
  grid.classList.add(
    "row",
    "row-cols-1",
    "row-cols-sm-2",
    "row-cols-lg-3",
    "g-3",
  );

  for (const product of products) {
    grid.appendChild(createProductCard(product));
  }

  container.appendChild(grid);
}

function renderPagination(totalItems) {
  pagination.replaceChildren();

  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) {
    return;
  }

  const addPage = (label, page, { disabled = false, active = false } = {}) => {
    const li = document.createElement("li");
    li.classList.add("page-item");
    if (disabled) {
      li.classList.add("disabled");
    }
    if (active) {
      li.classList.add("active");
    }

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("page-link");
    button.textContent = label;
    if (active) {
      button.setAttribute("aria-current", "page");
    }
    button.addEventListener("click", () => {
      if (disabled || active) {
        return;
      }
      currentPage = page;
      renderInSeason();
      seasonTitle.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    li.appendChild(button);
    pagination.appendChild(li);
  };

  addPage("‹", currentPage - 1, { disabled: currentPage === 1 });

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let page = start; page <= end; page++) {
    addPage(String(page), page, { active: page === currentPage });
  }

  addPage("›", currentPage + 1, { disabled: currentPage === totalPages });
}

let inSeasonProducts = [];

function renderInSeason() {
  const totalPages = Math.max(1, Math.ceil(inSeasonProducts.length / pageSize));

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start = (currentPage - 1) * pageSize;
  const pageItems = inSeasonProducts.slice(start, start + pageSize);

  renderGrid(
    productsContainer,
    pageItems,
    "No products found for this filter.",
  );
  renderPagination(inSeasonProducts.length);
}

async function loadSeasonalProducts() {
  updateMonthFilter();
  seasonTitle.textContent =
    filterMode === "season"
      ? `In Season — ${SEASONS[selectedSeason].emoji} ${selectedSeason}`
      : `Typically in Season — ${monthName(selectedMonth)}`;
  productsContainer.textContent = "Loading products...";

  try {
    const products = await productsRequest;

    const searchTerm = searchInput.value.trim().toLowerCase();

    const matchesFilter = (product) =>
      filterMode === "season"
        ? product.season === selectedSeason
        : Array.isArray(product.availableMonths) &&
          product.availableMonths.includes(selectedMonth);

    inSeasonProducts = products
      .filter(
        (product) =>
          matchesFilter(product) && matchesSearch(product, searchTerm),
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    renderInSeason();

    const upcoming = products
      .filter((product) => matchesSearch(product, searchTerm))
      .map((product) => ({ product, month: nextAvailableMonth(product) }))
      .filter((entry) => entry.month !== null)
      .sort(
        (a, b) =>
          ((a.month - selectedMonth + 12) % 12) -
          ((b.month - selectedMonth + 12) % 12),
      )
      .slice(0, 6)
      .map((entry) => entry.product);

    renderGrid(
      upcomingContainer,
      upcoming,
      "Nothing else is coming back soon.",
    );
  } catch (error) {
    console.error("Error loading products:", error);
    productsContainer.textContent = "Unable to load products.";
  }
}

buildMonthFilter();
buildSeasonFilter();

searchInput.addEventListener("input", () => {
  currentPage = 1;
  loadSeasonalProducts();
});

pageSizeSelect.addEventListener("change", () => {
  pageSize = Number(pageSizeSelect.value) || 6;
  currentPage = 1;
  renderInSeason();
});

loadSeasonalProducts();

addProductButton.addEventListener("click", () => {
  editingProductId = null;

  addProductForm.reset();

  productDialogTitle.textContent = "Add Seasonal Product";
  saveProductButton.textContent = "Save Product";
  saveProductButton.disabled = false;

  addProductDialog.showModal();
});

closeProductDialog.addEventListener("click", () => {
  addProductDialog.close();
});

addProductForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const isEditing = editingProductId !== null;
  const productId = editingProductId;

  const formData = new FormData(addProductForm);

  const availableMonths = formData.getAll("availableMonths").map(Number);

  if (availableMonths.length === 0) {
    alert("Please select at least one month.");
    return;
  }

  const productData = {
    name: formData.get("name"),
    brand: formData.get("brand"),
    category: formData.get("category"),
    season: formData.get("season"),
    availableMonths,
    notes: formData.get("notes"),
  };

  if (!activeDemoUser) {
    alert("Please select a demo user to save products.");
    return;
  }

  productData.editedBy = activeDemoUser;

  const url = isEditing ? `/api/seasonal/${productId}` : "/api/seasonal";

  const method = isEditing ? "PUT" : "POST";

  saveProductButton.disabled = true;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to save product");
    }

    const products = await productsRequest;

    if (isEditing) {
      const index = products.findIndex((product) => product._id === productId);

      if (index !== -1) {
        products[index] = result.product;
      }
    } else {
      products.push(result.product);
    }

    filterMode = "month";
    selectedSeason = null;
    selectedMonth = availableMonths[0];
    currentPage = 1;
    searchInput.value = "";

    addProductForm.reset();
    addProductDialog.close();
    editingProductId = null;

    await loadSeasonalProducts();
  } catch (error) {
    console.error("Error saving product:", error);
    alert(error.message);
  } finally {
    saveProductButton.disabled = false;
  }
});

function updateUserControls() {
  const hasUser = activeDemoUser !== "";

  addProductButton.classList.toggle("d-none", !hasUser);

  const actionButtons = document.querySelectorAll(
    ".edit-product-button, .delete-product-button",
  );

  for (const button of actionButtons) {
    button.classList.toggle("d-none", !hasUser);
  }
}

onDemoUserChange((user) => {
  activeDemoUser = user ?? "";

  if (addProductDialog.open) {
    addProductDialog.close();
    editingProductId = null;
  }

  updateUserControls();
});

updateUserControls();
