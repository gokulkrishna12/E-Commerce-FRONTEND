// Single source of truth for category metadata.
// `slug` maps to the local image file: /public/images/categories/{slug}.jpg
// `color` maps to a CSS accent defined in App.css (--cat-{color}, --cat-{color}-tint, --cat-{color}-dark)

export const CATEGORIES = [
  { name: "Electronics", slug: "electronics", color: "brown" },
  { name: "Fashion", slug: "fashion", color: "brown" },
  { name: "Home & Kitchen", slug: "home", color: "brown" },
  { name: "Sports", slug: "sports", color: "brown" },
  { name: "Books", slug: "books", color: "brown" },
  { name: "Beauty", slug: "beauty", color: "brown" },
];

export const getCategory = (name) => CATEGORIES.find((c) => c.name === name);

export const getCategoryColor = (name) => getCategory(name)?.color || "blue";

export const getCategoryImage = (name) => {
  const cat = getCategory(name);
  return `/images/categories/${cat ? cat.slug : "default"}.jpg`;
};
export const CATEGORY_HEX = {
  blue: "#2563eb",
  pink: "#ec4899",
  amber: "#f59e0b",
  green: "#16a34a",
  violet: "#7c3aed",
  coral: "#f97316",
};
