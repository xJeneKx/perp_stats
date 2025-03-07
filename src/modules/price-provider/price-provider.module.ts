import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AbstractPriceProviderService } from './providers/abstract-price-provider.service';
import { CoinGeckoPriceProviderService } from './providers/coingecko-price-provider.service';

@Module({
  imports: [],
  providers: [
    CoinGeckoPriceProviderService,
    {
      provide: AbstractPriceProviderService,
      useFactory: (configService: ConfigService) => {
        // For further price providers add here condition to choose what use
        return new CoinGeckoPriceProviderService(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [AbstractPriceProviderService],
})
export class PriceProviderModule {}
