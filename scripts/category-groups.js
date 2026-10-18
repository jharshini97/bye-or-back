export const categoryGroups =  {
  "Sweets & Candy": [
    "Candy",
    "Chocolate"
  ],

  "Bakery & Baking": [
    "Cookies & Biscuits",
    "Biscuits/Cookies",
    "Cakes, Cupcakes, Snack Cakes",
    "Cake, Cookie & Cupcake Mixes",
    "Baking Decorations & Dessert Toppings",
    "Breads & Buns"
  ],

  "Drinks": [
    "Powdered Drinks",
    "Fruit & Vegetable Juice, Nectars & Fruit Drinks",
    "Plant Based Water",
    "Iced & Bottle Tea",
    "Water",
    "Milk Additives",
    "Liquid Water Enhancer",
    "Soda"
  ],

  "Frozen Desserts": [
    "Ice Cream & Frozen Yogurt",
    "Other Frozen Desserts"
  ],

  "Dairy & Alternatives": [
    "Milk",
    "Yogurt",
    "Cream",
    "Plant Based Milk"
  ],

  "Snacks": [
    "Snack, Energy & Granola Bars",
    "Chips, Pretzels & Snacks",
    "Other Snacks",
    "Wholesome Snacks"
  ],

  "Breakfast & Cereal": [
    "Cereal"
  ],

  "Pantry & Prepared Foods": [
    "Pasta by Shape & Type",
    "Canned Seafood",
    "Meat/Poultry/Other Animals  Prepared/Processed"
  ],

  "Produce": [
    "Pre-Packaged Fruit & Vegetables"
  ],

  "Other / Uncategorized": [
    "Uncategorized"
  ]
};

export function normalizeCategory(originalCategory) {
  const category = originalCategory?.trim() || "Uncategorized";

  for (const [generalCategory, originalCategories]
    of Object.entries(categoryGroups)) {

    if (originalCategories.includes(category)) {
      return generalCategory;
    }
  }

  return null;
}
