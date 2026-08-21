export interface CatalogPackageSeed {
  priceIqd: number;
  balance: number;
}

export const mastercardWahoPackages: CatalogPackageSeed[] = [
  { priceIqd: 10_000, balance: 60_000 },
  { priceIqd: 15_000, balance: 100_000 },
  { priceIqd: 20_000, balance: 125_000 },
  { priceIqd: 25_000, balance: 155_000 },
  { priceIqd: 50_000, balance: 310_000 },
  { priceIqd: 75_000, balance: 500_000 },
  { priceIqd: 100_000, balance: 620_000 },
  { priceIqd: 150_000, balance: 1_000_000 },
];

export const asiacellWahoPackages: CatalogPackageSeed[] = [
  { priceIqd: 5_000, balance: 28_000 },
  { priceIqd: 10_000, balance: 55_000 },
  { priceIqd: 15_000, balance: 83_000 },
  { priceIqd: 25_000, balance: 138_000 },
  { priceIqd: 30_000, balance: 165_000 },
  { priceIqd: 50_000, balance: 275_000 },
];
