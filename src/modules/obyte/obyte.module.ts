import { Module } from '@nestjs/common';
import { ObyteService } from './obyte.service';
import { ObyteNetworkService } from './obyte-network.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [ObyteService, ObyteNetworkService],
  exports: [ObyteService, ObyteNetworkService],
})
export class ObyteModule {}
