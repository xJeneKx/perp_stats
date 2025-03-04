import { Module } from '@nestjs/common';
import { CurrentDataService } from './current-data.service';
import { ScheduleModule } from '@nestjs/schedule';
import { PreparePythService } from './prepare-pyth.service';
import { ObyteModule } from '../obyte/obyte.module';
import { PerpPriceModule } from '../perp-price/perp-price.module';

@Module({
  imports: [ScheduleModule.forRoot(), ObyteModule, PerpPriceModule],
  providers: [CurrentDataService, PreparePythService],
  exports: [CurrentDataService, PreparePythService],
})
export class CurrentDataModule {}
