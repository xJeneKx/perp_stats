import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PerpPriceModule } from './modules/perp-price/perp-price.module';
import { ObyteModule } from './modules/obyte/obyte.module';
import { CurrentDataModule } from './modules/current-data/current-data.module';
import { ScheduleModule } from '@nestjs/schedule';
import { OdappModule } from './modules/odapp/odapp.module';
import obyteConfig from './config/obyte.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [obyteConfig],
    }),
    ScheduleModule.forRoot(),
    ObyteModule,
    PerpPriceModule,
    CurrentDataModule,
    OdappModule,
  ],
})
export class AppModule {}
