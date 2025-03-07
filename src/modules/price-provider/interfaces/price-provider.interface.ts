export interface PriceProviderParams {
  coinId: string;
  vsCurrency: string;
  from: number; // Unix timestamp
  to: number; // Unix timestamp
}

export interface PriceData {
  timestamp: number;
  price: number;
}

export interface IPriceProvider {
  /**
   * Get the provider ID for a given symbol
   * @param symbol Asset symbol (e.g., 'BTC', 'ETH')
   * @returns The provider-specific ID for the symbol, or null if not found
   */
  getCoinIdBySymbol(symbol: string): string | null;

  /**
   * Get historical price data for a specific time range
   * @param params Parameters including coinId, currency, and time range
   * @returns Array of price data points with timestamps
   */
  getMarketChartRange(params: PriceProviderParams): Promise<PriceData[]>;
}
