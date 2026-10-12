// This script outputs instructions for browser-based LuLu scraping
// Since LuLu blocks server-side requests, we extract data via browser page text

const LULU_KEYWORDS = [
  "tea", "coffee", "ghee", "rice", "oil", "spices", "masala", "flour",
  "sugar", "salt", "lentils", "dal", "beans", "noodles", "pasta",
  "biscuits", "cookies", "chocolate", "juice", "water", "milk",
  "cheese", "butter", "yogurt", "bread", "chips", "snacks", "nuts",
  "honey", "jam", "ketchup", "sauce", "cereal", "oats", "chicken",
  "meat", "fish", "eggs", "frozen", "ice cream", "baby", "shampoo",
  "soap", "detergent", "tissue", "cleaning",
];

console.log("LuLu search URLs to scrape via browser:");
for (const kw of LULU_KEYWORDS) {
  console.log(`  https://gcc.luluhypermarket.com/en-bh/list/?search_text=${encodeURIComponent(kw)}`);
}
console.log(`\nTotal keywords: ${LULU_KEYWORDS.length}`);
console.log("Each keyword can have multiple pages (20 products per page)");
console.log("Use pagination: &page=2, &page=3, etc.");
