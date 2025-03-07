import { Module } from '@nestjs/common';
import { PerpPriceService } from './perp-price.service';
import { PerpPriceController } from './perp-price.controller';
import { PerpPriceRepository } from './perp-price.repository';
import { ObyteModule } from '../obyte/obyte.module';
import { PriceProviderModule } from '../price-provider/price-provider.module';
import { OdappModule } from '../odapp/odapp.module';

@Module({
  imports: [ObyteModule, PriceProviderModule, OdappModule],
  controllers: [PerpPriceController],
  providers: [PerpPriceService, PerpPriceRepository],
  exports: [PerpPriceService],
})
export class PerpPriceModule {}
