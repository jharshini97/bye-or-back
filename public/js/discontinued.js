import { initDemoUser, getCurrentUser, onDemoUserChange } from "./demo-user.js";

function DiscontinuedProducts() {
  const me = {};
  const pageSize = 20;
  let page = 1;
  let editingId = null;
  let lastRequest = 0;

  const formSearch = document.querySelector("#formSearch");
  const formProduct = document.querySelector("#formProduct");
  const formTitle = document.querySelector("#formTitle");

  // Jharshini: alerts are appended and never cleared, so they pile up. Consider
  // replacing the previous one or auto-dismissing.
  me.showMessage = (message, type = "danger") => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `<div class="alert alert-${type} alert-dismissible" role="alert">
        <div>${message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    document.querySelector("#messages").append(wrapper);
  };

  // Shows the report tools only while a demo user is chosen
  const onChangeUser = (user) => {
    document.body.classList.toggle("no-user", !user);
    if (!user) formProduct.reset();
  };

  // Returns a callback that loads the product into the form
  const onEditProduct = (product) => () => {
    editingId = product._id;
    for (const input of formProduct.querySelectorAll("[name]")) {
      input.value = product[input.name] ?? "";
    }
    formTitle.textContent = "Edit the report";
    formProduct.elements.name.focus();
  };

  // Returns a callback that deletes the product
  const onDeleteProduct = (product) => async () => {
    if (!confirm(`Delete ${product.name}?`)) return;

    const res = await fetch(`/api/discontinued/${product._id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      me.showMessage("Error deleting the product");
      return;
    }
    if (product._id === editingId) formProduct.reset();
    me.showMessage("Product deleted", "warning");
    me.reloadProducts();
  };

  const createButton = (label, className, product, onClick) => {
    const button = document.createElement("button");
    button.className = `btn btn-sm me-2 needs-user ${className}`;
    button.textContent = label;
    button.ariaLabel = `${label} ${product.name}`;
    button.addEventListener("click", onClick(product));
    return button;
  };

  const renderProduct = (product) => {
    const card = document.createElement("article");
    card.className = "card mb-2";
    card.innerHTML = `<div class="card-body">
        <h3 class="card-title h6"></h3>
        <p class="card-text mb-1"></p>
        <p class="card-text small text-body-secondary"></p>
      </div>`;

    // textContent keeps user reports from injecting HTML
    const [title, details, notes] = card.querySelectorAll("h3, p");
    title.textContent = product.name;
    details.textContent = `${product.brand}, discontinued ${product.discontinuedDate || "on an unknown date"}`;
    notes.textContent = [
      product.category,
      product.notes,
      product.lastEditedBy && `Last edited by ${product.lastEditedBy}`,
    ]
      .filter(Boolean)
      .join(". ");

    card
      .querySelector(".card-body")
      .append(
        createButton("Edit", "btn-outline-primary", product, onEditProduct),
        createButton("Delete", "btn-outline-danger", product, onDeleteProduct),
      );
    return card;
  };

  // Renders the pages within 3 of the current page
  const renderPagination = (maxPage) => {
    const pagination = document.querySelector("#pagination");
    pagination.innerHTML = "";

    for (let i = Math.max(1, page - 3); i <= Math.min(maxPage, page + 3); i++) {
      const li = document.createElement("li");
      li.className = i === page ? "page-item active" : "page-item";
      const button = document.createElement("button");
      button.className = "page-link";
      button.textContent = i;
      if (i === page) button.ariaCurrent = "page";
      button.addEventListener("click", () => {
        page = i;
        me.reloadProducts();
      });
      li.append(button);
      pagination.append(li);
    }
  };

  // Jharshini: I like that you added the counter to stop older responses from overwriting
  // newer results
  me.reloadProducts = async () => {
    const request = ++lastRequest;
    const query = encodeURIComponent(formSearch.elements.query.value);
    // Jharshini: fetch throws on network failure, which skips the !res.ok branch
    const res = await fetch(
      `/api/discontinued?query=${query}&page=${page}&pageSize=${pageSize}`,
    );
    if (!res.ok) {
      me.showMessage("Error loading products");
      return;
    }

    const { products, total } = await res.json();
    // Drops a response that a newer search or page already replaced
    if (request !== lastRequest) return;
    // Steps back when a delete or an edit emptied the last page
    if (!products.length && page > 1) {
      page = Math.ceil(total / pageSize) || 1;
      return me.reloadProducts();
    }
    document.querySelector("#total").textContent = `Products found: ${total}`;
    document
      .querySelector("#products")
      .replaceChildren(...products.map(renderProduct));
    renderPagination(Math.ceil(total / pageSize));
  };

  const onSaveProduct = async (evt) => {
    evt.preventDefault();

    const res = await fetch(
      editingId ? `/api/discontinued/${editingId}` : "/api/discontinued",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(new FormData(formProduct)),
          editedBy: getCurrentUser(),
        }),
      },
    );
    if (!res.ok) {
      me.showMessage("Error saving the product");
      return;
    }
    me.showMessage(
      editingId ? "Report updated" : "Product reported",
      "success",
    );
    formProduct.reset();
    me.reloadProducts();
  };

  formProduct.addEventListener("submit", onSaveProduct);
  formProduct.addEventListener("reset", () => {
    editingId = null;
    formTitle.textContent = "Report a product";
  });
  formSearch.addEventListener("submit", (evt) => evt.preventDefault());
  formSearch.addEventListener("input", () => {
    page = 1;
    me.reloadProducts();
  });
  onDemoUserChange(onChangeUser);
  onChangeUser(getCurrentUser());

  return me;
}

const discontinuedProducts = DiscontinuedProducts();

initDemoUser();
discontinuedProducts.reloadProducts();
