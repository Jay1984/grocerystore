import * as fs from "fs";
import * as path from "path";

const KEYWORDS = [
  "rice", "ghee", "oil", "tea", "coffee", "spices", "masala", "flour", "sugar",
  "salt", "lentils", "dal", "beans", "noodles", "pasta", "biscuits", "cookies",
  "chocolate", "juice", "water", "milk", "cheese", "butter", "yogurt", "bread",
  "chips", "snacks", "nuts", "honey", "jam", "ketchup", "sauce", "vinegar",
  "cereal", "oats", "chicken", "meat", "fish", "eggs", "fruits", "vegetables",
  "frozen", "ice cream", "baby food", "diapers", "shampoo", "soap", "detergent",
  "tissue", "cleaning", "toothpaste",
];

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  url: string;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function parseProducts(html: string, keyword: string): Product[] {
  const products: Product[] = [];

  const linkRegex = /href="(\/mafbhr\/en\/[^"]*\/p\/(\d+)[^"]*)"/g;
  const productUrls: { href: string; id: string }[] = [];
  const seen = new Set<string>();
  let m;
  while ((m = linkRegex.exec(html)) !== null) {
    if (!seen.has(m[2])) {
      seen.add(m[2]);
      productUrls.push({ href: m[1].split("?")[0], id: m[2] });
    }
  }

  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
    .replace(/\n{2,}/g, "\n").trim();

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  const pricePositions: { index: number; price: number }[] = [];
  for (let i = 0; i < lines.length - 3; i++) {
    if (
      /^\d+$/.test(lines[i]) &&
      lines[i + 1] === "." &&
      /^\d{2,3}$/.test(lines[i + 2]) &&
      lines[i + 3] === "BHD"
    ) {
      const price = parseFloat(lines[i] + "." + lines[i + 2]);
      if (!isNaN(price) && price > 0) {
        pricePositions.push({ index: i, price });
      }
    }
  }

  for (let pi = 0; pi < pricePositions.length; pi++) {
    const { index, price } = pricePositions[pi];
    let nameIndex = index - 1;
    while (
      nameIndex > 0 &&
      (/^[\d.]+\s*(g|gr|gm|kg|ml|l|litre|pieces?|tea bags?|bags?|counts?|tb|pcs|pack|rolls?|x\d+)$/i.test(lines[nameIndex]) ||
       /^only \d+ left$/i.test(lines[nameIndex]) ||
       /^(tue|mon|wed|thu|fri|sat|sun)\./i.test(lines[nameIndex]) ||
       lines[nameIndex] === "BHD" ||
       /^\d{2,3}$/.test(lines[nameIndex]) ||
       lines[nameIndex] === ".")
    ) {
      nameIndex--;
    }

    if (nameIndex < 0) continue;
    const name = lines[nameIndex];
    if (!name || name.length < 3 || name === "BHD" || /^\d+$/.test(name)) continue;

    const urlEntry = productUrls[pi] ?? null;
    products.push({
      id: urlEntry?.id ?? name.replace(/\s+/g, "-").toLowerCase().slice(0, 60),
      name,
      price,
      category: keyword,
      url: urlEntry ? `https://www.hypermax.com.bh${urlEntry.href}` : "",
    });
  }

  return products;
}

async function main() {
  const allProducts: Product[] = [];
  const seenIds = new Set<string>();

  for (const keyword of KEYWORDS) {
    process.stdout.write(`  ${keyword}: `);
    let page = 0;
    let keywordTotal = 0;

    while (page < 10) {
      await sleep(800);
      const url = `https://www.hypermax.com.bh/mafbhr/en/search?keyword=${encodeURIComponent(keyword)}&page=${page}`;
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36", Accept: "text/html" },
        });
        if (!res.ok) break;
        const html = await res.text();
        const products = parseProducts(html, keyword);
        if (products.length === 0) break;

        let newCount = 0;
        for (const p of products) {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            allProducts.push(p);
            newCount++;
          }
        }
        keywordTotal += newCount;
        if (newCount === 0) break;
        page++;
      } catch { break; }
    }
    console.log(`${keywordTotal} new products (total: ${allProducts.length})`);
  }

  const outDir = path.join(__dirname, "..", "scraped-data");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "hypermax.json"), JSON.stringify({
    retailer: "hypermax",
    scrapedAt: new Date().toISOString(),
    productsFound: allProducts.length,
    products: allProducts,
  }, null, 2));

  console.log(`\nTotal: ${allProducts.length} products saved`);
}

main().catch(console.error);
