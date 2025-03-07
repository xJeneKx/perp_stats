import { Injectable } from '@nestjs/common';
import { IPriceProvider, PriceData, PriceProviderParams } from '../interfaces/price-provider.interface';

@Injectable()
export abstract class AbstractPriceProviderService implements IPriceProvider {
  abstract getCoinIdBySymbol(symbol: string): string | null;

  abstract getMarketChartRange(params: PriceProviderParams): Promise<PriceData[]>;
}
