import { Module } from '@nestjs/common';
import { CurrentDataService } from './current-data.service';
import { PreparePythService } from './prepare-pyth.service';
import { ObyteModule } from '../obyte/obyte.module';
import { PerpPriceModule } from '../perp-price/perp-price.module';
import { OdappModule } from '../odapp/odapp.module';

@Module({
  imports: [ObyteModule, PerpPriceModule, OdappModule],
  providers: [CurrentDataService, PreparePythService],
  exports: [CurrentDataService, PreparePythService],
})
export class CurrentDataModule {}
