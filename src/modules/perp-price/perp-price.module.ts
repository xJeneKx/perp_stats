import { Module } from '@nestjs/common';
import { PerpPriceService } from './perp-price.service';
import { PerpPriceController } from './perp-price.controller';
import { PerpPriceRepository } from './perp-price.repository';
import { ObyteModule } from '../obyte/obyte.module';
import { CoinGeckoModule } from '../coingecko/coingecko.module';

@Module({
  imports: [ObyteModule, CoinGeckoModule],
  controllers: [PerpPriceController],
  providers: [PerpPriceService, PerpPriceRepository],
  exports: [PerpPriceService],
})
export class PerpPriceModule {}
