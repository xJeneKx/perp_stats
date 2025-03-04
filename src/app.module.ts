import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PerpPriceModule } from './modules/perp-price/perp-price.module';
import { ObyteModule } from './modules/obyte/obyte.module';
import { CoinGeckoModule } from './modules/coingecko/coingecko.module';
import { CurrentDataModule } from './modules/current-data/current-data.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ObyteModule,
    PerpPriceModule,
    CoinGeckoModule,
    CurrentDataModule,
  ],
})
export class AppModule {}
