import { Controller, Get, Query, Logger } from '@nestjs/common';
import { PerpPriceService } from './perp-price.service';
import { GetPerpPriceQueryDto, PerpPriceResponseDto } from './dto/perp-price.dto';

@Controller('api')
export class PerpPriceController {
  private readonly logger = new Logger(PerpPriceController.name);

  constructor(private readonly perpPriceService: PerpPriceService) {}

  private mapToDto(record: any): PerpPriceResponseDto {
    return {
      price: record.usdPrice,
      timestamp: record.timestamp,
    };
  }

  @Get('lastWeek')
  async getLastWeekPrices(@Query() query: GetPerpPriceQueryDto): Promise<PerpPriceResponseDto[]> {
    this.logger.log(`Getting last week prices for asset: ${query.asset}`);
    const records = await this.perpPriceService.getLastWeekPrices(query.asset, query.tzOffset);
    return records.map(record => this.mapToDto(record));
  }

  @Get('lastMonth')
  async getLastMonthPrices(@Query() query: GetPerpPriceQueryDto): Promise<PerpPriceResponseDto[]> {
    this.logger.log(`Getting last month prices for asset: ${query.asset}`);
    const records = await this.perpPriceService.getLastMonthPrices(query.asset);

    if (!records || !Array.isArray(records)) {
      this.logger.warn(`Received non-array data from getLastMonthPrices: ${typeof records}`);
      return [];
    }

    return records.map(record => this.mapToDto(record));
  }
}
