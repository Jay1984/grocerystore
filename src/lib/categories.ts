export interface SubCategory {
  id: string;
  name: string;
  parentId: string;
}

export interface UnifiedCategory {
  id: string;
  name: string;
  icon: string;
  children?: SubCategory[];
}

export const UNIFIED_CATEGORIES: UnifiedCategory[] = [
  {
    id: "dairy", name: "Dairy & Eggs", icon: "🥛",
    children: [
      { id: "dairy-milk", name: "Milk", parentId: "dairy" },
      { id: "dairy-yogurt", name: "Yogurt & Curd", parentId: "dairy" },
      { id: "dairy-cheese", name: "Cheese", parentId: "dairy" },
      { id: "dairy-butter", name: "Butter", parentId: "dairy" },
      { id: "dairy-cream", name: "Cream", parentId: "dairy" },
      { id: "dairy-eggs", name: "Eggs", parentId: "dairy" },
      { id: "dairy-powder", name: "Milk Powder", parentId: "dairy" },
      { id: "dairy-condensed", name: "Condensed & Evaporated Milk", parentId: "dairy" },
      { id: "dairy-flavored", name: "Flavored Milk", parentId: "dairy" },
      { id: "dairy-alternatives", name: "Dairy Alternatives", parentId: "dairy" },
    ],
  },
  {
    id: "rice", name: "Rice", icon: "🍚",
    children: [
      { id: "rice-basmati", name: "Basmati Rice", parentId: "rice" },
      { id: "rice-sona-masoori", name: "Sona Masoori Rice", parentId: "rice" },
      { id: "rice-ponni", name: "Ponni Rice", parentId: "rice" },
      { id: "rice-brown", name: "Brown Rice", parentId: "rice" },
      { id: "rice-other", name: "Other Rice", parentId: "rice" },
    ],
  },
  {
    id: "oil", name: "Cooking Oil", icon: "🫒",
    children: [
      { id: "oil-sunflower", name: "Sunflower Oil", parentId: "oil" },
      { id: "oil-mustard", name: "Mustard Oil", parentId: "oil" },
      { id: "oil-olive", name: "Olive Oil", parentId: "oil" },
      { id: "oil-coconut", name: "Coconut Oil", parentId: "oil" },
      { id: "oil-corn", name: "Corn Oil", parentId: "oil" },
      { id: "oil-vegetable", name: "Vegetable Oil", parentId: "oil" },
      { id: "oil-other", name: "Other Oil", parentId: "oil" },
    ],
  },
  {
    id: "tea-coffee", name: "Tea & Coffee", icon: "☕",
    children: [
      { id: "tea-coffee-tea", name: "Tea", parentId: "tea-coffee" },
      { id: "tea-coffee-coffee", name: "Coffee", parentId: "tea-coffee" },
      { id: "tea-coffee-herbal", name: "Herbal & Green Tea", parentId: "tea-coffee" },
    ],
  },
  {
    id: "spices", name: "Spices & Masala", icon: "🌶️",
    children: [
      { id: "spices-whole", name: "Whole Spices", parentId: "spices" },
      { id: "spices-powder", name: "Ground Spices", parentId: "spices" },
      { id: "spices-masala", name: "Masala Mixes", parentId: "spices" },
      { id: "spices-saffron", name: "Saffron", parentId: "spices" },
      { id: "spices-essences", name: "Essences & Food Color", parentId: "spices" },
      { id: "spices-other", name: "Other Spices", parentId: "spices" },
    ],
  },
  {
    id: "ghee", name: "Ghee", icon: "🧈",
  },
  {
    id: "pulses-beans", name: "Pulses & Beans", icon: "🫘",
    children: [
      { id: "pulses-dal", name: "Dal & Lentils", parentId: "pulses-beans" },
      { id: "pulses-beans-dried", name: "Dried Beans", parentId: "pulses-beans" },
      { id: "pulses-chickpeas", name: "Chickpeas & Chana", parentId: "pulses-beans" },
    ],
  },
  {
    id: "flour", name: "Flour & Wheat", icon: "🌾",
    children: [
      { id: "flour-atta", name: "Atta & Wheat Flour", parentId: "flour" },
      { id: "flour-maida", name: "Maida & All-Purpose", parentId: "flour" },
      { id: "flour-sooji", name: "Sooji & Semolina", parentId: "flour" },
      { id: "flour-besan", name: "Besan & Gram Flour", parentId: "flour" },
      { id: "flour-other", name: "Other Flour", parentId: "flour" },
    ],
  },
  {
    id: "sugar-salt", name: "Sugar, Salt & Jaggery", icon: "🧂",
    children: [
      { id: "sugar-salt-sugar", name: "Sugar", parentId: "sugar-salt" },
      { id: "sugar-salt-salt", name: "Salt", parentId: "sugar-salt" },
      { id: "sugar-salt-jaggery", name: "Jaggery & Gur", parentId: "sugar-salt" },
    ],
  },
  {
    id: "snacks", name: "Snacks & Chips", icon: "🍿",
    children: [
      { id: "snacks-chips", name: "Chips & Crisps", parentId: "snacks" },
      { id: "snacks-namkeen", name: "Namkeen & Mixture", parentId: "snacks" },
      { id: "snacks-mukhwas", name: "Mukhwas & Mouth Fresheners", parentId: "snacks" },
      { id: "snacks-other", name: "Other Snacks", parentId: "snacks" },
    ],
  },
  {
    id: "biscuits-cookies", name: "Biscuits & Cookies", icon: "🍪",
  },
  {
    id: "chocolate-candy", name: "Chocolate & Candy", icon: "🍫",
  },
  {
    id: "noodles-pasta", name: "Noodles & Pasta", icon: "🍜",
    children: [
      { id: "noodles-pasta-noodles", name: "Noodles", parentId: "noodles-pasta" },
      { id: "noodles-pasta-pasta", name: "Pasta & Macaroni", parentId: "noodles-pasta" },
      { id: "noodles-pasta-vermicelli", name: "Vermicelli & Sevai", parentId: "noodles-pasta" },
    ],
  },
  { id: "nuts-dry-fruits", name: "Nuts & Dry Fruits", icon: "🥜" },
  {
    id: "pickle-sauce", name: "Pickles, Sauces & Condiments", icon: "🫙",
    children: [
      { id: "pickle-sauce-pickle", name: "Pickles & Chutneys", parentId: "pickle-sauce" },
      { id: "pickle-sauce-sauce", name: "Sauces & Ketchup", parentId: "pickle-sauce" },
      { id: "pickle-sauce-paste", name: "Pastes", parentId: "pickle-sauce" },
      { id: "pickle-sauce-vinegar", name: "Vinegar", parentId: "pickle-sauce" },
    ],
  },
  {
    id: "jam-honey", name: "Jam, Honey & Spreads", icon: "🍯",
    children: [
      { id: "jam-honey-jam", name: "Jam & Marmalade", parentId: "jam-honey" },
      { id: "jam-honey-honey", name: "Honey", parentId: "jam-honey" },
      { id: "jam-honey-spreads", name: "Spreads", parentId: "jam-honey" },
    ],
  },
  {
    id: "frozen", name: "Frozen & Ice Cream", icon: "🧊",
    children: [
      { id: "frozen-ice-cream", name: "Ice Cream", parentId: "frozen" },
      { id: "frozen-food", name: "Frozen Food", parentId: "frozen" },
    ],
  },
  {
    id: "meat-fish", name: "Meat, Fish & Poultry", icon: "🍗",
    children: [
      { id: "meat-fish-chicken", name: "Chicken", parentId: "meat-fish" },
      { id: "meat-fish-meat", name: "Meat & Lamb", parentId: "meat-fish" },
      { id: "meat-fish-fish", name: "Fish & Seafood", parentId: "meat-fish" },
    ],
  },
  { id: "fruits-vegetables", name: "Fruits & Vegetables", icon: "🥦" },
  {
    id: "bread-cereal", name: "Bread, Cereal & Oats", icon: "🍞",
    children: [
      { id: "bread-cereal-bread", name: "Bread", parentId: "bread-cereal" },
      { id: "bread-cereal-cereal", name: "Cereal & Cornflakes", parentId: "bread-cereal" },
      { id: "bread-cereal-oats", name: "Oats & Muesli", parentId: "bread-cereal" },
    ],
  },
  {
    id: "beverages", name: "Beverages & Drinks", icon: "🧃",
    children: [
      { id: "beverages-juice", name: "Juice", parentId: "beverages" },
      { id: "beverages-water", name: "Water", parentId: "beverages" },
      { id: "beverages-soda", name: "Soft Drinks & Soda", parentId: "beverages" },
      { id: "beverages-syrups", name: "Syrups & Sharbat", parentId: "beverages" },
    ],
  },
  { id: "ready-to-cook", name: "Ready to Cook & Eat", icon: "🍲" },
  { id: "papad", name: "Papad & Appalams", icon: "🫓" },
  {
    id: "personal-care", name: "Personal Care", icon: "🧴",
    children: [
      { id: "personal-care-soap", name: "Soaps & Body Wash", parentId: "personal-care" },
      { id: "personal-care-shampoo", name: "Shampoo & Hair Care", parentId: "personal-care" },
      { id: "personal-care-dental", name: "Dental Care", parentId: "personal-care" },
      { id: "personal-care-skin", name: "Skin Care", parentId: "personal-care" },
      { id: "personal-care-other", name: "Other Personal Care", parentId: "personal-care" },
    ],
  },
  {
    id: "household", name: "Household & Cleaning", icon: "🧹",
    children: [
      { id: "household-detergent", name: "Detergent & Laundry", parentId: "household" },
      { id: "household-cleaning", name: "Cleaning Supplies", parentId: "household" },
      { id: "household-tissue", name: "Tissue & Paper", parentId: "household" },
    ],
  },
  {
    id: "baby", name: "Baby Care", icon: "👶",
    children: [
      { id: "baby-food", name: "Baby Food", parentId: "baby" },
      { id: "baby-diapers", name: "Diapers", parentId: "baby" },
    ],
  },
  { id: "health", name: "Health & Wellness", icon: "💊" },
  { id: "other", name: "Other", icon: "📦" },
];

// Build lookup maps
const UNIFIED_CATEGORY_MAP = new Map<string, UnifiedCategory>();
const SUBCATEGORY_MAP = new Map<string, SubCategory>();
const PARENT_OF_SUBCATEGORY = new Map<string, string>();
const ALL_CATEGORY_IDS = new Set<string>();

for (const cat of UNIFIED_CATEGORIES) {
  UNIFIED_CATEGORY_MAP.set(cat.id, cat);
  ALL_CATEGORY_IDS.add(cat.id);
  if (cat.children) {
    for (const sub of cat.children) {
      SUBCATEGORY_MAP.set(sub.id, sub);
      PARENT_OF_SUBCATEGORY.set(sub.id, cat.id);
      ALL_CATEGORY_IDS.add(sub.id);
    }
  }
}

export function getCategoryById(id: string): UnifiedCategory | undefined {
  return UNIFIED_CATEGORY_MAP.get(id);
}

export function getSubcategoryById(id: string): SubCategory | undefined {
  return SUBCATEGORY_MAP.get(id);
}

export function getParentId(categoryId: string): string | undefined {
  return PARENT_OF_SUBCATEGORY.get(categoryId);
}

export function isParentCategory(id: string): boolean {
  return UNIFIED_CATEGORY_MAP.has(id);
}

export function isSubcategory(id: string): boolean {
  return SUBCATEGORY_MAP.has(id);
}

export function getAllCategoryIds(): string[] {
  return [...ALL_CATEGORY_IDS];
}

export function getDescendantIds(parentId: string): string[] {
  const cat = UNIFIED_CATEGORY_MAP.get(parentId);
  if (!cat?.children) return [parentId];
  return [parentId, ...cat.children.map((c) => c.id)];
}

export function categoryMatchesFilter(productCategory: string, filterIds: string[]): boolean {
  if (filterIds.length === 0) return true;
  for (const fid of filterIds) {
    if (productCategory === fid) return true;
    const parent = PARENT_OF_SUBCATEGORY.get(productCategory);
    if (parent === fid) return true;
    if (fid === productCategory) return true;
    const cat = UNIFIED_CATEGORY_MAP.get(fid);
    if (cat?.children?.some((c) => c.id === productCategory)) return true;
  }
  return false;
}

// ── Retailer category maps ──

export const ALADIL_CATEGORY_MAP: Record<string, string> = {
  "RICE": "rice",
  "TEA & COFFEE": "tea-coffee",
  "SPICES": "spices",
  "GHEE": "ghee",
  "COOKING OIL": "oil",
  "PULSES & BEANS": "pulses-beans",
  "WHEAT & FLOURS": "flour",
  "SALT,SUGAR & JAGGERY": "sugar-salt",
  "SNACKS": "snacks",
  "MUKHWAS": "snacks-mukhwas",
  "BISCUITS & COOKIES": "biscuits-cookies",
  "CHOCOLATE & CANDY": "chocolate-candy",
  "NOODLES,PASTA,VERMICELLI": "noodles-pasta",
  "NUTS & DRY FRUITS": "nuts-dry-fruits",
  "PICKLE,PASTE,CHUTNEY": "pickle-sauce",
  "JAM, HONEY, KETCHUP": "jam-honey",
  "SYRUPS & SHARBAT": "beverages-syrups",
  "FREEZERS": "frozen",
  "READY TO COOK": "ready-to-cook",
  "PAPAD & APPALAMS": "papad",
  "SOAPS,SHAMPOO, BODY GEL": "personal-care-soap",
  "DENTAL CARE": "personal-care-dental",
  "HAIR OIL,GEL,CREAM": "personal-care-shampoo",
  "MEHANDI,HAIR COLOUR": "personal-care-other",
  "PERSONAL CARE": "personal-care",
  "HOUSEHOLD": "household",
  "HEALTH SUPPLIMENT": "health",
  "HERBAL ITEMS": "health",
  "SAFFRON": "spices-saffron",
  "ESSENCES & FOOD COLOR": "spices-essences",
  "HING & BAKING PD": "spices-other",
  "ORGANICS": "health",
  "AGARBATTI & DHOOPS": "other",
  "FESTIVAL ITEMS": "other",
  "POTS & POOJA ITEMS": "other",
  "PROMOTIONS": "other",
};

export const HYPERMAX_CATEGORY_MAP: Record<string, string> = {
  "rice": "rice",
  "tea": "tea-coffee-tea",
  "coffee": "tea-coffee-coffee",
  "spices": "spices",
  "masala": "spices-masala",
  "ghee": "ghee",
  "oil": "oil",
  "dal": "pulses-dal",
  "lentils": "pulses-dal",
  "beans": "pulses-beans-dried",
  "flour": "flour",
  "sugar": "sugar-salt-sugar",
  "salt": "sugar-salt-salt",
  "snacks": "snacks",
  "chips": "snacks-chips",
  "biscuits": "biscuits-cookies",
  "cookies": "biscuits-cookies",
  "chocolate": "chocolate-candy",
  "noodles": "noodles-pasta-noodles",
  "pasta": "noodles-pasta-pasta",
  "nuts": "nuts-dry-fruits",
  "ketchup": "pickle-sauce-sauce",
  "sauce": "pickle-sauce-sauce",
  "vinegar": "pickle-sauce-vinegar",
  "jam": "jam-honey-jam",
  "honey": "jam-honey-honey",
  "milk": "dairy-milk",
  "butter": "dairy-butter",
  "cheese": "dairy-cheese",
  "yogurt": "dairy-yogurt",
  "eggs": "dairy-eggs",
  "frozen": "frozen-food",
  "ice cream": "frozen-ice-cream",
  "chicken": "meat-fish-chicken",
  "meat": "meat-fish-meat",
  "fish": "meat-fish-fish",
  "fruits": "fruits-vegetables",
  "vegetables": "fruits-vegetables",
  "bread": "bread-cereal-bread",
  "cereal": "bread-cereal-cereal",
  "oats": "bread-cereal-oats",
  "juice": "beverages-juice",
  "water": "beverages-water",
  "shampoo": "personal-care-shampoo",
  "soap": "personal-care-soap",
  "toothpaste": "personal-care-dental",
  "cleaning": "household-cleaning",
  "detergent": "household-detergent",
  "tissue": "household-tissue",
  "baby food": "baby-food",
  "diapers": "baby-diapers",
};

// ── Title-based subcategory inference (used for LuLu and fallback) ──

const SUBCATEGORY_RULES: [RegExp, string][] = [
  // Dairy subcategories
  [/\byogurt\b|\bcurd\b|\blassi\b|\braita\b/i, "dairy-yogurt"],
  [/\bcheese\b|\bpaneer\b|\bmozzarella\b|\bcheddar\b|\bfeta\b/i, "dairy-cheese"],
  [/\bbutter\b(?!\s*milk)/i, "dairy-butter"],
  [/\bcream\b(?!\s*biscuit)/i, "dairy-cream"],
  [/\begg\b|\beggs\b/i, "dairy-eggs"],
  [/\bmilk\s*powder\b|\bpowder(?:ed)?\s*milk\b/i, "dairy-powder"],
  [/\bcondensed\s*milk\b|\bevaporated\s*milk\b/i, "dairy-condensed"],
  [/\bflavou?red\s*milk\b|\bchocolate\s*milk\b|\bstrawberry\s*milk\b/i, "dairy-flavored"],
  [/\balmond\s*milk\b|\boat\s*milk\b|\bsoy\s*milk\b|\bcoconut\s*milk\b/i, "dairy-alternatives"],
  [/\bmilk\b/i, "dairy-milk"],

  // Rice subcategories
  [/\bbasmati\b/i, "rice-basmati"],
  [/\bsona\s*masoori\b|\bsona\s*masuri\b/i, "rice-sona-masoori"],
  [/\bponni\b/i, "rice-ponni"],
  [/\bbrown\s*rice\b/i, "rice-brown"],

  // Oil subcategories
  [/\bsunflower\b/i, "oil-sunflower"],
  [/\bmustard\s*oil\b/i, "oil-mustard"],
  [/\bolive\b/i, "oil-olive"],
  [/\bcoconut\s*oil\b/i, "oil-coconut"],
  [/\bcorn\s*oil\b/i, "oil-corn"],
  [/\bvegetable\s*oil\b|\bcanola\b|\bsoybean\s*oil\b/i, "oil-vegetable"],

  // Tea/Coffee subcategories
  [/\bgreen\s*tea\b|\bherbal\s*tea\b|\bchamomile\b/i, "tea-coffee-herbal"],
  [/\bcoffee\b|\bnescafe\b|\bespresso\b/i, "tea-coffee-coffee"],
  [/\btea\b/i, "tea-coffee-tea"],

  // Spices subcategories
  [/\bmasala\b|\bgaram\s*masala\b|\bbiryani\s*masala\b|\bchaat\s*masala\b/i, "spices-masala"],
  [/\bsaffron\b|\bkesar\b/i, "spices-saffron"],
  [/\bessence\b|\bfood\s*colo/i, "spices-essences"],
  [/\bwhole\b.*\b(spice|cumin|coriander|pepper|cardamom|clove|cinnamon|bay\s*leaf)\b/i, "spices-whole"],

  // Pulses subcategories
  [/\bdal\b|\blentil\b|\btoor\b|\bmoong\b|\burad\b|\bmasoor\b/i, "pulses-dal"],
  [/\bchana\b|\bchickpea\b|\bkabuli\b/i, "pulses-chickpeas"],

  // Flour subcategories
  [/\batta\b|\bwheat\s*flour\b|\bchapati\b/i, "flour-atta"],
  [/\bmaida\b|\ball[\s-]*purpose\b/i, "flour-maida"],
  [/\bsooji\b|\bsemolina\b|\brava\b|\brawa\b/i, "flour-sooji"],
  [/\bbesan\b|\bgram\s*flour\b/i, "flour-besan"],

  // Sugar/Salt subcategories
  [/\bjaggery\b|\bgur\b/i, "sugar-salt-jaggery"],
  [/\bsalt\b/i, "sugar-salt-salt"],
  [/\bsugar\b/i, "sugar-salt-sugar"],

  // Snacks subcategories
  [/\bchips\b|\bcrisps\b|\blays\b|\bpringles\b/i, "snacks-chips"],
  [/\bnamkeen\b|\bmixture\b|\bbhujia\b|\bsev\b|\bmurukku\b/i, "snacks-namkeen"],
  [/\bmukhwas\b/i, "snacks-mukhwas"],

  // Noodles subcategories
  [/\bpasta\b|\bmacaroni\b|\bspaghetti\b|\bpenne\b|\bfusilli\b/i, "noodles-pasta-pasta"],
  [/\bvermicelli\b|\bsevai\b|\bseviyan\b/i, "noodles-pasta-vermicelli"],
  [/\bnoodle\b|\bmaggi\b|\bindomie\b/i, "noodles-pasta-noodles"],

  // Pickle/Sauce subcategories
  [/\bpickle\b|\bchutney\b|\bachar\b/i, "pickle-sauce-pickle"],
  [/\bsauce\b|\bketchup\b/i, "pickle-sauce-sauce"],
  [/\bpaste\b/i, "pickle-sauce-paste"],
  [/\bvinegar\b/i, "pickle-sauce-vinegar"],

  // Jam/Honey subcategories
  [/\bhoney\b/i, "jam-honey-honey"],
  [/\bjam\b|\bmarmalade\b/i, "jam-honey-jam"],
  [/\bspread\b|\bpeanut\s*butter\b|\bnutella\b/i, "jam-honey-spreads"],

  // Frozen subcategories
  [/\bice\s*cream\b/i, "frozen-ice-cream"],

  // Meat/Fish subcategories
  [/\bchicken\b/i, "meat-fish-chicken"],
  [/\bfish\b|\bprawn\b|\bshrimp\b|\btuna\b|\bsalmon\b/i, "meat-fish-fish"],
  [/\blamb\b|\bmutton\b|\bbeef\b|\bmeat\b/i, "meat-fish-meat"],

  // Bread/Cereal subcategories
  [/\boats\b|\boat\s*meal\b|\bmuesli\b|\bgranola\b/i, "bread-cereal-oats"],
  [/\bcereal\b|\bcornflakes\b|\bcorn\s*flakes\b/i, "bread-cereal-cereal"],
  [/\bbread\b|\btoast\b|\bbun\b|\bcroissant\b/i, "bread-cereal-bread"],

  // Beverages subcategories
  [/\bjuice\b|\bnectar\b/i, "beverages-juice"],
  [/\bwater\b/i, "beverages-water"],
  [/\bsoda\b|\bcola\b|\bpepsi\b|\bsprite\b|\bfanta\b|\blemonade\b/i, "beverages-soda"],
  [/\bsyrup\b|\bsharbat\b|\bsquash\b|\bcordial\b/i, "beverages-syrups"],

  // Personal care subcategories
  [/\bshampoo\b|\bhair\b|\bconditioner\b|\bhenna\b|\bmehndi\b/i, "personal-care-shampoo"],
  [/\btoothpaste\b|\btoothbrush\b|\bmouthwash\b|\bdental\b/i, "personal-care-dental"],
  [/\bsoap\b|\bbody\s*wash\b|\bshower\b/i, "personal-care-soap"],
  [/\bface\b|\blotion\b|\bsunscreen\b|\bmoisturi/i, "personal-care-skin"],

  // Household subcategories
  [/\bdetergent\b|\blaundry\b|\bfabric\s*soften/i, "household-detergent"],
  [/\btissue\b|\bpaper\s*towel\b|\bnapkin\b|\btoilet\s*paper\b/i, "household-tissue"],
  [/\bcleaner\b|\bbleach\b|\bdishwash\b|\bmop\b|\bfloor\b/i, "household-cleaning"],

  // Baby subcategories
  [/\bdiaper\b/i, "baby-diapers"],
  [/\bbaby\s*food\b|\bbaby\s*cereal\b|\binfant\s*formula\b/i, "baby-food"],
];

// Parent-level title rules (fallback when no subcategory matches)
const TITLE_KEYWORD_RULES: [RegExp, string][] = [
  [/\brice\b/i, "rice"],
  [/\bbasmati\b/i, "rice"],
  [/\bbiryani\b/i, "rice"],
  [/\btea\b/i, "tea-coffee"],
  [/\bcoffee\b/i, "tea-coffee"],
  [/\bmasala\b/i, "spices"],
  [/\bspice\b/i, "spices"],
  [/\bturmeric\b|\bcumin\b|\bcoriander\b|\bchilli\b|\bpepper\b|\bcardamom\b|\bclove\b|\bcinnamon\b/i, "spices"],
  [/\bghee\b/i, "ghee"],
  [/\boil\b/i, "oil"],
  [/\bdal\b|\blentil\b|\bchana\b|\btoor\b|\bmoong\b|\burad\b|\brajma\b|\bkabuli\b/i, "pulses-beans"],
  [/\bflour\b|\batta\b|\bmaida\b|\bsooji\b|\brava\b|\bsemolina\b|\bbesan\b/i, "flour"],
  [/\bsugar\b|\bjaggery\b|\bgur\b|\bsalt\b/i, "sugar-salt"],
  [/\bchips\b|\bsnack\b|\bnamkeen\b|\bmurukku\b|\bmixture\b|\bbhujia\b/i, "snacks"],
  [/\bbiscuit\b|\bcookie\b|\brusk\b/i, "biscuits-cookies"],
  [/\bchocolate\b|\bcandy\b|\btoffee\b/i, "chocolate-candy"],
  [/\bnoodle\b|\bpasta\b|\bvermicelli\b|\bsevai\b|\bspaghetti\b|\bmacaroni\b/i, "noodles-pasta"],
  [/\bnut\b|\balmond\b|\bcashew\b|\bpistachio\b|\bwalnut\b|\braisin\b|\bdry fruit\b|\bpeanut\b/i, "nuts-dry-fruits"],
  [/\bpickle\b|\bchutney\b|\bsauce\b|\bketchup\b|\bvinegar\b|\bpaste\b/i, "pickle-sauce"],
  [/\bjam\b|\bhoney\b|\bspread\b|\bmarmalade\b/i, "jam-honey"],
  [/\bmilk\b|\byogurt\b|\bcurd\b|\bpaneer\b|\bcheese\b|\bbutter\b|\bcream\b|\begg\b/i, "dairy"],
  [/\bfrozen\b|\bice cream\b/i, "frozen"],
  [/\bchicken\b|\bmeat\b|\bfish\b|\bprawn\b|\bshrimp\b|\blamb\b|\bmutton\b|\bbeef\b/i, "meat-fish"],
  [/\bfruit\b|\bvegetable\b|\btomato\b|\bonion\b|\bpotato\b|\bbanana\b|\bapple\b|\bmango\b/i, "fruits-vegetables"],
  [/\bbread\b|\bcereal\b|\boats\b|\bcornflakes\b|\bmuesli\b/i, "bread-cereal"],
  [/\bjuice\b|\bwater\b|\bdrink\b|\bsoda\b|\bsyrup\b|\bsharbat\b|\bsquash\b/i, "beverages"],
  [/\bpapad\b|\bappalam\b/i, "papad"],
  [/\bready to cook\b|\binstant\b|\bmix\b/i, "ready-to-cook"],
  [/\bshampoo\b|\bsoap\b|\btoothpaste\b|\bbody wash\b|\bface\b|\blotion\b|\bdeodorant\b/i, "personal-care"],
  [/\bdetergent\b|\bcleaner\b|\btissue\b|\bbleach\b|\bdishwash\b|\bmop\b/i, "household"],
  [/\bbaby\b|\bdiaper\b|\binfant\b/i, "baby"],
];

export function inferSubcategoryFromTitle(title: string): string | null {
  for (const [pattern, subId] of SUBCATEGORY_RULES) {
    if (pattern.test(title)) return subId;
  }
  return null;
}

export function inferCategoryFromTitle(title: string): string {
  const sub = inferSubcategoryFromTitle(title);
  if (sub) {
    return sub;
  }
  for (const [pattern, categoryId] of TITLE_KEYWORD_RULES) {
    if (pattern.test(title)) return categoryId;
  }
  return "other";
}

export function resolveToParent(categoryId: string): string {
  return PARENT_OF_SUBCATEGORY.get(categoryId) ?? categoryId;
}

export function getCategoryHierarchy(): UnifiedCategory[] {
  return UNIFIED_CATEGORIES;
}
