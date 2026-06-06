export interface Insumo {
  id: string;
  name: string;
  emoji: string;
  category: string;
  ncm: string;
  basePrice: number;
  keywords: string[];
}

export type InsumoCategory = {
  id: string;
  name: string;
  emoji: string;
};

export const CATEGORIES: InsumoCategory[] = [
  { id: "agronegocio", name: "Agronegócio", emoji: "🌾" },
  { id: "energia", name: "Energia & Combustíveis", emoji: "⚡" },
  { id: "metais", name: "Metais & Mineração", emoji: "⛏️" },
  { id: "quimicos", name: "Químicos & Fertilizantes", emoji: "🧪" },
];

const INSUMOS_DATA: Insumo[] = [
  // ── AGRONEGÓCIO ──
  { id: "soja",              name: "Soja (Saca 60kg)",             emoji: "🌱", category: "agronegocio", ncm: "1201", basePrice: 13500, keywords: ["soja", "grao", "agronegocio"] },
  { id: "farelo_soja",       name: "Farelo de Soja (Ton)",         emoji: "🟤", category: "agronegocio", ncm: "2304", basePrice: 215000, keywords: ["farelo", "soja", "racao"] },
  { id: "milho",             name: "Milho (Saca 60kg)",            emoji: "🌽", category: "agronegocio", ncm: "1005", basePrice: 6500,  keywords: ["milho", "grao"] },
  { id: "trigo",             name: "Trigo (Ton)",                  emoji: "🌾", category: "agronegocio", ncm: "1001", basePrice: 145000, keywords: ["trigo", "farinha"] },
  { id: "cafe_arabica",      name: "Café Arábica (Saca 60kg)",     emoji: "☕", category: "agronegocio", ncm: "0901", basePrice: 125000, keywords: ["cafe", "arabica"] },
  { id: "acucar_vhp",        name: "Açúcar VHP (Ton)",             emoji: "🍬", category: "agronegocio", ncm: "1701", basePrice: 180000, keywords: ["acucar", "açúcar", "vhp", "cana"] },
  { id: "boi_gordo",         name: "Boi Gordo (@ 15kg)",           emoji: "🐂", category: "agronegocio", ncm: "0102", basePrice: 23500, keywords: ["boi", "carne", "arroba"] },
  { id: "frango_vivo",       name: "Frango Vivo (kg)",             emoji: "🍗", category: "agronegocio", ncm: "0105", basePrice: 520,   keywords: ["frango", "ave"] },
  { id: "algodao_pluma",     name: "Algodão em Pluma (lb)",        emoji: "☁️", category: "agronegocio", ncm: "5201", basePrice: 480,   keywords: ["algodao", "algodão", "pluma", "textil"] },
  { id: "celulose_fibra",    name: "Celulose Fibra Curta (Ton)",   emoji: "📜", category: "agronegocio", ncm: "4703", basePrice: 320000, keywords: ["celulose", "papel", "fibra"] },

  // ── ENERGIA & COMBUSTÍVEIS ──
  { id: "petroleo_brent",    name: "Petróleo Brent (Barril)",      emoji: "🛢️", category: "energia", ncm: "2709", basePrice: 42000, keywords: ["petroleo", "brent", "barril", "oil"] },
  { id: "petroleo_wti",      name: "Petróleo WTI (Barril)",        emoji: "🛢️", category: "energia", ncm: "2709", basePrice: 39000, keywords: ["petroleo", "wti", "barril", "oil"] },
  { id: "diesel_s10",        name: "Diesel S10 (Litro Refinaria)", emoji: "🚚", category: "energia", ncm: "2710", basePrice: 380,   keywords: ["diesel", "combustivel", "s10"] },
  { id: "etanol_hidratado",  name: "Etanol Hidratado (Litro)",     emoji: "⛽", category: "energia", ncm: "2207", basePrice: 240,   keywords: ["etanol", "alcool", "combustivel"] },
  { id: "gas_natural",       name: "Gás Natural (MMBtu)",          emoji: "🔥", category: "energia", ncm: "2711", basePrice: 1500,  keywords: ["gas", "gás", "gnl"] },
  { id: "energia_eletrica",  name: "Energia Elétrica PLD (MWh)",   emoji: "⚡", category: "energia", ncm: "2716", basePrice: 18000, keywords: ["energia", "eletrica", "mwh", "pld"] },

  // ── METAIS & MINERAÇÃO ──
  { id: "minerio_ferro",     name: "Minério de Ferro 62% (Ton)",   emoji: "🪨", category: "metais", ncm: "2601", basePrice: 65000, keywords: ["minerio", "ferro", "iron"] },
  { id: "aco_bobina",        name: "Aço - Bobina a Quente (Ton)",  emoji: "🏗️", category: "metais", ncm: "7208", basePrice: 450000, keywords: ["aco", "aço", "bobina", "siderurgia"] },
  { id: "aluminio",          name: "Alumínio Primário (Ton)",      emoji: "⚙️", category: "metais", ncm: "7601", basePrice: 1200000, keywords: ["aluminio", "alumínio"] },
  { id: "cobre",             name: "Cobre (Ton)",                  emoji: "🔌", category: "metais", ncm: "7403", basePrice: 4500000, keywords: ["cobre", "metal"] },
  { id: "ouro",              name: "Ouro (Onça Troy)",             emoji: "🪙", category: "metais", ncm: "7108", basePrice: 1100000, keywords: ["ouro", "gold"] },

  // ── QUÍMICOS & FERTILIZANTES ──
  { id: "ureia",             name: "Ureia Agrícola (Ton)",         emoji: "🧪", category: "quimicos", ncm: "3102", basePrice: 185000, keywords: ["ureia", "fertilizante", "nitrogenio"] },
  { id: "cloreto_potassio",  name: "Cloreto de Potássio KCL (Ton)",emoji: "🧂", category: "quimicos", ncm: "3104", basePrice: 160000, keywords: ["kcl", "potassio", "fertilizante"] },
  { id: "nafta",             name: "Nafta Petroquímica (Ton)",     emoji: "🛢️", category: "quimicos", ncm: "2710", basePrice: 320000, keywords: ["nafta", "petroquimica"] },
];

export const ALL_INSUMOS: Insumo[] = INSUMOS_DATA;

export const INSUMOS_MAP = new Map<string, Insumo>(ALL_INSUMOS.map(i => [i.id, i]));

export const INSUMOS_KEYWORDS = ALL_INSUMOS.flatMap(i => i.keywords);

export const INSUMOS_CATEGORIES = CATEGORIES;

export function getInsumoById(id: string): Insumo | undefined {
  return INSUMOS_MAP.get(id);
}

export function findInsumosByKeyword(text: string): Insumo[] {
  const lower = text.toLowerCase();
  return ALL_INSUMOS.filter(i => i.keywords.some(k => lower.includes(k)));
}

export function getCategoryLabel(categoryId: string): string {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  return cat ? `${cat.emoji} ${cat.name}` : categoryId;
}

export function getCategoryName(categoryId: string): string {
  return CATEGORIES.find(c => c.id === categoryId)?.name ?? categoryId;
}

export const INSUMOS_COUNT = ALL_INSUMOS.length;
