import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ObyteService } from './obyte.service';
import { ObyteNetworkService } from './obyte-network.service';
import obyteConfig from '../../config/obyte.config';

@Module({
  imports: [ConfigModule.forFeature(obyteConfig)],
  providers: [ObyteService, ObyteNetworkService],
  exports: [ObyteService, ObyteNetworkService],
})
export class ObyteModule {}
