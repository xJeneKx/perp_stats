import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoinGeckoService } from './coingecko.service';

@Module({
  imports: [ConfigModule],
  providers: [CoinGeckoService],
  exports: [CoinGeckoService],
})
export class CoinGeckoModule {}
