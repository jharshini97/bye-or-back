function DiscontinuedProducts() {
  const me = {};
  const pageSize = 20;
  let page = 1;
  let editingId = null;

  const formSearch = document.querySelector("#formSearch");
  const formProduct = document.querySelector("#formProduct");
  const formTitle = document.querySelector("#form-title");

  me.showMessage = (message, type = "danger") => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `<div class="alert alert-${type} alert-dismissible" role="alert">
        <div>${message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    document.querySelector("#messages").append(wrapper);
  };

  // Returns a callback that loads the product into the form
  const onEditProduct = (product) => () => {
    editingId = product._id;
    for (const field of [
      "name",
      "brand",
      "category",
      "discontinuedDate",
      "notes",
    ]) {
      formProduct.elements[field].value = product[field] ?? "";
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
    me.showMessage("Product deleted", "warning");
    me.reloadProducts();
  };

  const createButton = (label, className, product, onClick) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `btn btn-sm me-2 ${className}`;
    button.textContent = label;
    button.ariaLabel = `${label} ${product.name}`;
    button.addEventListener("click", onClick(product));
    return button;
  };

  // Takes a product from the database and returns its card
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
    notes.textContent = [product.category, product.notes]
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
      const a = document.createElement("a");
      a.className = "page-link";
      a.href = "#";
      a.textContent = i;
      a.addEventListener("click", (evt) => {
        evt.preventDefault();
        page = i;
        me.reloadProducts();
      });
      li.append(a);
      pagination.append(li);
    }
  };

  me.reloadProducts = async () => {
    const query = encodeURIComponent(formSearch.elements.query.value);
    const res = await fetch(
      `/api/discontinued?query=${query}&page=${page}&pageSize=${pageSize}`,
    );
    if (!res.ok) {
      me.showMessage("Error loading products");
      return;
    }

    const { products, total } = await res.json();
    document.querySelector("#total").textContent = `${total} products found`;
    document
      .querySelector("#products")
      .replaceChildren(...products.map(renderProduct));
    renderPagination(Math.ceil(total / pageSize));
  };

  const onSaveProduct = async (evt) => {
    // Avoids reloading the page
    evt.preventDefault();

    const res = await fetch(
      editingId ? `/api/discontinued/${editingId}` : "/api/discontinued",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(formProduct))),
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

  return me;
}

const discontinuedProducts = DiscontinuedProducts();

discontinuedProducts.reloadProducts();
