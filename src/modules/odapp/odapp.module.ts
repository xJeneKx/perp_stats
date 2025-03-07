import { Module } from '@nestjs/common';
import { OdappService } from './odapp.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [OdappService],
  exports: [OdappService],
})
export class OdappModule {}
