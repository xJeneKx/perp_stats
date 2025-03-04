import { Injectable, Logger } from '@nestjs/common';
import { ObyteService } from '../obyte/obyte.service';
import eventBus from 'ocore/event_bus';
import { PerpPriceDto } from './dto/perp-price.dto';
import { PerpPriceRepository } from './perp-price.repository';
import { CoinGeckoService } from '../coingecko/coingecko.service';
import { getTimestamp30DaysAgo } from '../../utils/date.utils';
import { MarketChartRangeParams, PriceData } from '../coingecko/interfaces/coingecko.interfaces';

@Injectable()
export class PerpPriceService {
  private readonly logger = new Logger(PerpPriceService.name);

  constructor(
    private readonly obyteService: ObyteService,
    private readonly perpPriceRepository: PerpPriceRepository,
    private readonly coinGeckoService: CoinGeckoService,
  ) {
    this.subscribeToAAResponses();
  }

  private subscribeToAAResponses(): void {
    eventBus.on('aa_response', (responseFromEvent: any) => {
      this.handleAAResponse(responseFromEvent);
    });
  }

  async getLastMci(): Promise<number> {
    return this.perpPriceRepository.getLastMci();
  }

  async savePrice(data: PerpPriceDto): Promise<boolean> {
    return this.perpPriceRepository.savePrice(data);
  }

  async getLastWeekPrices(asset: string, tzOffset?: string): Promise<any[]> {
    return this.perpPriceRepository.getLastWeekPrices(asset, tzOffset);
  }

  async getLastMonthPrices(asset: string): Promise<any[]> {
    return this.perpPriceRepository.getLastMonthPrices(asset);
  }

  private async handleAAResponse(responseFromEvent: any): Promise<void> {
    const { mci, aa_address, trigger_unit, bounced, response, timestamp } = responseFromEvent;

    if (bounced) return;

    const { responseVars } = response;
    if (!responseVars || responseVars.price === undefined) return;

    const priceFromResponse = responseVars.price;

    try {
      const { joint } = await this.obyteService.getJoint(trigger_unit);
      const dataFromRequest = joint.unit.messages.find(({ app }: { app: string }) => app === 'data');

      if (!dataFromRequest || !dataFromRequest.payload?.asset) return;

      const asset = dataFromRequest.payload.asset;
      const assetMetadata = await this.obyteService.getAssetMetadata(asset);

      if (!assetMetadata) return;

      const aaDefinition = await this.obyteService.getDefinition(aa_address);
      if (!aaDefinition || !aaDefinition[1] || !aaDefinition[1].params) return;

      const reserve_asset = aaDefinition[1].params.reserve_asset;
      const reserve_price_aa = aaDefinition[1].params.reserve_price_aa;

      const reserve_price_aa_definition = await this.obyteService.getDefinition(reserve_price_aa);
      if (!reserve_price_aa_definition || !reserve_price_aa_definition[1]) return;

      let reservePrice = 0;
      let notForUse = 0;

      if (reserve_price_aa_definition[1].params.oswap_aa) {
        reservePrice = this.obyteService.getExchangeRateByAsset(reserve_asset);
        notForUse = 1;
      } else {
        const oracle = reserve_price_aa_definition[1].params.oracle;
        const feed_name = reserve_price_aa_definition[1].params.feed_name;
        const decimals = reserve_price_aa_definition[1].params.decimals;
        const oracle_price = await this.obyteService.getDataFeed(oracle, feed_name, mci);
        reservePrice = oracle_price / 10 ** decimals;
      }

      const price = reservePrice * priceFromResponse * 10 ** assetMetadata.decimals;
      this.logger.log(`Processed price: ${assetMetadata.decimals}`);

      await this.savePrice({
        aaAddress: aa_address,
        mci,
        asset,
        notForUse,
        price,
        priceFromResponse,
        timestamp,
      });
    } catch (error) {
      this.logger.error(`Error in handleAAResponse: ${error.message}`);
    }
  }

  async initializeHistoricalData(): Promise<void> {
    const lastMci = await this.getLastMci();
    this.logger.log(`Initializing historical data from MCI ${lastMci}`);

    try {
      const obyteNetworkService = this.obyteService['obyteNetworkService'];
      const configService = obyteNetworkService['configService'];
      const baseAAs = configService.get<string[]>('obyte.baseAAs', []);
      const aas = await obyteNetworkService.getAAsFromBaseAAs(baseAAs);

      const promises = aas.map(aa => this.processHistoricalResponses(aa, lastMci));
      await Promise.all(promises);

      this.logger.log('Historical data initialization completed');

      await this.fillEmptyDates(lastMci);
    } catch (error) {
      this.logger.error(`Failed to initialize historical data: ${error.message}`);
    }
  }

  private async processHistoricalResponses(aa: string, lastMci: number): Promise<void> {
    try {
      const responses = await this.obyteService.getAllAAResponses(aa, lastMci);
      this.logger.log(`Processing ${responses.length} historical responses for AA ${aa}`);

      const batchSize = 50;
      const batches = Math.ceil(responses.length / batchSize);

      for (let i = 0; i < batches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, responses.length);
        const batchResponses = responses.slice(start, end);

        for (const response of batchResponses) {
          await this.handleAAResponse(response);
        }
      }
    } catch (error) {
      this.logger.error(`Error processing historical responses for AA ${aa}: ${error.message}`);
    }
  }

  private async fillEmptyDates(lastMci: number): Promise<void> {
    const timestamp = await this.perpPriceRepository.getTimestampByMci(lastMci);
    const timestamp30DaysAgo = getTimestamp30DaysAgo();

    const usedTimestamp = timestamp < timestamp30DaysAgo ? timestamp30DaysAgo : timestamp;

    const notSwapPyth = await this.perpPriceRepository.getUniqNotSwapPyth();

    for (const pyth of notSwapPyth) {
      await this.fillPythHistoryFromCoingecko(pyth, usedTimestamp, lastMci);
    }
  }

  private async fillPythHistoryFromCoingecko(pythAddress: string, startTimestamp: number, lastMci: number): Promise<void> {
    const endTimestamp = Math.floor(Date.now() / 1000);

    const aaDefinition = await this.obyteService.getDefinition(pythAddress);
    if (!aaDefinition || !aaDefinition[1] || !aaDefinition[1].params) return;

    const reserve_price_aa = aaDefinition[1].params.reserve_price_aa;
    const reserve_price_aa_definition = await this.obyteService.getDefinition(reserve_price_aa);
    if (!reserve_price_aa_definition || !reserve_price_aa_definition[1]) return;

    const feedName = reserve_price_aa_definition[1].params.feed_name;
    if (!feedName) {
      this.logger.warn(`No feed_name found for reserve_price_aa ${reserve_price_aa}`);
      return;
    }

    const symbol = feedName.split('_')[0];
    const coingeckoId = this.coinGeckoService.getCoinIdBySymbol(symbol);
    if (!coingeckoId) return;

    this.logger.log(`Fetching price data for ${coingeckoId} from ${startTimestamp} to ${endTimestamp}`);

    const params: MarketChartRangeParams = {
      coinId: coingeckoId,
      vsCurrency: 'usd',
      from: startTimestamp,
      to: endTimestamp,
    };

    try {
      const priceData: PriceData[] = await this.coinGeckoService.getMarketChartRange(params);

      this.logger.log(`Fetched price data for ${coingeckoId} from ${startTimestamp} to ${endTimestamp}: ${priceData?.length || 0} points`);

      if (!priceData || priceData.length === 0) {
        this.logger.warn(`No price data returned for ${coingeckoId}`);
        return;
      }

      const assets = await this.perpPriceRepository.getAssetsByPyth(pythAddress);
      if (!assets || assets.length === 0) {
        this.logger.warn(`No assets found for Pyth address ${pythAddress}`);
        return;
      }

      this.logger.log(`Found ${assets.length} assets for Pyth ${pythAddress}: ${assets.join(', ')}`);

      for (const asset of assets) {
        this.logger.log(`Processing price data for ${asset} from ${pythAddress}`);
        await this.fillAssetHistory(pythAddress, asset, priceData, lastMci);
        this.logger.log(`Finished processing price data for ${asset} from ${pythAddress}`);
      }
    } catch (error) {
      this.logger.error(`Error in fillPythHistoryFromCoingecko: ${error.message}`, error.stack);
    }
  }

  private async fillAssetHistory(pythAddress: string, asset: string, priceData: PriceData[], lastMci: number): Promise<void> {
    try {
      const priceFromResponse = await this.perpPriceRepository.getLastPriceFromResponse(pythAddress, asset);

      this.logger.log(`Processing ${priceData.length} price points for asset ${asset}`);

      const dataForSave: PerpPriceDto[] = [];
      for (const data of priceData) {
        const { timestamp, price: reservePrice } = data;
        const price = reservePrice * priceFromResponse;

        dataForSave.push({
          aaAddress: pythAddress,
          mci: lastMci,
          asset,
          notForUse: 0,
          price,
          priceFromResponse,
          timestamp,
        });
      }

      this.logger.log(`Saving ${dataForSave.length} price points for asset ${asset}`);
      await this.perpPriceRepository.savePricesInBulk(dataForSave);
    } catch (error) {
      this.logger.error(`Error in fillAssetHistory for ${asset}: ${error.message}`, error.stack);
    }
  }
}
