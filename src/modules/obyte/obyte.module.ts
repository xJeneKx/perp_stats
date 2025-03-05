import { Module } from '@nestjs/common';
import { ObyteService } from './obyte.service';
import { ObyteNetworkService } from './obyte-network.service';

@Module({
  imports: [],
  providers: [ObyteService, ObyteNetworkService],
  exports: [ObyteService, ObyteNetworkService],
})
export class ObyteModule {}
