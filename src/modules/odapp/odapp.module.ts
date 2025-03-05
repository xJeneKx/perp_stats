import { Module } from '@nestjs/common';
import { OdappService } from './odapp.service';

@Module({
  imports: [],
  providers: [OdappService],
  exports: [OdappService],
})
export class OdappModule {}
