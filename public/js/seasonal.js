
const productsContainer = document.querySelector("#seasonal-products");
const seasonTitle = document.querySelector("#in-season-title");
const previousButton = document.querySelector("#previous-month");
const nextButton = document.querySelector("#next-month");
const searchInput = document.querySelector("#product-search");
const today = new Date();
let selectedMonth = today.getMonth() + 1;

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
    1
  ).toLocaleString("en-US", {
    month: "long"
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

    const matchesSearch = [product.name, product.brand].some(
        (value) => (value ?? "").toLowerCase().includes(searchTerm)
    );

    return matchesMonth && matchesSearch;
    });


    productsContainer.replaceChildren();

    if (currentProducts.length === 0) {
      productsContainer.textContent = "No products found for this month.";
      return;
    }

    const productList = document.createElement("ul");

    for (const product of currentProducts) {
      const listItem = document.createElement("li");

      const productName = document.createElement("strong");
      productName.textContent = product.name;

      const brand = document.createElement("span");
      brand.textContent = ` — ${product.brand}`;

      listItem.append(productName, brand);
      productList.appendChild(listItem);
    }

    productsContainer.appendChild(productList);
  } catch (error) {
    console.error("Error loading products:", error);
    productsContainer.textContent = "Unable to load products.";
  }
}
searchInput.addEventListener("input", loadSeasonalProducts);
loadSeasonalProducts();
