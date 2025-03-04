import { Injectable, Logger } from '@nestjs/common';
import { ObyteNetworkService } from './obyte-network.service';

interface AssetMetadata {
  name: string;
  decimals: number;
  asset: string;
  [key: string]: any;
}

@Injectable()
export class ObyteService {
  private readonly logger = new Logger(ObyteService.name);
  private exchangeRates: Record<string, number> = {};

  constructor(private readonly obyteNetworkService: ObyteNetworkService) {
    this.scheduleExchangeRatesUpdate();
  }

  private scheduleExchangeRatesUpdate(): void {
    this.updateExchangeRates();
    setInterval(() => this.updateExchangeRates(), 1000 * 60 * 5);
  }

  private async updateExchangeRates(): Promise<void> {
    try {
      this.exchangeRates = await this.getExchangeRates();
      this.logger.debug('Exchange rates updated');
    } catch (error) {
      this.logger.error(`Failed to update exchange rates: ${error.message}`);
    }
  }

  getExchangeRateByAsset(asset: string): number {
    return this.exchangeRates[`${asset}_USD`] || 0;
  }

  async getExchangeRates(): Promise<Record<string, number>> {
    try {
      return await this.obyteNetworkService.requestFromOcore('hub/get_exchange_rates');
    } catch (error) {
      this.logger.error(`Failed to get exchange rates: ${error.message}`);
      return {};
    }
  }

  async getAssetMetadata(asset: string): Promise<AssetMetadata | null> {
    if (asset === 'base') {
      return {
        name: 'GBYTE',
        decimals: 9,
        asset,
      };
    }

    try {
      const assetMetadata = await this.obyteNetworkService.requestFromOcore('hub/get_asset_metadata', asset);

      const jointResult = await this.getJoint(assetMetadata.metadata_unit);

      const metadata = jointResult.joint.unit.messages.find((item: any) => item.app === 'data');

      return { ...metadata.payload, asset };
    } catch (error) {
      this.logger.error(`Failed to get asset metadata for ${asset}: ${error.message}`);
      return null;
    }
  }

  async getJoint(unit: string): Promise<any> {
    return this.obyteNetworkService.requestFromOcore('get_joint', unit);
  }

  async getDefinition(aa: string): Promise<any> {
    return this.obyteNetworkService.requestFromOcore('light/get_definition', aa);
  }

  async getDataFeed(oracle: string, feedName: string, maxMci?: number, otherParams?: Record<string, number | string>): Promise<any> {
    let params: any = {
      oracles: [oracle],
      feed_name: feedName,
    };

    if (maxMci) {
      params.max_mci = maxMci;
    }

    if (otherParams) {
      params = { ...otherParams };
    }

    return this.obyteNetworkService.requestFromOcore('light/get_data_feed', params);
  }

  async getLastMCI() {
    return this.obyteNetworkService.requestFromOcore('get_last_mci');
  }

  async getAllAAResponses(aa: string, lastMci: number): Promise<any[]> {
    const allResponses: any[] = [];
    let latestMci = lastMci || 0;

    while (true) {
      const responses = await this.getAAResponses(aa, latestMci);
      if (responses.length === 0) break;
      allResponses.push(...responses);

      if (responses.length < 100) break;
      latestMci = responses[responses.length - 1].mci + 1;
    }

    return allResponses;
  }

  private async getAAResponses(aa: string, latestMci?: number): Promise<any[]> {
    const params: any = {
      aa: aa,
      order: 'ASC',
    };

    if (latestMci) {
      params.min_mci = latestMci;
    }

    return this.obyteNetworkService.requestFromOcore('light/get_aa_responses', params);
  }
}
