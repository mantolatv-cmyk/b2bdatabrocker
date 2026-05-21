import { ALL_INSUMOS } from "./insumos";

export interface NcmMapping {
  ncm: string;
  commodity: string;
  productName: string;
}

export const NCM_DATABASE: NcmMapping[] = ALL_INSUMOS
  .filter(i => i.ncm !== "")
  .map(i => ({
    ncm: i.ncm,
    commodity: i.id,
    productName: i.name,
  }));

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
