export interface MarketChartRangeParams {
  coinId: string;
  vsCurrency: string;
  from: number; // Unix timestamp
  to: number; // Unix timestamp
}

export interface PriceData {
  timestamp: number;
  price: number;
}

export interface MarketChartRangeResponse {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][]; // [timestamp, market_cap]
  total_volumes: [number, number][]; // [timestamp, volume]
}
