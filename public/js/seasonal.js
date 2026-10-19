const productsContainer = document.querySelector("#seasonal-products");
const seasonTitle = document.querySelector("#in-season-title");
const previousButton = document.querySelector("#previous-month");
const nextButton = document.querySelector("#next-month");
const searchInput = document.querySelector("#product-search");
const addProductButton = document.querySelector("#add-product-button");
const addProductDialog = document.querySelector("#add-product-dialog");
const closeProductDialog = document.querySelector("#close-product-dialog");
const addProductForm = document.querySelector("#add-product-form");
const saveProductButton = document.querySelector("#save-product-button");
const today = new Date();
let selectedMonth = today.getMonth() + 1;
const productDialogTitle = document.querySelector("#add-product-title");
let editingProductId = null;
const demoUserSelect = document.querySelector("#demo-user");

const demoUsers = ["Priya", "Lucy", "Tom", "Ben"];

const savedUser = sessionStorage.getItem("demoUser");

demoUserSelect.value = demoUsers.includes(savedUser) ? savedUser : "";

previousButton.addEventListener("click", () => {
  selectedMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  loadSeasonalProducts();
});

nextButton.addEventListener("click", () => {
  selectedMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
  loadSeasonalProducts();
});

const productsRequest = fetch("/api/seasonal").then((response) => {
  if (!response.ok) {
    throw new Error("Failed to retrieve products");
  }

  return response.json();
});
async function loadSeasonalProducts() {
  const monthName = new Date(
    today.getFullYear(),
    selectedMonth - 1,
    1,
  ).toLocaleString("en-US", {
    month: "long",
  });

  seasonTitle.textContent = `Typically in Season — ${monthName}`;

  productsContainer.textContent = "Loading products...";

  try {
    const products = await productsRequest;

    const searchTerm = searchInput.value.trim().toLowerCase();

    const currentProducts = products.filter((product) => {
      const matchesMonth =
        Array.isArray(product.availableMonths) &&
        product.availableMonths.includes(selectedMonth);

      const matchesSearch = [product.name, product.brand].some((value) =>
        (value ?? "").toLowerCase().includes(searchTerm),
      );

      return matchesMonth && matchesSearch;
    });

    currentProducts.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    productsContainer.replaceChildren();

    if (currentProducts.length === 0) {
      productsContainer.textContent = "No products found for this month.";
      return;
    }

    const productGrid = document.createElement("div");
    productGrid.classList.add("product-grid");

    for (const product of currentProducts) {
      const card = document.createElement("article");
      card.classList.add("product-card");

      const name = document.createElement("h3");
      name.textContent = product.name;

      const details = document.createElement("p");
      details.textContent = `${product.brand} · ${product.category}`;

      const status = document.createElement("p");
      status.textContent =
        product.seasonStatus === "estimated"
          ? "Estimated availability"
          : "Seasonal availability";

      const source = document.createElement("p");
      source.textContent = `Original source: ${product.source ?? "Unknown"}`;

      const lastEdited = document.createElement("p");
      lastEdited.textContent = product.lastEditedBy
        ? `Last edited by: ${product.lastEditedBy}`
        : "No community edits yet";

      card.append(name, details, status, source, lastEdited);

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.classList.add("edit-product-button");
      editButton.textContent = "Edit";
      editButton.hidden = demoUserSelect.value === "";

      editButton.addEventListener("click", () => {
        editingProductId = product._id;

        // Fill the form with the selected product's data.
        const fields = addProductForm.elements;

        fields.namedItem("name").value = product.name ?? "";
        fields.namedItem("brand").value = product.brand ?? "";
        fields.namedItem("category").value = product.category ?? "";
        fields.namedItem("season").value = product.season ?? "";
        fields.namedItem("notes").value = product.notes ?? "";

        // Select the product's available months.
        const months = new Set(product.availableMonths ?? []);

        const monthCheckboxes = addProductForm.querySelectorAll(
          'input[name="availableMonths"]',
        );

        for (const checkbox of monthCheckboxes) {
          checkbox.checked = months.has(Number(checkbox.value));
        }
        // Update the modal for editing.
        productDialogTitle.textContent = "Edit Seasonal Product";
        saveProductButton.textContent = "Save Changes";

        saveProductButton.disabled = false;

        addProductDialog.showModal();
      });

      card.appendChild(editButton);

      // Create the Delete button before attaching its event listener.
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.classList.add("delete-product-button");
      deleteButton.textContent = "Delete";
      deleteButton.hidden = demoUserSelect.value === "";

      deleteButton.addEventListener("click", async () => {
        if (!demoUserSelect.value) {
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

          // Remove the deleted product from our local array.
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

      card.appendChild(deleteButton);

      productGrid.appendChild(card);
    }

    productsContainer.appendChild(productGrid);
  } catch (error) {
    console.error("Error loading products:", error);
    productsContainer.textContent = "Unable to load products.";
  }
}
searchInput.addEventListener("input", loadSeasonalProducts);
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

  if (isEditing) {
    const selectedUser = demoUserSelect.value;

    if (!selectedUser) {
      alert("Please select a demo user to edit products.");
      return;
    }

    productData.editedBy = selectedUser;
  }

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

    selectedMonth = availableMonths[0];
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
  const hasUser = demoUserSelect.value !== "";

  // Show Add only when a demo user is selected.
  addProductButton.hidden = !hasUser;

  // Show or hide Edit and Delete buttons on existing cards.
  const actionButtons = document.querySelectorAll(
    ".edit-product-button, .delete-product-button",
  );

  for (const button of actionButtons) {
    button.hidden = !hasUser;
  }
}

demoUserSelect.addEventListener("change", () => {
  const selectedUser = demoUserSelect.value;

  if (selectedUser) {
    sessionStorage.setItem("demoUser", selectedUser);
  } else {
    sessionStorage.removeItem("demoUser");
  }

  updateUserControls();
});

updateUserControls();
