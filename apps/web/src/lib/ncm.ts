export interface NcmMapping {
  ncm: string; // Formato padrão: e.g. "0401.20.10"
  commodity: string; // e.g. "leite"
  productName: string; // e.g. "Leite UHT"
}

export const NCM_DATABASE: NcmMapping[] = [
  { ncm: "1006.30.21", commodity: "arroz", productName: "Arroz Tipo 1" },
  { ncm: "0713.33.19", commodity: "feijao", productName: "Feijão Carioca" },
  { ncm: "0901.21.00", commodity: "cafe", productName: "Café Moído" },
  { ncm: "1101.00.10", commodity: "trigo", productName: "Pão de Forma / Trigo" },
  { ncm: "0401.20.10", commodity: "leite", productName: "Leite UHT" },
  { ncm: "0406.10.10", commodity: "queijo", productName: "Queijo Muçarela" },
  { ncm: "0201.30.00", commodity: "carne", productName: "Alcatra / Carne Bovina" },
  { ncm: "0207.11.00", commodity: "frango", productName: "Frango Inteiro" },
  { ncm: "1507.90.11", commodity: "oleo", productName: "Óleo de Soja" },
  { ncm: "1509.90.10", commodity: "azeite", productName: "Azeite de Oliva Extra Virgem" },
  { ncm: "1701.99.00", commodity: "acucar", productName: "Açúcar Refinado" },
  { ncm: "2203.00.00", commodity: "cerveja", productName: "Cerveja Pilsen" },
  { ncm: "3401.19.00", commodity: "sabao", productName: "Sabão em Pó" },
  { ncm: "1517.10.00", commodity: "margarina", productName: "Margarina (500g)" },
  { ncm: "1902.19.00", commodity: "macarrao", productName: "Macarrão Espaguete" },
  { ncm: "3306.10.00", commodity: "cremedental", productName: "Creme Dental" },
  { ncm: "4818.10.00", commodity: "papelhigienico", productName: "Papel Higiênico" },
  { ncm: "2710.19.21", commodity: "diesel", productName: "Óleo Diesel S10" }
];

/**
 * Normaliza uma string de NCM removendo pontos e espaços.
 */
export function normalizeNcm(ncm: string): string {
  return ncm.replace(/[\.\s-]/g, "");
}

/**
 * Encontra a commodity mapeada a partir de um NCM de 8 dígitos.
 */
export function getCommodityForNcm(ncm: string): NcmMapping | undefined {
  const normalizedInput = normalizeNcm(ncm);
  return NCM_DATABASE.find(item => normalizeNcm(item.ncm) === normalizedInput);
}
